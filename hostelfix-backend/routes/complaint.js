const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename:(req,file,cb)=>{
    cb(null,Date.now()+"-"+file.originalname);
  }
});

const upload = multer({
  storage,
  limits:{ fileSize:5*1024*1024 },
  fileFilter:(req,file,cb)=>{
    if(
      file.mimetype==="image/jpeg" ||
      file.mimetype==="image/png"
    ){
      cb(null,true);
    }else{
      cb("Only images allowed");
    }
  }
});

/* ================= STUDENT ADD ================= */

router.post("/add",
  auth(["student"]),
  upload.single("image"),
  (req,res)=>{

    const { message, priority } = req.body;
    const student = req.user.college_id;
    const image = req.file?.filename || null;

    if(!message)
      return res.status(400).json("Message required");

    /* CHECK DUPLICATE PENDING */
    db.query(
      `SELECT id FROM complaints
       WHERE student_id=? 
       AND message=? 
       AND status='pending'`,
      [student,message],
      (e,dup)=>{
        if(e) return res.status(500).json(e);
        if(dup.length)
          return res
          .status(400)
          .json("Same complaint already pending");

        /* CONTINUE */
        insertComplaint();
      }
    );

    function insertComplaint(){

      db.query(
        "SELECT assigned_caretaker,hostel FROM users WHERE college_id=?",
        [student],
        (e,u)=>{
          if(e) return res.status(500).json(e);
          if(!u.length)
            return res.status(404).json("Student not found");

          let caretaker = u[0].assigned_caretaker;

          if(!caretaker){
            db.query(
              "SELECT college_id FROM users WHERE role='caretaker' AND hostel=? LIMIT 1",
              [u[0].hostel],
              (e2,c)=>{
                if(e2) return res.status(500).json(e2);
                if(!c.length)
                  return res.status(400).json("No caretaker for hostel");

                caretaker = c[0].college_id;
                insert(caretaker);
              }
            );
          }else{
            insert(caretaker);
          }

          function insert(caretaker){
            db.query(
              `INSERT INTO complaints
               (student_id,message,status,priority,image,assigned_to)
               VALUES (?,?,?,?,?,?)`,
              [
                student,
                message,
                "pending",
                priority || "normal",
                image,
                caretaker
              ],
              err=>{
                if(err) return res.status(500).json(err);
                res.json("Complaint submitted");
              }
            );
          }
        }
      );
    }
  }
);

/* ================= STUDENT VIEW ================= */

router.get("/my",
  auth(["student"]),
  (req,res)=>{

    db.query(
      `SELECT c.*,
      (SELECT message FROM complaint_comments
       WHERE complaint_id=c.id
       ORDER BY id DESC LIMIT 1) AS reply
       FROM complaints c
       WHERE student_id=?
       ORDER BY c.id DESC`,
      [req.user.college_id],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* ================= STUDENT DELETE ================= */

router.delete("/:id",
  auth(["student"]),
  (req,res)=>{

    const student=req.user.college_id;

    db.query(
      "SELECT image,status FROM complaints WHERE id=? AND student_id=?",
      [req.params.id,student],
      (err,row)=>{
        if(err) return res.status(500).json(err);
        if(!row.length)
          return res.status(404).json("Not found");

        /* Only pending can delete */
        if(row[0].status!=="pending")
          return res
          .status(400)
          .json("Cannot delete after action");

        const image=row[0].image;

        if(image){
          const filePath=path.join(
            __dirname,"..","uploads",image
          );
          fs.unlink(filePath,()=>{});
        }

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
  }
);

/* ================= CARETAKER VIEW ================= */

router.get("/pending",
  auth(["caretaker"]),
  (req,res)=>{

    db.query(
      "SELECT * FROM complaints WHERE assigned_to=?",
      [req.user.college_id],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* ================= CARETAKER UPDATE + LOG ================= */

router.put("/update/:id",
  auth(["caretaker"]),
  (req,res)=>{

    const {status,comment}=req.body;
    const caretaker=req.user.college_id;

    if(!status)
      return res.status(400).json("Status required");

    db.query(
      "SELECT status FROM complaints WHERE id=? AND assigned_to=?",
      [req.params.id,caretaker],
      (err,row)=>{
        if(err) return res.status(500).json(err);
        if(!row.length)
          return res.status(403).json("Not allowed");

        const oldStatus=row[0].status;

        db.query(
          "UPDATE complaints SET status=? WHERE id=?",
          [status,req.params.id],
          err=>{
            if(err) return res.status(500).json(err);

            /* LOG */
            db.query(
              `INSERT INTO complaint_logs
               (complaint_id,old_status,new_status,changed_by)
               VALUES (?,?,?,?)`,
              [
                req.params.id,
                oldStatus,
                status,
                caretaker
              ]
            );

            if(comment){
              db.query(
                `INSERT INTO complaint_comments
                 (complaint_id,caretaker_id,message)
                 VALUES (?,?,?)`,
                [
                  req.params.id,
                  caretaker,
                  comment
                ]
              );
            }

            res.json("Updated");
          }
        );
      }
    );
  }
);

module.exports = router;
