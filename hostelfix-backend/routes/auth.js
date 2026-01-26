const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { pool } = require("../config/db");
const { asyncHandler } = require("../middleware/errorHandler");
const { validate, rules } = require("../middleware/validate");

const router = express.Router();

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================= REGISTER ================= */

router.post(
  "/register",
  rules.register,
  validate,
  asyncHandler(async (req, res) => {
    const {
      college_id,
      password,
      name,
      email,
      mobile,
      hostel,
      dept,
      year,
      room_no,
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

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Insert user
    await pool.query(
      `INSERT INTO users (college_id, password, role, name, email, mobile, hostel, dept, year, room_no)
       VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?, ?)`,
      [
        college_id,
        hash,
        name || null,
        email || null,
        mobile || null,
        hostel || null,
        dept || null,
        year || null,
        room_no || null,
      ],
    );

    res.status(201).json({ success: true, msg: "Registered successfully" });
  }),
);

/* ================= LOGIN ================= */

router.post(
  "/login",
  rules.login,
  validate,
  asyncHandler(async (req, res) => {
    const { college_id, password } = req.body;

    // Find user
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

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        college_id: user.college_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Return user data (without password)
    const { password: _, reset_otp, otp_expiry, ...userData } = user;

    res.json({
      success: true,
      msg: "Login successful",
      token,
      user: userData,
    });
  }),
);

/* ================= SEND OTP ================= */

router.post(
  "/send-otp",
  rules.sendOtp,
  validate,
  asyncHandler(async (req, res) => {
    const { college_id } = req.body;

    // Find user
    const [users] = await pool.query(
      "SELECT id, email FROM users WHERE college_id = ?",
      [college_id],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const user = users[0];

    if (!user.email) {
      return res
        .status(400)
        .json({ success: false, msg: "No email registered for this account" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashOtp = await bcrypt.hash(otp.toString(), 10);
    const expiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Save OTP
    await pool.query(
      "UPDATE users SET reset_otp = ?, otp_expiry = ? WHERE id = ?",
      [hashOtp, expiry, user.id],
    );

    // Send email
    await transporter.sendMail({
      to: user.email,
      subject: "HostelFix Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px;">
          <h2 style="color: #6366f1;">Password Reset</h2>
          <p>Your OTP for password reset is:</p>
          <h1 style="background: #f0f0f0; padding: 15px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p style="color: #666;">This OTP is valid for 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, msg: "OTP sent to registered email" });
  }),
);

/* ================= RESET PASSWORD ================= */

router.post(
  "/reset-password",
  rules.resetPassword,
  validate,
  asyncHandler(async (req, res) => {
    const { college_id, otp, newPassword } = req.body;

    // Find user
    const [users] = await pool.query(
      "SELECT id, reset_otp, otp_expiry FROM users WHERE college_id = ?",
      [college_id],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const user = users[0];

    // Check OTP expiry
    if (!user.otp_expiry || new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ success: false, msg: "OTP expired" });
    }

    // Verify OTP
    const valid = await bcrypt.compare(otp.toString(), user.reset_otp);
    if (!valid) {
      return res.status(400).json({ success: false, msg: "Invalid OTP" });
    }

    // Update password
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET password = ?, reset_otp = NULL, otp_expiry = NULL WHERE id = ?",
      [hash, user.id],
    );

    res.json({ success: true, msg: "Password updated successfully" });
  }),
);

/* ================= VERIFY TOKEN ================= */

router.get(
  "/verify",
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get fresh user data
      const [users] = await pool.query(
        "SELECT id, college_id, role, name, email, hostel, dept, year, room_no FROM users WHERE id = ?",
        [decoded.id],
      );

      if (users.length === 0) {
        return res.status(401).json({ success: false, msg: "User not found" });
      }

      res.json({ success: true, user: users[0] });
    } catch (err) {
      return res.status(401).json({ success: false, msg: "Invalid token" });
    }
  }),
);

module.exports = router;
