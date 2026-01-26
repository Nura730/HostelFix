const express = require("express");
const nodemailer = require("nodemailer");
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const { validate, rules } = require("../middleware/validate");
const { upload, getImageUrl, deleteImage } = require("../middleware/upload");

const router = express.Router();

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Send notification email
const sendNotificationEmail = async (to, subject, html) => {
  try {
    if (to && process.env.EMAIL) {
      await transporter.sendMail({ to, subject, html });
    }
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

/* ================= STUDENT: ADD COMPLAINT ================= */

router.post(
  "/add",
  auth(["student"]),
  upload.single("image"),
  rules.complaint,
  validate,
  asyncHandler(async (req, res) => {
    const { message, priority } = req.body;
    const student = req.user.college_id;
    const imageUrl = getImageUrl(req.file);

    // Check for duplicate pending complaint
    const [duplicates] = await pool.query(
      `SELECT id FROM complaints 
       WHERE student_id = ? AND message = ? AND status = 'pending'`,
      [student, message],
    );

    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        msg: "You already have a pending complaint with the same message",
      });
    }

    // Get student's hostel and assigned caretaker
    const [students] = await pool.query(
      "SELECT assigned_caretaker, hostel FROM users WHERE college_id = ?",
      [student],
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }

    let caretaker = students[0].assigned_caretaker;
    const hostel = students[0].hostel;

    // Auto-assign caretaker if not set
    if (!caretaker) {
      const [caretakers] = await pool.query(
        "SELECT college_id FROM users WHERE role = 'caretaker' AND hostel = ? LIMIT 1",
        [hostel],
      );

      if (caretakers.length === 0) {
        return res.status(400).json({
          success: false,
          msg: "No caretaker assigned for your hostel",
        });
      }

      caretaker = caretakers[0].college_id;
    }

    // Insert complaint
    const [result] = await pool.query(
      `INSERT INTO complaints (student_id, message, status, priority, image, assigned_to, created_at)
       VALUES (?, ?, 'pending', ?, ?, ?, NOW())`,
      [student, message, priority || "normal", imageUrl, caretaker],
    );

    res.status(201).json({
      success: true,
      msg: "Complaint submitted successfully",
      complaintId: result.insertId,
    });
  }),
);

/* ================= STUDENT: VIEW MY COMPLAINTS ================= */

router.get(
  "/my",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    const [complaints] = await pool.query(
      `SELECT c.*,
       (SELECT message FROM complaint_comments 
        WHERE complaint_id = c.id 
        ORDER BY id DESC LIMIT 1) AS reply,
       (SELECT caretaker_id FROM complaint_comments 
        WHERE complaint_id = c.id 
        ORDER BY id DESC LIMIT 1) AS replied_by
       FROM complaints c
       WHERE c.student_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.college_id],
    );

    res.json({ success: true, data: complaints });
  }),
);

/* ================= STUDENT: UPDATE COMPLAINT ================= */

router.put(
  "/:id",
  auth(["student"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const student = req.user.college_id;

    // Check ownership and status
    const [complaints] = await pool.query(
      "SELECT status FROM complaints WHERE id = ? AND student_id = ?",
      [req.params.id, student],
    );

    if (complaints.length === 0) {
      return res
        .status(404)
        .json({ success: false, msg: "Complaint not found" });
    }

    if (complaints[0].status !== "pending") {
      return res.status(400).json({
        success: false,
        msg: "Cannot edit complaint after it has been reviewed",
      });
    }

    await pool.query("UPDATE complaints SET message = ? WHERE id = ?", [
      message,
      req.params.id,
    ]);

    res.json({ success: true, msg: "Complaint updated" });
  }),
);

/* ================= STUDENT: DELETE COMPLAINT ================= */

router.delete(
  "/:id",
  auth(["student"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    const student = req.user.college_id;

    // Get complaint
    const [complaints] = await pool.query(
      "SELECT image, status FROM complaints WHERE id = ? AND student_id = ?",
      [req.params.id, student],
    );

    if (complaints.length === 0) {
      return res
        .status(404)
        .json({ success: false, msg: "Complaint not found" });
    }

    if (complaints[0].status !== "pending") {
      return res.status(400).json({
        success: false,
        msg: "Cannot delete complaint after it has been reviewed",
      });
    }

    // Delete image if exists
    if (complaints[0].image) {
      await deleteImage(complaints[0].image);
    }

    // Delete comments first (foreign key)
    await pool.query("DELETE FROM complaint_comments WHERE complaint_id = ?", [
      req.params.id,
    ]);
    await pool.query("DELETE FROM complaint_logs WHERE complaint_id = ?", [
      req.params.id,
    ]);
    await pool.query("DELETE FROM complaints WHERE id = ?", [req.params.id]);

    res.json({ success: true, msg: "Complaint deleted" });
  }),
);

/* ================= CARETAKER: VIEW ASSIGNED COMPLAINTS ================= */

router.get(
  "/pending",
  auth(["caretaker"]),
  asyncHandler(async (req, res) => {
    const { status, priority, search } = req.query;

    let query = `
      SELECT c.*, u.name as student_name, u.room_no, u.hostel
      FROM complaints c
      JOIN users u ON u.college_id = c.student_id
      WHERE c.assigned_to = ?
    `;
    const params = [req.user.college_id];

    if (status && status !== "all") {
      query += " AND c.status = ?";
      params.push(status);
    }

    if (priority && priority !== "all") {
      query += " AND c.priority = ?";
      params.push(priority);
    }

    if (search) {
      query += " AND (c.message LIKE ? OR u.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY c.priority DESC, c.created_at DESC";

    const [complaints] = await pool.query(query, params);

    res.json({ success: true, data: complaints });
  }),
);

/* ================= CARETAKER: UPDATE COMPLAINT STATUS ================= */

router.put(
  "/update/:id",
  auth(["caretaker"]),
  rules.idParam,
  rules.updateStatus,
  validate,
  asyncHandler(async (req, res) => {
    const { status, comment } = req.body;
    const caretaker = req.user.college_id;

    // Verify ownership
    const [complaints] = await pool.query(
      `SELECT c.status as old_status, c.student_id, u.email as student_email, u.name as student_name
       FROM complaints c 
       JOIN users u ON u.college_id = c.student_id
       WHERE c.id = ? AND c.assigned_to = ?`,
      [req.params.id, caretaker],
    );

    if (complaints.length === 0) {
      return res.status(403).json({
        success: false,
        msg: "Not authorized to update this complaint",
      });
    }

    const { old_status, student_email, student_name } = complaints[0];

    // Update status
    await pool.query(
      "UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, req.params.id],
    );

    // Log the change
    await pool.query(
      `INSERT INTO complaint_logs (complaint_id, old_status, new_status, changed_by, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [req.params.id, old_status, status, caretaker],
    );

    // Add comment if provided
    if (comment) {
      await pool.query(
        `INSERT INTO complaint_comments (complaint_id, caretaker_id, message, created_at)
         VALUES (?, ?, ?, NOW())`,
        [req.params.id, caretaker, comment],
      );
    }

    // Send email notification
    if (student_email) {
      const statusColors = {
        approved: "#22c55e",
        rejected: "#ef4444",
        in_progress: "#f59e0b",
        pending: "#6b7280",
      };

      await sendNotificationEmail(
        student_email,
        `HostelFix: Complaint ${status.toUpperCase()}`,
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px;">
          <h2 style="color: #6366f1;">Complaint Status Update</h2>
          <p>Hi ${student_name},</p>
          <p>Your complaint status has been updated:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Status:</strong> 
              <span style="color: ${statusColors[status]}; font-weight: bold;">${status.toUpperCase()}</span>
            </p>
            ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Comment:</strong> ${comment}</p>` : ""}
          </div>
          <p style="color: #666;">Login to HostelFix to view more details.</p>
        </div>
        `,
      );
    }

    res.json({ success: true, msg: "Complaint updated successfully" });
  }),
);

/* ================= CARETAKER: GET COMPLAINT HISTORY ================= */

router.get(
  "/history/:id",
  auth(["caretaker", "admin"]),
  rules.idParam,
  validate,
  asyncHandler(async (req, res) => {
    const [logs] = await pool.query(
      `SELECT l.*, u.name as changed_by_name
       FROM complaint_logs l
       LEFT JOIN users u ON u.college_id = l.changed_by
       WHERE l.complaint_id = ?
       ORDER BY l.created_at DESC`,
      [req.params.id],
    );

    const [comments] = await pool.query(
      `SELECT c.*, u.name as caretaker_name
       FROM complaint_comments c
       LEFT JOIN users u ON u.college_id = c.caretaker_id
       WHERE c.complaint_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.id],
    );

    res.json({ success: true, data: { logs, comments } });
  }),
);

module.exports = router;
