const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const multer = require("multer");

const router = express.Router();

/* IMAGE UPLOAD */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* GET PROFILE */
router.get("/",
  auth(["student","caretaker","admin"]),
  (req,res)=>{

    db.query(
      "SELECT college_id,role,image FROM users WHERE id=?",
      [req.user.id],
      (err,data)=>{
        if(err) return res.status(500).json(err);
        res.json(data[0]);
      }
    );
  }
);

/* UPDATE IMAGE */
router.put("/image",
  auth(["student","caretaker","admin"]),
  upload.single("image"),
  (req,res)=>{

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

module.exports = router;
