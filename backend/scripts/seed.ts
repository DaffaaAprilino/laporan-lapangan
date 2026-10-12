// Akun demo + contoh laporan: npm run db:seed
import "dotenv/config";
import { hashPassword } from "../src/auth";
import { pool } from "../src/db";

const PASSWORD = "password123";

const ACCOUNTS = [
  { name: "Admin", email: "admin@laporan.test", role: "admin" },
  { name: "Approver", email: "approver@laporan.test", role: "approver" },
  { name: "Pelapor Lapangan", email: "pelapor@laporan.test", role: "reporter" },
] as const;

const SAMPLES = [
  {
    name: "Jalan berlubang di Jalan Raya No. 5",
    description:
      "Lubang sedalam 15 cm di lajur kiri arah Bandung. Berbahaya untuk pengendara motor, terutama malam hari karena penerangan jalan mati.",
  },
  {
    name: "Kerusakan tanggul Sungai Citarum Desa Mekarrahayu",
    description:
      "Tanggul sisi barat turun sekitar 40 cm sepanjang 25 meter.\nTitik koordinat: -6.9432, 107.5512.\nDampak: 18 rumah di RT 03 dan 04 berisiko terendam bila hujan deras lebih dari dua jam.",
  },
];

async function main() {
  const hash = await hashPassword(PASSWORD);
  for (const account of ACCOUNTS) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
      [account.name, account.email, hash, account.role]
    );
  }
  console.log("akun demo siap:", ACCOUNTS.map((a) => `${a.email} (${a.role})`).join(", "));

  const { rows } = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE email = $1",
    ["pelapor@laporan.test"]
  );
  const reporterId = rows[0].id;

  for (const sample of SAMPLES) {
    await pool.query(
      `INSERT INTO reports (name, description, created_by)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM reports WHERE name = $1::varchar)`,
      [sample.name, sample.description, reporterId]
    );
  }
  console.log(`contoh laporan untuk reporter id ${reporterId}: ${SAMPLES.length} baris`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
