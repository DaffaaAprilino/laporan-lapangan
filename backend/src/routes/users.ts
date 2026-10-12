import { Router } from "express";
import { hashPassword, Role } from "../auth";
import { pool } from "../db";
import { asyncHandler, requireAuth, requireRole } from "../middleware";

const router = Router();

const ROLES: Role[] = ["admin", "reporter", "approver"];

// Semua endpoint di sini hanya untuk admin (akun dibuatkan admin, bukan registrasi mandiri).
router.use(requireAuth, requireRole("admin"));

// Jumlah laporan per akun ikut dikirim: dipakai tabel dan peringatan sebelum menghapus.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              count(r.id)::int AS report_count
       FROM users u
       LEFT JOIN reports r ON r.created_by = u.id
       GROUP BY u.id
       ORDER BY u.created_at`
    );
    res.json(rows);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const role = req.body?.role as Role;

    if (!name || !email || !password) {
      res.status(400).json({ error: "nama, email, dan password wajib diisi" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "password minimal 6 karakter" });
      return;
    }
    if (!ROLES.includes(role)) {
      res.status(400).json({ error: "role harus admin, reporter, atau approver" });
      return;
    }

    const exists = await pool.query("SELECT 1 FROM users WHERE lower(email) = $1", [email]);
    if (exists.rowCount) {
      res.status(409).json({ error: "email sudah terdaftar" });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, 0 AS report_count`,
      [name, email, await hashPassword(password), role]
    );
    res.status(201).json(rows[0]);
  })
);

// Hapus akun. Laporan miliknya ikut terhapus (ON DELETE CASCADE); keputusan yang
// pernah ia buat tetap tersimpan dengan decided_by dikosongkan.
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = /^\d+$/.test(req.params.id) ? Number(req.params.id) : null;
    if (!id) {
      res.status(404).json({ error: "pengguna tidak ditemukan" });
      return;
    }
    if (id === req.user!.id) {
      res.status(400).json({ error: "tidak bisa menghapus akun yang sedang dipakai" });
      return;
    }

    const target = await pool.query<{ role: Role }>("SELECT role FROM users WHERE id = $1", [id]);
    if (!target.rows[0]) {
      res.status(404).json({ error: "pengguna tidak ditemukan" });
      return;
    }
    if (target.rows[0].role === "admin") {
      const { rows } = await pool.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM users WHERE role = 'admin'"
      );
      if (rows[0].n <= 1) {
        res.status(400).json({ error: "harus tersisa minimal satu admin" });
        return;
      }
    }

    // Dihitung dulu agar UI bisa memberi tahu berapa laporan yang ikut terhapus.
    const reports = await pool.query("DELETE FROM reports WHERE created_by = $1 RETURNING id", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ deletedReports: reports.rowCount ?? 0 });
  })
);

export default router;
