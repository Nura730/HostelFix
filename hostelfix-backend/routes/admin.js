const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= LOGIN ================= */

router.post("/login",(req,res)=>{
 const { college_id,password } = req.body;

 db.query(
  "SELECT * FROM users WHERE college_id=?",
  [college_id],
  async (err,rows)=>{
   if(err) return res.status(500).json(err);
   if(!rows.length) return res.status(401).json("Invalid");

   const user = rows[0];
   const ok = await bcrypt.compare(password,user.password);
   if(!ok) return res.status(401).json("Invalid");

   const token = jwt.sign({
     id:user.id,
     role:user.role,
     college_id:user.college_id
   },
   process.env.JWT_SECRET,
   {expiresIn:"1h"}
   );

   res.json({token,user});
  }
 );
});

/* ================= USERS ================= */

router.get("/users",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   `SELECT id,college_id,role,hostel,
    name,mobile,dept,year,room_no,email,
    assigned_caretaker
    FROM users`,
   (err,data)=>{
    if(err) return res.status(500).json(err);
    res.json(data);
   }
  );
 });

/* ================= CARETAKERS ================= */

router.get("/caretakers",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   `SELECT u.id,u.college_id,u.hostel,
    COUNT(s.id) students
    FROM users u
    LEFT JOIN users s
    ON s.assigned_caretaker=u.college_id
    WHERE u.role='caretaker'
    GROUP BY u.id`,
   (err,data)=>{
    if(err) return res.status(500).json(err);
    res.json(data);
   }
  );
 });

/* ================= CREATE USER ================= */

router.post("/create-user",
 auth(["admin"]),
 (req,res)=>{

 const {
  college_id,password,role,hostel,
  name,mobile,dept,year,room_no,email
 } = req.body;

 if(!college_id||!password||!role||!name)
  return res.status(400).json("Missing fields");

 const hash = bcrypt.hashSync(password,10);

 /* STUDENT ROOM CHECK */
 if(role==="student"){
  db.query(
   `SELECT capacity FROM rooms 
    WHERE room_no=? AND hostel_type=?`,
   [room_no,hostel],
   (e1,r)=>{
    if(e1) return res.status(500).json(e1);
    if(!r.length) return res.status(400).json("Room not found");

    db.query(
     `SELECT COUNT(*) c FROM users 
      WHERE room_no=? AND hostel=?`,
     [room_no,hostel],
     (e2,cnt)=>{
      if(e2) return res.status(500).json(e2);

      if(cnt[0].c >= r[0].capacity)
       return res.status(400).json("Room full");

      insertUser();
     }
    );
   }
  );
 } else {
  insertUser();
 }

 function insertUser(){
  db.query(
   `INSERT INTO users
   (college_id,password,role,hostel,
    name,mobile,dept,year,room_no,email)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
   [
    college_id,hash,role,hostel,
    name,mobile,dept,year,room_no,email
   ],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("User created");
   }
  );
 }
});

/* ================= ASSIGN ================= */

router.put("/assign-student",
 auth(["admin"]),
 (req,res)=>{

 const { student,caretaker } = req.body;

 db.query(
  "UPDATE users SET assigned_caretaker=? WHERE college_id=?",
  [caretaker,student],
  err=>{
   if(err) return res.status(500).json(err);
   res.json("Mapped");
  }
 );
});

/* ================= UNASSIGN ================= */

router.put("/unassign/:id",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   "UPDATE users SET assigned_caretaker=NULL WHERE id=?",
   [req.params.id],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("Removed");
   }
  );
 });

/* ================= RESET PASSWORD ================= */

router.put("/reset-password/:id",
 auth(["admin"]),
 (req,res)=>{

 const hash=bcrypt.hashSync(req.body.newPassword,10);

 db.query(
  "UPDATE users SET password=? WHERE id=?",
  [hash,req.params.id],
  err=>{
   if(err) return res.status(500).json(err);
   res.json("Password reset");
  }
 );
});

/* ================= DELETE USER ================= */

router.delete("/user/:id",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   "DELETE FROM users WHERE id=?",
   [req.params.id],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("Deleted");
   }
  );
 });

/* ================= ROOMS ================= */

router.post("/room",
 auth(["admin"]),
 (req,res)=>{

 const { room_no,hostel_type,capacity } = req.body;

 db.query(
  "INSERT INTO rooms (room_no,hostel_type,capacity) VALUES (?,?,?)",
  [room_no,hostel_type,capacity],
  err=>{
   if(err) return res.status(500).json(err);
   res.json("Room added");
  }
 );
});

router.get("/rooms",
 auth(["admin"]),
 (req,res)=>{
  db.query("SELECT * FROM rooms",
   (err,data)=>{
    if(err) return res.status(500).json(err);
    res.json(data);
   }
  );
 });

router.put("/room/:id",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   "UPDATE rooms SET capacity=? WHERE id=?",
   [req.body.capacity,req.params.id],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("Updated");
   }
  );
 });

router.delete("/room/:id",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   "DELETE FROM rooms WHERE id=?",
   [req.params.id],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("Deleted");
   }
  );
 });

/* ================= FREE ROOMS ================= */

router.get("/free-rooms",
 auth(["admin"]),
 (req,res)=>{

 const hostel=req.query.hostel;

 db.query(
`SELECT r.room_no,
 r.capacity-COUNT(u.id) free
 FROM rooms r
 LEFT JOIN users u
 ON u.room_no=r.room_no
 AND u.hostel=r.hostel_type
 WHERE r.hostel_type=?
 GROUP BY r.id
 HAVING free>0`,
 [hostel],
 (err,data)=>{
  if(err) return res.status(500).json(err);
  res.json(data);
 });
});

/* ================= FILTER ================= */

router.get("/filter",
 auth(["admin"]),
 (req,res)=>{

 const { room_no,dept,year,hostel } = req.query;

 let q="SELECT * FROM users WHERE role='student'";
 let p=[];

 if(room_no){ q+=" AND room_no=?"; p.push(room_no); }
 if(dept){ q+=" AND dept=?"; p.push(dept); }
 if(year){ q+=" AND year=?"; p.push(year); }
 if(hostel){ q+=" AND hostel=?"; p.push(hostel); }

 db.query(q,p,(err,data)=>{
  if(err) return res.status(500).json(err);
  res.json(data);
 });
});

/* ================= ROOM MEMBERS ================= */

router.get("/room/:hostel/:room",
 auth(["admin"]),
 (req,res)=>{
  db.query(
   "SELECT name,role,dept FROM users WHERE hostel=? AND room_no=?",
   [req.params.hostel,req.params.room],
   (err,data)=>{
    if(err) return res.status(500).json(err);
    res.json(data);
   }
  );
 });

module.exports = router;
