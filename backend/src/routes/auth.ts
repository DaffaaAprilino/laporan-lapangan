import { Router } from "express";
import { COOKIE_NAME, SESSION_MS, signToken, verifyPassword } from "../auth";
import { pool } from "../db";
import { asyncHandler, requireAuth } from "../middleware";

const router = Router();

// Login email + password → cookie httpOnly berisi JWT.
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ error: "email dan password wajib diisi" });
      return;
    }
    const { rows } = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = $1",
      [email]
    );
    const user = rows[0];
    // Pesan sama untuk email tidak dikenal dan password salah (tidak membocorkan akun terdaftar).
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: "email atau password salah" });
      return;
    }
    res.cookie(COOKIE_NAME, signToken(user.id), {
      httpOnly: true,
      // Production lintas domain (Vercel → Render) butuh SameSite=None + Secure
      // agar cookie sesi ikut pada fetch credentials: "include". Localhost tetap Lax.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MS,
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get(
  "/me",
  requireAuth,
  (req, res) => {
    res.json(req.user);
  }
);

export default router;
