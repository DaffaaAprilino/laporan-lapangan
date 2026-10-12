import { NextFunction, Request, RequestHandler, Response } from "express";
import { COOKIE_NAME, readToken, Role, User } from "./auth";
import { pool } from "./db";

// Express 4 tidak menangkap rejection dari async handler — teruskan ke error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

// Sesi diambil dari cookie httpOnly; user dibaca ulang dari DB agar perubahan role langsung berlaku.
export const requireAuth: RequestHandler = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  const userId = typeof token === "string" ? readToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: "belum login" });
    return;
  }
  const { rows } = await pool.query<User>(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [userId]
  );
  if (!rows[0]) {
    res.status(401).json({ error: "sesi tidak valid" });
    return;
  }
  req.user = rows[0];
  next();
});

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "role tidak berwenang untuk aksi ini" });
      return;
    }
    next();
  };
