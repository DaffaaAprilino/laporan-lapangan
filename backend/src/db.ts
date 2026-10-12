import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  // Neon/Supabase butuh SSL; PostgreSQL lokal biasanya tidak.
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
