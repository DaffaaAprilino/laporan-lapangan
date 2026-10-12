import { Request, Response, Router } from "express";
import { pool } from "../db";
import { asyncHandler, requireAuth, requireRole } from "../middleware";

const router = Router();

router.use(requireAuth);

// Kolom + join yang sama dipakai query daftar dan query satu laporan, agar nama
// pelapor & pemutus selalu ikut terkirim dan dashboard tidak perlu request tambahan.
const REPORT_COLUMNS = `
  r.id, r.name, r.description, r.status,
  r.created_by, reporter.name AS created_by_name,
  r.decided_by, decider.name AS decided_by_name,
  r.decided_at, r.created_at, r.updated_at
`;
const REPORT_JOINS = `
  JOIN users reporter ON reporter.id = r.created_by
  LEFT JOIN users decider ON decider.id = r.decided_by
`;

// Dipanggil setelah INSERT/UPDATE. Sengaja query terpisah, bukan CTE data-modifying:
// PostgreSQL memakai snapshot yang sama untuk query utama, sehingga baris yang baru
// diubah lewat CTE belum terlihat di query utama (hasilnya akan data lama).
const selectReport = (id: number) =>
  pool.query(`SELECT ${REPORT_COLUMNS} FROM reports r ${REPORT_JOINS} WHERE r.id = $1`, [id]);

const parseId = (raw: string) => (/^\d+$/.test(raw) ? Number(raw) : null);

// Dipakai bersama oleh POST (buat) dan PATCH (edit) agar pesan dan batasnya sama.
function readReportInput(body: unknown): { name: string; description: string } | { error: string } {
  const { name, description } = (body ?? {}) as Record<string, unknown>;
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanDescription = typeof description === "string" ? description.trim() : "";
  if (!cleanName || !cleanDescription) return { error: "nama dan deskripsi wajib diisi" };
  if (cleanName.length > 255) return { error: "nama maksimal 255 karakter" };
  return { name: cleanName, description: cleanDescription };
}

// Daftar laporan: pelapor hanya melihat miliknya, admin & approver melihat semua.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const own = req.user!.role === "reporter";
    const { rows } = await pool.query(
      `SELECT ${REPORT_COLUMNS} FROM reports r ${REPORT_JOINS}
       ${own ? "WHERE r.created_by = $1" : ""}
       ORDER BY r.created_at DESC`,
      own ? [req.user!.id] : []
    );
    res.json(rows);
  })
);

// Buat laporan — hanya pelapor; pemiliknya otomatis user yang login.
router.post(
  "/",
  requireRole("reporter"),
  asyncHandler(async (req, res) => {
    const input = readReportInput(req.body);
    if ("error" in input) {
      res.status(400).json({ error: input.error });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO reports (name, description, created_by) VALUES ($1, $2, $3) RETURNING id",
      [input.name, input.description, req.user!.id]
    );
    const created = await selectReport(rows[0].id);
    res.status(201).json(created.rows[0]);
  })
);

// Edit laporan — pelapor pemiliknya, dan hanya selama statusnya masih 'pending'.
router.patch(
  "/:id",
  requireRole("reporter"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(404).json({ error: "laporan tidak ditemukan" });
      return;
    }
    const input = readReportInput(req.body);
    if ("error" in input) {
      res.status(400).json({ error: input.error });
      return;
    }
    const { rows } = await pool.query(
      `UPDATE reports SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3 AND created_by = $4 AND status = 'pending'
       RETURNING id`,
      [input.name, input.description, id, req.user!.id]
    );
    if (!rows[0]) {
      // Bukan miliknya / sudah diputuskan / tidak ada — pelapor tidak perlu tahu yang mana.
      res.status(404).json({ error: "laporan tidak ditemukan atau sudah diputuskan" });
      return;
    }
    const updated = await selectReport(id);
    res.json(updated.rows[0]);
  })
);

// Approve / reject — hanya approver. Status boleh diubah kembali, keputusan terakhir yang dicatat.
router.patch(
  "/:id/status",
  requireRole("approver"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { status } = req.body ?? {};
    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ error: "status harus approved atau rejected" });
      return;
    }
    if (!id) {
      res.status(404).json({ error: "laporan tidak ditemukan" });
      return;
    }
    const { rows } = await pool.query(
      `UPDATE reports
       SET status = $1, decided_by = $2, decided_at = NOW(), updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [status, req.user!.id, id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "laporan tidak ditemukan" });
      return;
    }
    const updated = await selectReport(id);
    res.json(updated.rows[0]);
  })
);

export default router;
