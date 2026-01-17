const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

/* GET notifications */
router.get("/", auth(), (req,res)=>{

  db.query(
    `SELECT * FROM notifications 
     WHERE user_id=? 
     ORDER BY id DESC`,
    [req.user.id],
    (err,data)=>{
      if(err) return res.status(500).json(err);
      res.json(data);
    }
  );
});

/* MARK AS READ */
router.put("/read/:id", auth(), (req,res)=>{

  db.query(
    "UPDATE notifications SET is_read=1 WHERE id=?",
    [req.params.id],
    err=>{
      if(err) return res.status(500).json(err);
      res.json("Read");
    }
  );
});

module.exports = router;
