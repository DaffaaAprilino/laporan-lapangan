import { Router } from "express";
import { hashPassword, Role } from "../auth";
import { pool } from "../db";
import { asyncHandler, requireAuth, requireRole } from "../middleware";

const router = Router();

const ROLES: Role[] = ["admin", "reporter", "approver"];

// Semua endpoint di sini hanya untuk admin (akun dibuatkan admin, bukan registrasi mandiri).
router.use(requireAuth, requireRole("admin"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at"
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
      res.status(400).json({ error: "name, email, dan password wajib diisi" });
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
       RETURNING id, name, email, role, created_at`,
      [name, email, await hashPassword(password), role]
    );
    res.status(201).json(rows[0]);
  })
);

export default router;
