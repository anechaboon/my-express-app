import express from "express";
import { db } from "../db.js";
const router = express.Router();



// ➕ Create new post
router.post("/", async (req, res) => {
  try {
    const { image_id, hashtags } = req.body; // hashtags เป็น array ของ hashtag ids
    if (!image_id) return res.status(400).json({ status: false, msg: "Image ID required" });
    // INSERT INTO image_has_hashtag 
    for (const tag_id of hashtags) {
      await db.query("INSERT INTO image_has_hashtag (image_id, hashtag_id) VALUES (?, ?)", [image_id, tag_id]);
    }
    res.status(201).json({ status: true, msg: "Post created with hashtags" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
