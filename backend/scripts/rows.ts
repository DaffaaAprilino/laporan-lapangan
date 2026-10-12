// Lihat isi tabel: npm run db:rows
import "dotenv/config";
import { pool } from "../src/db";

const QUERIES = {
  users: "SELECT id, name, email, role, created_at FROM users ORDER BY id",
  reports:
    "SELECT id, name, status, created_by, decided_by, decided_at, created_at FROM reports ORDER BY id",
};

Promise.all(Object.entries(QUERIES).map(async ([label, sql]) => [label, await pool.query(sql)]))
  .then((results) => {
    for (const [label, result] of results as [string, { rows: unknown[] }][]) {
      console.log(`\n== ${label} (${result.rows.length}) ==`);
      console.table(result.rows);
    }
  })
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
