import pkg from 'pg';
import dotenv from 'dotenv'

dotenv.config();
const { Pool } = pkg;

export const db = new Pool({
  host: process.env.DB_HOST,   
  user: process.env.DB_USER,    
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,   
  ssl: {
    rejectUnauthorized: false, // ✅ จำเป็นใน Render
  },       
});
