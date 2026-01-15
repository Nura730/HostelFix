const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

/* STUDENT - ADD */
router.post("/add",
  auth(["student"]),
  (req,res)=>{
    const { message } = req.body;
    const student_id = req.user.college_id;

    db.query(
      "INSERT INTO complaints (student_id,message,status) VALUES (?,?,?)",
      [student_id,message,"pending"],
      (err)=>{
        if(err) return res.status(500).json(err);
        res.json("Complaint added");
      }
    );
  }
);

/* STUDENT - MY COMPLAINTS */
router.get("/my",
  auth(["student"]),
  (req,res)=>{
    const student_id = req.user.college_id;

    db.query(
      "SELECT * FROM complaints WHERE student_id=? ORDER BY id DESC",
      [student_id],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* CARETAKER - ALL */
router.get("/all",
  auth(["caretaker"]),
  (req,res)=>{
    db.query("SELECT * FROM complaints",
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* CARETAKER - PENDING */
router.get("/pending",
  auth(["caretaker"]),
  (req,res)=>{
    db.query(
      "SELECT * FROM complaints WHERE status='pending'",
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* CARETAKER - UPDATE */
router.put("/update/:id",
  auth(["caretaker"]),
  (req,res)=>{
    const {status}=req.body;

    db.query(
      "UPDATE complaints SET status=? WHERE id=?",
      [status,req.params.id],
      (err)=>{
        if(err) return res.status(500).json(err);
        res.json("Updated");
      }
    );
  }
);
// DELETE
router.delete("/:id",
 auth(["student"]),
 (req,res)=>{
  db.query(
   "DELETE FROM complaints WHERE id=?",
   [req.params.id],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("Deleted");
   }
  );
 }
);

// UPDATE
router.put("/:id",
 auth(["student"]),
 (req,res)=>{
  db.query(
   "UPDATE complaints SET message=? WHERE id=?",
   [req.body.message,req.params.id],
   err=>{
    if(err) return res.status(500).json(err);
    res.json("Updated");
   }
  );
 }
);

module.exports = router;
