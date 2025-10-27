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
const id = String(Date.now()) + Math.round(Math.random() * 1E9);
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
    const uniqueName = id + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload-image', upload.single('image'), async (req, res) => {
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

export default router;
