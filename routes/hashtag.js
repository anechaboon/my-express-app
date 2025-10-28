import express from "express";
import { db } from "../db.js";
const router = express.Router();

// 🔍 Search hashtag
// example: /api/hashtags?search=fun
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const searchPattern = `%${search}%`;
    const [rows, [{ count: total }]] = await Promise.all([
      db.query("SELECT id, name FROM hashtags WHERE name LIKE ? LIMIT ? OFFSET ?", [
        searchPattern,
        limit,
        offset
      ]).then(([result]) => result),
      db.query("SELECT COUNT(*) as count FROM hashtags WHERE name LIKE ?", [searchPattern])
        .then(([result]) => result)
    ]);

    res.json({
      status: rows.length ? true : false,
      msg: rows.length ? "Hashtags found" : "No hashtags found",
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
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
