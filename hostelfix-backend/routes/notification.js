const express = require("express");
const { pool } = require("../config/db");
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/* ================= GET USER NOTIFICATIONS ================= */

router.get(
  "/",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    const { unread } = req.query;

    let query = `
      SELECT n.*, u.name as from_name
      FROM notifications n
      LEFT JOIN users u ON u.college_id = n.from_user
      WHERE n.user_id = ?
    `;
    const params = [req.user.id];

    if (unread === "true") {
      query += " AND n.is_read = 0";
    }

    query += " ORDER BY n.created_at DESC LIMIT 50";

    const [notifications] = await pool.query(query, params);

    res.json({ success: true, data: notifications });
  }),
);

/* ================= GET UNREAD COUNT ================= */

router.get(
  "/count",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    const [result] = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id],
    );

    res.json({ success: true, count: result[0].count });
  }),
);

/* ================= MARK AS READ ================= */

router.put(
  "/read/:id",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );

    res.json({ success: true, msg: "Marked as read" });
  }),
);

/* ================= MARK ALL AS READ ================= */

router.put(
  "/read-all",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
      req.user.id,
    ]);

    res.json({ success: true, msg: "All notifications marked as read" });
  }),
);

/* ================= DELETE NOTIFICATION ================= */

router.delete(
  "/:id",
  auth(["student", "caretaker", "admin"]),
  asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.id,
    ]);

    res.json({ success: true, msg: "Notification deleted" });
  }),
);

module.exports = router;
