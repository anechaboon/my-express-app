import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from "../dbpg.js";
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

  const result = await db.query("INSERT INTO images (file_name, file_path) VALUES ($1, $2) RETURNING id", [
    req.file.filename,
    `/uploads/${req.file.filename}`
  ]);
  res.json({
    id: result.rows[0].id,
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
      db.query("SELECT id, name FROM images WHERE name LIKE $1 LIMIT $2 OFFSET $3", [
        searchPattern,
        limit,
        offset
      ]).then(([result]) => result),
      db.query("SELECT COUNT(*) as count FROM images WHERE name LIKE $1", [searchPattern])
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
      JOIN image_has_hashtags ON images.id = image_has_hashtags.image_id
      JOIN hashtags ON image_has_hashtags.hashtag_id = hashtags.id `;
    let queryParams = [];
    let countParams = [];
    let whereClause = "";

    if (hashtag) {
      whereClause = ` WHERE hashtags.name = $1 `;
      queryParams = [hashtag, limit, offset];
      countParams = [hashtag];
    } else {
      queryParams = [limit, offset];
      countParams = [];
    }

    const fullSql = `
      SELECT array_agg(hashtags.name) AS hashtags, images.id, images.file_name, images.file_path
      ${sqlWhere}
      ${whereClause}
      GROUP BY images.id
      LIMIT $${hashtag ? 2 : 1} OFFSET $${hashtag ? 3 : 2}
    `;

    const countSql = `
      SELECT COUNT(DISTINCT images.id) as count
      ${sqlWhere}
      ${whereClause}
    `;

    const [fullResult, countResult] = await Promise.all([
      db.query(fullSql, queryParams),
      db.query(countSql, countParams)
    ]);
    const rows = fullResult.rows || fullResult;
    const total = countResult.rows ? countResult.rows[0].count : countResult[0].count;

    const data = rows.map(r => ({
      id: r.id,
      file_name: r.file_name,
      file_path: r.file_path,
      hashtags: r.hashtags || []
    }));

    res.json({
      status: rows.length ? true : false,
      msg: rows.length ? "Images found" : "No images found",
      data,
      pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// unlink whole folder uploads
router.delete('/clearUploads', async (req, res) => {
  try { 
    if (fs.existsSync(uploadDir)) {
      fs.readdirSync(uploadDir).forEach((file) => {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
      });

      // delete all records in images table
      await db.query("DELETE FROM images");
      // delete all records in image_has_hashtags table
      await db.query("DELETE FROM image_has_hashtags");
      
      res.json({ status: true, msg: 'All uploaded files deleted' });
    } else {
      res.status(400).json({ status: false, msg: 'Uploads folder does not exist' });
    }   
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting files: " + err.message });
  } 
});

export default router;
