const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const { validate, rules, body } = require("../middleware/validate");

const router = express.Router();

/* ================= ADMIN LOGIN ================= */

router.post(
  "/login",
  rules.login,
  validate,
  asyncHandler(async (req, res) => {
    const { college_id, password } = req.body;

    const [users] = await pool.query(
      "SELECT * FROM users WHERE college_id = ?",
      [college_id],
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, college_id: user.college_id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    const { password: _, reset_otp, otp_expiry, ...userData } = user;

    res.json({ success: true, token, user: userData });
  }),
);

/* ================= GET ALL USERS ================= */

router.get(
  "/users",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { role, hostel, dept, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, college_id, role, hostel, name, mobile, dept, year, 
             room_no, email, assigned_caretaker, created_at
      FROM users WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += " AND role = ?";
      params.push(role);
    }

    if (hostel) {
      query += " AND hostel = ?";
      params.push(hostel);
    }

    if (dept) {
      query += " AND dept = ?";
      params.push(dept);
    }

    if (search) {
      query += " AND (name LIKE ? OR college_id LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT .* FROM/,
      "SELECT COUNT(*) as total FROM",
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }),
);

/* ================= GET CARETAKERS ================= */

router.get(
  "/caretakers",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const [caretakers] = await pool.query(`
      SELECT u.id, u.college_id, u.name, u.hostel, u.email, u.mobile,
             COUNT(s.id) as student_count,
             (SELECT COUNT(*) FROM complaints WHERE assigned_to = u.college_id AND status = 'pending') as pending_complaints
      FROM users u
      LEFT JOIN users s ON s.assigned_caretaker = u.college_id
      WHERE u.role = 'caretaker'
      GROUP BY u.id
      ORDER BY u.hostel, u.name
    `);

    res.json({ success: true, data: caretakers });
  }),
);

/* ================= CREATE USER ================= */

router.post(
  "/create-user",
  auth(["admin"]),
  rules.createUser,
  validate,
  asyncHandler(async (req, res) => {
    const {
      college_id,
      password,
      role,
      hostel,
      name,
      mobile,
      dept,
      year,
      room_no,
      email,
    } = req.body;

    // Check if user exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE college_id = ?",
      [college_id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, msg: "User already exists" });
    }

    // Room capacity check for students
    if (role === "student" && room_no && hostel) {
      const [rooms] = await pool.query(
        "SELECT capacity FROM rooms WHERE room_no = ? AND hostel_type = ?",
        [room_no, hostel],
      );

      if (rooms.length === 0) {
        return res.status(400).json({ success: false, msg: "Room not found" });
      }

      const [occupancy] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE room_no = ? AND hostel = ?",
        [room_no, hostel],
      );

      if (occupancy[0].count >= rooms[0].capacity) {
        return res.status(400).json({ success: false, msg: "Room is full" });
      }
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO users (college_id, password, role, hostel, name, mobile, dept, year, room_no, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        college_id,
        hash,
        role,
        hostel,
        name,
        mobile,
        dept,
        year,
        room_no,
        email,
      ],
    );

    res.status(201).json({ success: true, msg: "User created successfully" });
  }),
);

/* ================= ASSIGN STUDENT TO CARETAKER ================= */

router.put(
  "/assign-student",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { student, caretaker } = req.body;

    if (!student || !caretaker) {
      return res
        .status(400)
        .json({ success: false, msg: "Student and caretaker required" });
    }

    await pool.query(
      "UPDATE users SET assigned_caretaker = ? WHERE college_id = ?",
      [caretaker, student],
    );

    res.json({ success: true, msg: "Student assigned to caretaker" });
  }),
);

/* ================= BULK ASSIGN STUDENTS ================= */

router.put(
  "/bulk-assign",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { students, caretaker } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "Students array required" });
    }

    await pool.query(
      "UPDATE users SET assigned_caretaker = ? WHERE college_id IN (?)",
      [caretaker, students],
    );

    res.json({ success: true, msg: `${students.length} students assigned` });
  }),
);

/* ================= UNASSIGN STUDENT ================= */

router.put(
  "/unassign/:id",
  auth(["admin"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    await pool.query(
      "UPDATE users SET assigned_caretaker = NULL WHERE id = ?",
      [req.params.id],
    );
    res.json({ success: true, msg: "Student unassigned" });
  }),
);

/* ================= RESET USER PASSWORD ================= */

router.put(
  "/reset-password/:id",
  auth(["admin"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          msg: "Password must be at least 6 characters",
        });
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hash,
      req.params.id,
    ]);

    res.json({ success: true, msg: "Password reset successfully" });
  }),
);

/* ================= DELETE USER ================= */

router.delete(
  "/user/:id",
  auth(["admin"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    // Get user info first
    const [users] = await pool.query(
      "SELECT college_id FROM users WHERE id = ?",
      [req.params.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const college_id = users[0].college_id;

    // Remove from assignments
    await pool.query(
      "UPDATE users SET assigned_caretaker = NULL WHERE assigned_caretaker = ?",
      [college_id],
    );

    // Delete user
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    res.json({ success: true, msg: "User deleted" });
  }),
);

/* ================= ROOMS CRUD ================= */

router.post(
  "/room",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { room_no, hostel_type, capacity } = req.body;

    if (!room_no || !hostel_type || !capacity) {
      return res
        .status(400)
        .json({ success: false, msg: "All fields required" });
    }

    await pool.query(
      "INSERT INTO rooms (room_no, hostel_type, capacity) VALUES (?, ?, ?)",
      [room_no, hostel_type, capacity],
    );

    res.status(201).json({ success: true, msg: "Room added" });
  }),
);

router.get(
  "/rooms",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { hostel } = req.query;

    let query = `
      SELECT r.*, 
             (SELECT COUNT(*) FROM users WHERE room_no = r.room_no AND hostel = r.hostel_type) as occupied
      FROM rooms r
    `;
    const params = [];

    if (hostel) {
      query += " WHERE r.hostel_type = ?";
      params.push(hostel);
    }

    query += " ORDER BY r.hostel_type, r.room_no";

    const [rooms] = await pool.query(query, params);

    res.json({ success: true, data: rooms });
  }),
);

router.put(
  "/room/:id",
  auth(["admin"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    const { capacity } = req.body;

    await pool.query("UPDATE rooms SET capacity = ? WHERE id = ?", [
      capacity,
      req.params.id,
    ]);

    res.json({ success: true, msg: "Room updated" });
  }),
);

router.delete(
  "/room/:id",
  auth(["admin"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM rooms WHERE id = ?", [req.params.id]);
    res.json({ success: true, msg: "Room deleted" });
  }),
);

/* ================= FREE ROOMS ================= */

router.get(
  "/free-rooms",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { hostel } = req.query;

    const [rooms] = await pool.query(
      `
      SELECT r.room_no, r.capacity,
             r.capacity - COUNT(u.id) as free
      FROM rooms r
      LEFT JOIN users u ON u.room_no = r.room_no AND u.hostel = r.hostel_type
      WHERE r.hostel_type = ?
      GROUP BY r.id
      HAVING free > 0
      ORDER BY r.room_no
    `,
      [hostel],
    );

    res.json({ success: true, data: rooms });
  }),
);

/* ================= FILTER STUDENTS ================= */

router.get(
  "/filter",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { room_no, dept, year, hostel } = req.query;

    let query = "SELECT * FROM users WHERE role = 'student'";
    const params = [];

    if (room_no) {
      query += " AND room_no = ?";
      params.push(room_no);
    }
    if (dept) {
      query += " AND dept = ?";
      params.push(dept);
    }
    if (year) {
      query += " AND year = ?";
      params.push(year);
    }
    if (hostel) {
      query += " AND hostel = ?";
      params.push(hostel);
    }

    const [students] = await pool.query(query, params);

    res.json({ success: true, data: students });
  }),
);

/* ================= ROOM MEMBERS ================= */

router.get(
  "/room/:hostel/:room",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const [members] = await pool.query(
      "SELECT name, college_id, role, dept, year FROM users WHERE hostel = ? AND room_no = ?",
      [req.params.hostel, req.params.room],
    );
    res.json({ success: true, data: members });
  }),
);

/* ================= STUDENT-CARETAKER MAPPING ================= */

router.get(
  "/mapping",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const [mapping] = await pool.query(`
      SELECT s.college_id as student, s.name as student_name,
             c.college_id as caretaker, c.name as caretaker_name
      FROM users s
      LEFT JOIN users c ON c.college_id = s.assigned_caretaker
      WHERE s.role = 'student'
      ORDER BY c.name, s.name
    `);

    res.json({ success: true, data: mapping });
  }),
);

/* ================= ALL COMPLAINTS (ADMIN VIEW) ================= */

router.get(
  "/complaints",
  auth(["admin"]),
  asyncHandler(async (req, res) => {
    const { status, hostel, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             s.name as student_name, s.hostel, s.room_no,
             ct.name as caretaker_name
      FROM complaints c
      JOIN users s ON s.college_id = c.student_id
      LEFT JOIN users ct ON ct.college_id = c.assigned_to
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "all") {
      query += " AND c.status = ?";
      params.push(status);
    }

    if (hostel) {
      query += " AND s.hostel = ?";
      params.push(hostel);
    }

    query += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [complaints] = await pool.query(query, params);

    res.json({ success: true, data: complaints });
  }),
);

module.exports = router;
