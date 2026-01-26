const express = require("express");
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/* ================= DASHBOARD STATS (ADMIN) ================= */

router.get(
  "/dashboard",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    // User counts
    const [userCounts] = await pool.query(`
      SELECT 
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'caretaker' THEN 1 ELSE 0 END) as caretakers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `);

    // Complaint counts
    const [complaintCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
      FROM complaints
    `);

    // Room stats
    const [roomStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_rooms,
        SUM(capacity) as total_capacity,
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND room_no IS NOT NULL) as occupied_beds
      FROM rooms
    `);

    // Hostel-wise complaints
    const [hostelComplaints] = await pool.query(`
      SELECT u.hostel, COUNT(c.id) as count
      FROM complaints c
      JOIN users u ON u.college_id = c.student_id
      GROUP BY u.hostel
    `);

    // Weekly trend (last 7 days)
    const [weeklyTrend] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM complaints
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Monthly trend (last 6 months)
    const [monthlyTrend] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as resolved
      FROM complaints
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);

    res.json({
      success: true,
      data: {
        users: userCounts[0],
        complaints: complaintCounts[0],
        rooms: roomStats[0],
        hostelComplaints,
        weeklyTrend,
        monthlyTrend,
      },
    });
  }),
);

/* ================= CARETAKER STATS ================= */

router.get(
  "/caretaker",
  auth(["caretaker"]),
  asyncHandler(async (req, res) => {
    const caretaker = req.user.college_id;

    // Complaint stats
    const [stats] = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN priority = 'urgent' AND status = 'pending' THEN 1 ELSE 0 END) as urgent_pending
      FROM complaints
      WHERE assigned_to = ?
    `,
      [caretaker],
    );

    // Assigned students count
    const [studentCount] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE assigned_caretaker = ?",
      [caretaker],
    );

    // Recent activity
    const [recentActivity] = await pool.query(
      `
      SELECT c.id, c.message, c.status, c.created_at, u.name as student_name
      FROM complaints c
      JOIN users u ON u.college_id = c.student_id
      WHERE c.assigned_to = ?
      ORDER BY c.updated_at DESC
      LIMIT 5
    `,
      [caretaker],
    );

    // Weekly resolution rate
    const [weeklyStats] = await pool.query(
      `
      SELECT 
        DATE(updated_at) as date,
        SUM(CASE WHEN status IN ('approved', 'rejected') THEN 1 ELSE 0 END) as resolved
      FROM complaints
      WHERE assigned_to = ? AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(updated_at)
      ORDER BY date
    `,
      [caretaker],
    );

    res.json({
      success: true,
      data: {
        stats: stats[0],
        studentCount: studentCount[0].count,
        recentActivity,
        weeklyStats,
      },
    });
  }),
);

/* ================= STUDENT STATS ================= */

router.get(
  "/student",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    const student = req.user.college_id;

    // Complaint stats
    const [stats] = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM complaints
      WHERE student_id = ?
    `,
      [student],
    );

    res.json({
      success: true,
      data: stats[0],
    });
  }),
);

/* ================= PRIORITY BREAKDOWN ================= */

router.get(
  "/priority",
  auth(["admin", "caretaker"]),
  asyncHandler(async (req, res) => {
    let query = `
      SELECT priority, status, COUNT(*) as count
      FROM complaints
    `;
    const params = [];

    if (req.user.role === "caretaker") {
      query += " WHERE assigned_to = ?";
      params.push(req.user.college_id);
    }

    query += " GROUP BY priority, status";

    const [breakdown] = await pool.query(query, params);

    res.json({ success: true, data: breakdown });
  }),
);

/* ================= TOP COMPLAINT CATEGORIES ================= */

router.get(
  "/categories",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    // Extract common keywords from complaints
    const [categories] = await pool.query(`
      SELECT 
        CASE 
          WHEN LOWER(message) LIKE '%water%' THEN 'Water'
          WHEN LOWER(message) LIKE '%electric%' OR LOWER(message) LIKE '%light%' OR LOWER(message) LIKE '%fan%' THEN 'Electrical'
          WHEN LOWER(message) LIKE '%clean%' OR LOWER(message) LIKE '%dirty%' OR LOWER(message) LIKE '%wash%' THEN 'Cleanliness'
          WHEN LOWER(message) LIKE '%food%' OR LOWER(message) LIKE '%mess%' OR LOWER(message) LIKE '%canteen%' THEN 'Food'
          WHEN LOWER(message) LIKE '%internet%' OR LOWER(message) LIKE '%wifi%' OR LOWER(message) LIKE '%network%' THEN 'Internet'
          WHEN LOWER(message) LIKE '%door%' OR LOWER(message) LIKE '%lock%' OR LOWER(message) LIKE '%window%' THEN 'Furniture'
          WHEN LOWER(message) LIKE '%toilet%' OR LOWER(message) LIKE '%bathroom%' THEN 'Bathroom'
          ELSE 'Other'
        END as category,
        COUNT(*) as count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({ success: true, data: categories });
  }),
);

module.exports = router;
