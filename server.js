import express from "express";
import cors from "cors";
import hashtagRouter from "./routes/hashtag.js";
import uploadRouter from './routes/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// สร้าง __dirname สำหรับ ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/hashtags", hashtagRouter);

// serve ไฟล์ static โฟลเดอร์ uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ใช้ router
app.use('/api/uploads', uploadRouter);

app.listen(4000, () => console.log("Server running on http://localhost:4000"));
