const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db = require("../config/db");

const router = express.Router();

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= REGISTER ================= */

router.post("/register", (req, res) => {
  const { college_id, password } = req.body;

  if (!college_id || !password)
    return res.status(400).json({ msg: "All fields required" });

  db.query(
    "SELECT * FROM users WHERE college_id=?",
    [college_id],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "DB error" });

      if (result.length > 0)
        return res.status(400).json({ msg: "User already exists" });

      const hash = bcrypt.hashSync(password, 10);

      db.query(
        "INSERT INTO users (college_id,password,role) VALUES (?,?,?)",
        [college_id, hash, "student"],
        (err) => {
          if (err) return res.status(500).json({ msg: "Insert error" });
          res.json({ msg: "Registered successfully" });
        }
      );
    }
  );
});

/* ================= LOGIN ================= */

router.post("/login", (req, res) => {
  const { college_id, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE college_id=?",
    [college_id],
    async (err, rows) => {
      if (err) return res.status(500).json({ msg: "DB error" });
      if (rows.length === 0)
        return res.status(401).json({ msg: "Invalid credentials" });

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(401).json({ msg: "Invalid credentials" });

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          college_id: user.college_id
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        msg: "Login success",
        token,
        user: {
          id: user.id,
          role: user.role,
          college_id: user.college_id
        }
      });
    }
  );
});

/* ================= SEND OTP ================= */

router.post("/send-otp", async (req, res) => {
  const { college_id } = req.body;

  if (!college_id)
    return res.status(400).json({ msg: "College ID required" });

  db.query(
    "SELECT * FROM users WHERE college_id=?",
    [college_id],
    async (err, rows) => {
      if (err) return res.status(500).json({ msg: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ msg: "User not found" });

      const user = rows[0];

      const otp = Math.floor(100000 + Math.random() * 900000);
      const hashOtp = await bcrypt.hash(otp.toString(), 10);
      const expiry = new Date(Date.now() + 10 * 60000); // 10 min

      db.query(
        "UPDATE users SET reset_otp=?, otp_expiry=? WHERE id=?",
        [hashOtp, expiry, user.id],
        async (err) => {
          if (err) return res.status(500).json({ msg: "DB error" });

          /* SEND EMAIL */
          await transporter.sendMail({
            to: user.email,
            subject: "HostelFix Password Reset OTP",
            html: `
              <h3>Password Reset</h3>
              <p>Your OTP:</p>
              <h2>${otp}</h2>
              <p>Valid for 10 minutes</p>
            `
          });

          res.json({ msg: "OTP sent to registered email" });
        }
      );
    }
  );
});

/* ================= RESET PASSWORD ================= */

router.post("/reset-password", async (req, res) => {
  const { college_id, otp, newPassword } = req.body;

  if (!college_id || !otp || !newPassword)
    return res.status(400).json({ msg: "All fields required" });

  db.query(
    "SELECT * FROM users WHERE college_id=?",
    [college_id],
    async (err, rows) => {
      if (err) return res.status(500).json({ msg: "DB error" });
      if (rows.length === 0)
        return res.status(404).json({ msg: "User not found" });

      const user = rows[0];

      if (new Date() > new Date(user.otp_expiry))
        return res.status(400).json({ msg: "OTP expired" });

      const valid = await bcrypt.compare(
        otp.toString(),
        user.reset_otp
      );

      if (!valid)
        return res.status(400).json({ msg: "Invalid OTP" });

      const hash = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password=?, reset_otp=NULL, otp_expiry=NULL WHERE id=?",
        [hash, user.id],
        (err) => {
          if (err) return res.status(500).json({ msg: "DB error" });
          res.json({ msg: "Password updated successfully" });
        }
      );
    }
  );
});

module.exports = router;
