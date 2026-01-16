const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= AUTH ================= */

router.post("/login", (req, res) => {

  const { college_id, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE college_id=?",
    [college_id],
    async (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows.length) return res.status(401).json("Invalid");

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json("Invalid");

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          college_id: user.college_id
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token, user });
    }
  );
});

/* ================= ADMIN ================= */

/* USERS */
router.get(
  "/users",
  auth(["admin"]),
  (req, res) => {
    db.query(
      `SELECT id,college_id,role,hostel,
       name,mobile,dept,year,room_no,email,
       assigned_caretaker
       FROM users`,
      (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* CARETAKERS */
router.get(
  "/caretakers",
  auth(["admin"]),
  (req, res) => {
    db.query(
      `SELECT u.id,u.college_id,u.hostel,
       COUNT(s.id) students
       FROM users u
       LEFT JOIN users s
       ON s.assigned_caretaker=u.college_id
       WHERE u.role='caretaker'
       GROUP BY u.id`,
      (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* ASSIGN STUDENT */
router.put(
  "/assign-student",
  auth(["admin"]),
  (req, res) => {

    const { student, caretaker } = req.body;

    db.query(
      "SELECT hostel FROM users WHERE college_id=?",
      [student],
      (e1, s) => {
        if (e1) return res.status(500).json(e1);

        db.query(
          "SELECT hostel FROM users WHERE college_id=?",
          [caretaker],
          (e2, c) => {
            if (e2) return res.status(500).json(e2);

            if (s[0].hostel !== c[0].hostel)
              return res.status(400).json("Hostel mismatch");

            db.query(
              "UPDATE users SET assigned_caretaker=? WHERE college_id=?",
              [caretaker, student],
              err => {
                if (err) return res.status(500).json(err);
                res.json("Mapped");
              }
            );
          }
        );
      }
    );
  }
);

/* UNASSIGN */
router.put(
  "/unassign/:id",
  auth(["admin"]),
  (req, res) => {
    db.query(
      "UPDATE users SET assigned_caretaker=NULL WHERE id=?",
      [req.params.id],
      err => {
        if (err) return res.status(500).json(err);
        res.json("Removed");
      }
    );
  }
);

/* MAPPING */
router.get(
  "/mapping",
  auth(["admin"]),
  (req, res) => {
    db.query(
      `SELECT college_id student,
       hostel,assigned_caretaker caretaker
       FROM users WHERE role='student'`,
      (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* CREATE USER */
router.post(
  "/create-user",
  auth(["admin"]),
  (req, res) => {

    const {
      college_id, password, role, hostel,
      name, mobile, dept, year, room_no, email
    } = req.body;

    if (!college_id || !password || !role)
      return res.status(400).json("Missing fields");

    const hash = bcrypt.hashSync(password, 10);

    db.query(
      `INSERT INTO users
      (college_id,password,role,hostel,
       name,mobile,dept,year,room_no,email)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        college_id, hash, role, hostel,
        name, mobile, dept, year, room_no, email
      ],
      err => {
        if (err) return res.status(500).json(err);
        res.json("User created");
      }
    );
  }
);

/* DELETE USER */
router.delete(
  "/user/:id",
  auth(["admin"]),
  (req, res) => {
    db.query(
      "DELETE FROM users WHERE id=?",
      [req.params.id],
      err => {
        if (err) return res.status(500).json(err);
        res.json("Deleted");
      }
    );
  }
);

/* RESET PASSWORD */
router.put(
  "/reset-password/:id",
  auth(["admin"]),
  async (req, res) => {

    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json("Password required");

    const hash = await bcrypt.hash(newPassword, 10);

    db.query(
      "UPDATE users SET password=? WHERE id=?",
      [hash, req.params.id],
      err => {
        if (err) return res.status(500).json(err);
        res.json("Password reset");
      }
    );
  }
);

/* ALL COMPLAINTS */
router.get(
  "/complaints",
  auth(["admin"]),
  (req, res) => {

    const {
      hostel, status, dept,
      year, room_no, date
    } = req.query;

    let q = `
      SELECT c.*,u.hostel,u.dept,u.year,u.room_no
      FROM complaints c
      JOIN users u ON c.student_id=u.college_id
      WHERE 1=1
    `;

    let params = [];

    if (hostel) {
      q += " AND u.hostel=?";
      params.push(hostel);
    }

    if (status) {
      q += " AND c.status=?";
      params.push(status);
    }

    if (dept) {
      q += " AND u.dept=?";
      params.push(dept);
    }

    if (year) {
      q += " AND u.year=?";
      params.push(year);
    }

    if (room_no) {
      q += " AND u.room_no=?";
      params.push(room_no);
    }

    if (date) {
      q += " AND DATE(c.created_at)=?";
      params.push(date);
    }

    db.query(q, params, (err, data) => {
      if (err) return res.status(500).json(err);
      res.json(data);
    });
  }
);

module.exports = router;
