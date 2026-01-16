const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

/* ================= COMMON DASHBOARD ================= */

router.get("/",
  auth(["student","caretaker","admin"]),
  (req,res)=>{
    res.json({
      msg: "Dashboard loaded",
      user: req.user
    });
  }
);

/* ================= CARETAKER ================= */

/* EMPTY ROOMS (ONLY THEIR HOSTEL) */
router.get("/caretaker/empty-rooms",
  auth(["caretaker"]),
  (req,res)=>{

    const hostel = req.user.hostel_type;

    db.query(
      `SELECT r.room_no,r.capacity,
      COUNT(u.id) AS members
      FROM rooms r
      LEFT JOIN users u 
      ON r.room_no=u.room_no
      AND r.hostel_type=u.hostel_type
      WHERE r.hostel_type=?
      GROUP BY r.id
      HAVING members < r.capacity`,
      [hostel],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* ROOM MEMBERS BY ROOM NO */
router.get("/caretaker/room/:room_no",
  auth(["caretaker"]),
  (req,res)=>{

    db.query(
      `SELECT name,college_id,dept,year
       FROM users
       WHERE room_no=?
       AND hostel_type=?`,
      [
        req.params.room_no,
        req.user.hostel_type
      ],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* ================= ADMIN ================= */

/* EMPTY ROOMS */
router.get("/admin/empty-rooms",
  auth(["admin"]),
  (req,res)=>{

    db.query(
      `SELECT r.room_no,r.hostel_type,
      r.capacity,COUNT(u.id) AS members
      FROM rooms r
      LEFT JOIN users u 
      ON r.room_no=u.room_no
      AND r.hostel_type=u.hostel_type
      GROUP BY r.id
      HAVING members < r.capacity`,
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* ROOM MEMBERS */
router.get("/admin/room/:hostel/:room_no",
  auth(["admin"]),
  (req,res)=>{

    db.query(
      `SELECT 
        name,college_id,dept,year,role
       FROM users
       WHERE room_no=?
       AND hostel_type=?`,
      [
        req.params.room_no,
        req.params.hostel
      ],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* FILTER STUDENTS */
router.get("/admin/filter",
  auth(["admin"]),
  (req,res)=>{

    const { room_no, dept, year, hostel } = req.query;

    let sql = "SELECT name,college_id,dept,year,room_no,hostel_type FROM users WHERE role='student'";
    let params = [];

    if(room_no){
      sql += " AND room_no=?";
      params.push(room_no);
    }

    if(dept){
      sql += " AND dept=?";
      params.push(dept);
    }

    if(year){
      sql += " AND year=?";
      params.push(year);
    }

    if(hostel){
      sql += " AND hostel_type=?";
      params.push(hostel);
    }

    db.query(sql, params, (err,data)=>{
      if(err) return res.status(500).json(err);
      res.json(data);
    });
  }
);

module.exports = router;
