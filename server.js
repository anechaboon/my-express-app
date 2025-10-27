import express from "express";
import cors from "cors";
import hashtagRouter from "./routes/hashtag.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/hashtags", hashtagRouter);

app.listen(4000, () => console.log("Server running on http://localhost:4000"));
