import express from "express";
import { db } from "../db.js";
const router = express.Router();

// 🔍 Search hashtag
// example: /api/hashtags?search=fun
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    if (!search) return res.status(400).json({ status: false, msg: "Search query required" });
    const [rows] = await db.query("SELECT * FROM hashtags WHERE name LIKE ? LIMIT 10", [`%${search}%`]);
    if (!rows.length) return res.json({ status: false, msg: "No hashtags found" });
    return res.json({ status: true, msg: "Hashtags found", data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ➕ Create new hashtag
router.post("/", async (req, res) => {
  try {
    const name = req.body.name?.toLowerCase();
    if (!name) return res.status(400).json({ status: false, msg: "Name required" });

    const [exist] = await db.query("SELECT id FROM hashtags WHERE name = ?", [name]);
    if (exist.length) return res.json({ status: true, msg: "Hashtag already exists", data: exist[0] });

    const [result] = await db.query("INSERT INTO hashtags (name) VALUES (?)", [name]);
    res.status(201).json({ status: true, msg: "Hashtag created", data: { id: result.insertId, name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
