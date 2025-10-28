import express from "express";
import { db } from "../db.js";
const router = express.Router();

// ➕ Create new post
router.post("/", async (req, res) => {
  try {
    const { image_ids, hashtags } = req.body; // image_ids เป็น array ของ image ids, hashtags เป็น array ของ hashtag ids
    if (!image_ids || !Array.isArray(image_ids) || image_ids.length === 0) {
      return res.status(400).json({ status: false, msg: "Image IDs array required" });
    }
    
    // INSERT INTO image_has_hashtag for each image and hashtag combination
    for (const image_id of image_ids) {
      for (const tag_id of hashtags) {
        await db.query("INSERT INTO image_has_hashtag (image_id, hashtag_id) VALUES (?, ?)", [image_id, tag_id]);
      }
    }
    res.status(201).json({ status: true, msg: "Post created with multiple images and hashtags" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
