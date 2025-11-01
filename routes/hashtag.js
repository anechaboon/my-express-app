import express from "express";
import { db } from "../dbpg.js";
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

    const [rowsResult, countResult] = await Promise.all([
      db.query(
        "SELECT id, name FROM hashtags WHERE name LIKE $1 LIMIT $2 OFFSET $3",
        [searchPattern, limit, offset]
      ),
      db.query(
        "SELECT COUNT(*) as count FROM hashtags WHERE name LIKE $1",
        [searchPattern]
      ),
    ]);

    const rows = rowsResult.rows;
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      status: rows.length ? true : false,
      msg: rows.length ? "Hashtags found" : "No hashtags found",
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error", msg: err.message });
  }
});

// ➕ Create new hashtag
router.post("/", async (req, res) => {
  try {
    const name = req.body.name?.toLowerCase();
    if (!name) return res.status(400).json({ status: false, msg: "Name required" });

    const existResult = await db.query("SELECT id FROM hashtags WHERE name = $1", [name]);
    if (existResult.rows.length) return res.json({ status: true, msg: "Hashtag already exists", data: existResult.rows[0] });

    const insertResult = await db.query("INSERT INTO hashtags (name) VALUES ($1) RETURNING id", [name]);
    res.status(201).json({ status: true, msg: "Hashtag created", data: { id: insertResult.rows[0].id, name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error", msg: err.message });
  }
});

export default router;
