// Ganti seluruh isi tabel reports dengan 5 data demo general (npm run db:reseed-reports).
// Status sengaja beragam (2 pending, 2 approved, 1 rejected) agar dashboard terlihat hidup.
import "dotenv/config";
import { pool } from "../src/db";

const REPORTS = [
  {
    name: "Jalan berlubang di Jalan Merdeka",
    description:
      "Lubang berdiameter sekitar 80 cm dan kedalaman 15 cm di lajur lambat depan minimarket. Berbahaya bagi pengendara motor, terutama saat hujan karena lubang tertutup genangan.",
  },
  {
    name: "Lampu penerangan jalan mati total di Jl. Kartini",
    description:
      "Sembilan titik lampu jalan mati sepanjang 300 meter, sudah lebih dari dua minggu. Jalan gelap total malam hari dan rawan kecelakaan serta kriminalitas.",
  },
  {
    name: "Saluran air tersumbat menyebabkan banjir di Kelurahan Sukamaju",
    description:
      "Saluran drainase tersumbat sampah dan lumpur sehingga air menggenangi 12 rumah setiap hujan deras lebih dari satu jam. Perlu pengerukan dan penambahan gorong-gorong.",
  },
  {
    name: "Rusuk jembatan kampung retak parah",
    description:
      "Retakan memanjang sekitar 2 meter pada rusuk jembatan penghubung Dusun 3 dan Dusun 4. Beton mulai mengelupas dan tulangan terlihat. Kendaraan berat sebaiknya dialihkan.",
  },
  {
    name: "Taman kota terbengkalai dan peralatan mainan rusak",
    description:
      "Perosotan dan ayunan berkarat dengan rantai putus, rumput tinggi tidak pernah dipotong. Warga mengusulkan perbaikan sekaligus penerangan agar taman bisa dipakai sore hari.",
  },
];

async function main() {
  // Semua laporan demo dimiliki reporter (id 3 di skema akun seed).
  const { rows: reporters } = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE role = 'reporter' ORDER BY id LIMIT 1"
  );
  if (!reporters[0]) {
    throw new Error("tidak ada user reporter — jalankan db:seed dulu");
  }
  const reporterId = reporters[0].id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM reports");
    for (const r of REPORTS) {
      await client.query(
        "INSERT INTO reports (name, description, created_by) VALUES ($1, $2, $3)",
        [r.name, r.description, reporterId]
      );
    }
    // Status akhir: baris 2 & 3 approved, baris 4 rejected (satu keputusan per baris).
    const { rows: approvers } = await client.query<{ id: number }>(
      "SELECT id FROM users WHERE role = 'approver' ORDER BY id LIMIT 1"
    );
    const approverId = approvers[0]?.id ?? null;
    await client.query(
      `UPDATE reports SET status = 'approved', decided_by = $1, decided_at = NOW()
       WHERE name IN ($2, $3)`,
      [approverId, REPORTS[1].name, REPORTS[2].name]
    );
    await client.query(
      `UPDATE reports SET status = 'rejected', decided_by = $1, decided_at = NOW()
       WHERE name = $2`,
      [approverId, REPORTS[3].name]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await pool.query<{ name: string; status: string }>(
    "SELECT name, status FROM reports ORDER BY id"
  );
  console.log(`terisi ${rows.length} laporan demo:`);
  for (const r of rows) console.log(` - [${r.status}] ${r.name}`);
}
main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
