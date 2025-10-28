import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from "../db.js";
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // สร้างโฟลเดอร์ถ้าไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('สร้างโฟลเดอร์ uploads ใน destination');
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = String(Date.now()) + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const [result] = await db.query("INSERT INTO images (file_name, file_path) VALUES (?, ?)", [
    req.file.filename,
    `/uploads/${req.file.filename}`
  ]);
  res.json({
    id: result.insertId,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});


router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const searchPattern = `%${search}%`;
    const [rows, [{ count: total }]] = await Promise.all([
      db.query("SELECT id, name FROM images WHERE name LIKE ? LIMIT ? OFFSET ?", [
        searchPattern,
        limit,
        offset
      ]).then(([result]) => result),
      db.query("SELECT COUNT(*) as count FROM images WHERE name LIKE ?", [searchPattern])
        .then(([result]) => result)
    ]);

    res.json({
      status: rows.length ? true : false,
      msg: rows.length ? "Images found" : "No images found",
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/getByHashtag", async (req, res) => {
  try {
    const params = req.body.params;
    const hashtag = params.hashtag;
    const limit = Math.min(parseInt(params.limit) || 10, 100);
    const page = Math.max(parseInt(params.page) || 1, 1);
    const offset = (page - 1) * limit;

    let sqlWhere = ` FROM images
      JOIN image_has_hashtag ON images.id = image_has_hashtag.image_id
      JOIN hashtags ON image_has_hashtag.hashtag_id = hashtags.id `;
    let queryParams = [];
    let countParams = [];
    
    if (hashtag) {
      sqlWhere += ` WHERE hashtags.name = ? `;
      queryParams = [hashtag, limit, offset];
      countParams = [hashtag];
    } else {
      queryParams = [limit, offset];
      countParams = [];
    }
    const fullSql = "SELECT GROUP_CONCAT(hashtags.name) AS hashtags, images.id, images.file_name, images.file_path " + sqlWhere + " GROUP BY images.id LIMIT ? OFFSET ?";
    const [rows, [{ count: total }]] = await Promise.all([
      db.query(fullSql, queryParams)
        .then(([result]) => result),
      db.query("SELECT COUNT(*) as count " + sqlWhere, countParams)
        .then(([result]) => result)
    ]);

    const data = rows.map(r => ({
      id: r.id,
      file_name: r.file_name,
      file_path: r.file_path,
      hashtags: r.hashtags ? r.hashtags.split(',') : []
    }));
    
    res.json({
      status: rows.length ? true : false,
      msg: rows.length ? "Images found" : "No images found",
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


export default router;
