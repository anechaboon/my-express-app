import pkg from 'pg';
import dotenv from 'dotenv'

dotenv.config();
const { Pool } = pkg;

export const db = new Pool({
  host: process.env.HOST,   
  user: process.env.USER,    
  password: process.env.PASSWORD,
  database: process.env.DATABASE,    
  port: process.env.PORT,          
});
