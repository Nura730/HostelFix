const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const multer = require("multer");

const router = express.Router();

/* ================= IMAGE UPLOAD ================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= GET PROFILE ================= */

router.get("/",
  auth(["student","caretaker","admin"]),
  (req,res)=>{

    db.query(
      `SELECT 
        id,
        college_id,
        role,
        dept,
        year,
        hostel_type,
        room_no,
        image
       FROM users 
       WHERE id=?`,
      [req.user.id],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data[0]);
      }
    );
  }
);

/* ================= UPDATE IMAGE ================= */

router.put("/image",
  auth(["student","caretaker","admin"]),
  upload.single("image"),
  (req,res)=>{

    if(!req.file)
      return res.status(400).json("Image required");

    db.query(
      "UPDATE users SET image=? WHERE id=?",
      [req.file.filename, req.user.id],
      err=>{
        if(err) return res.status(500).json(err);
        res.json("Profile updated");
      }
    );
  }
);

/* ================= ROOMMATES (STUDENT) ================= */

router.get("/roommates",
  auth(["student"]),
  (req,res)=>{

    /* GET STUDENT ROOM */
    db.query(
      `SELECT room_no,hostel_type 
       FROM users 
       WHERE id=?`,
      [req.user.id],
      (err,row)=>{
        if(err) return res.status(500).json(err);
        if(!row.length)
          return res.status(404).json("User not found");

        const { room_no, hostel_type } = row[0];

        if(!room_no)
          return res.json([]);

        /* FETCH ROOMMATES */
        db.query(
          `SELECT 
            name,
            college_id,
            dept,
            year
           FROM users
           WHERE room_no=?
           AND hostel_type=?
           AND role='student'
           AND id!=?`,
          [room_no, hostel_type, req.user.id],
          (err2,data)=>{
            if(err2) return res.status(500).json(err2);
            res.json(data);
          }
        );
      }
    );
  }
);

module.exports = router;
