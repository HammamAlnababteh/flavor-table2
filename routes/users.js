//routes/users.js

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const pool = require("../db");

// Profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userRes = await pool.query("SELECT id, username FROM users WHERE id=$1", [req.user.id]);
    res.json(userRes.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
