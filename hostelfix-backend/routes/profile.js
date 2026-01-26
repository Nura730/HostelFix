const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/* ================= GET PROFILE ================= */

router.get(
  "/",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    const [users] = await pool.query(
      `SELECT id, college_id, role, name, email, mobile, hostel, 
              dept, year, room_no, assigned_caretaker, created_at
       FROM users WHERE id = ?`,
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    res.json({ success: true, data: users[0] });
  }),
);

/* ================= UPDATE PROFILE ================= */

router.put(
  "/",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    const { name, email, mobile } = req.body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid email format" });
    }

    // Validate mobile if provided
    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid mobile number" });
    }

    await pool.query(
      `UPDATE users SET 
       name = COALESCE(?, name),
       email = COALESCE(?, email),
       mobile = COALESCE(?, mobile)
       WHERE id = ?`,
      [name, email, mobile, req.user.id],
    );

    res.json({ success: true, msg: "Profile updated" });
  }),
);

/* ================= CHANGE PASSWORD ================= */

router.put(
  "/change-password",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "Both passwords required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          msg: "Password must be at least 6 characters",
        });
    }

    // Get current password
    const [users] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [req.user.id],
    );

    // Verify current password
    const match = await bcrypt.compare(currentPassword, users[0].password);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, msg: "Current password is incorrect" });
    }

    // Update password
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hash,
      req.user.id,
    ]);

    res.json({ success: true, msg: "Password changed successfully" });
  }),
);

/* ================= GET ROOMMATES ================= */

router.get(
  "/roommates",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    // Get current user's room
    const [users] = await pool.query(
      "SELECT room_no, hostel FROM users WHERE id = ?",
      [req.user.id],
    );

    if (users.length === 0 || !users[0].room_no) {
      return res.json({ success: true, data: [] });
    }

    const { room_no, hostel } = users[0];

    // Get roommates
    const [roommates] = await pool.query(
      `SELECT name, college_id, dept, year 
       FROM users 
       WHERE room_no = ? AND hostel = ? AND id != ?`,
      [room_no, hostel, req.user.id],
    );

    res.json({ success: true, data: roommates });
  }),
);

/* ================= GET CARETAKER INFO ================= */

router.get(
  "/my-caretaker",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    const [users] = await pool.query(
      "SELECT assigned_caretaker FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!users[0]?.assigned_caretaker) {
      return res.json({ success: true, data: null });
    }

    const [caretakers] = await pool.query(
      "SELECT name, email, mobile FROM users WHERE college_id = ?",
      [users[0].assigned_caretaker],
    );

    res.json({ success: true, data: caretakers[0] || null });
  }),
);

module.exports = router;
