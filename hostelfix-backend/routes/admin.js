const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

/* USERS */
router.get("/users",
  auth(["admin"]),
  (req,res)=>{
    db.query(
      "SELECT id,college_id,role FROM users",
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* COMPLAINTS */
router.get("/complaints",
  auth(["admin"]),
  (req,res)=>{
    db.query(
      "SELECT * FROM complaints",
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data);
      }
    );
  }
);

/* STATS */
router.get("/stats",
  auth(["admin"]),
  (req,res)=>{

    const q1 =
      "SELECT role,COUNT(*) as total FROM users GROUP BY role";

    const q2 =
      "SELECT status,COUNT(*) as total FROM complaints GROUP BY status";

    db.query(q1,(e1,uStats)=>{
      if(e1) return res.status(500).json(e1);

      db.query(q2,(e2,cStats)=>{
        if(e2) return res.status(500).json(e2);

        res.json({
          users:uStats,
          complaints:cStats
        });
      });
    });
  }
);
// UPDATE ROLE
router.put("/role/:id",
  auth(["admin"]),
  (req,res)=>{

    const { role } = req.body;

    db.query(
      "UPDATE users SET role=? WHERE id=?",
      [role, req.params.id],
      (err)=>{
        if(err) return res.status(500).json(err);
        res.json("Role updated");
      }
    );
  }
);

module.exports = router;
