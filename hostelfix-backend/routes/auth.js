const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

/* REGISTER */
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

      // default role = student
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

/* LOGIN */
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

module.exports = router;
