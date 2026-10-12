// Jalankan skema: npm run db:migrate  (mengeksekusi backend/schema.sql)
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "../src/db";

pool
  .query(readFileSync(join(__dirname, "..", "schema.sql"), "utf8"))
  .then(() => console.log("skema diterapkan"))
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
