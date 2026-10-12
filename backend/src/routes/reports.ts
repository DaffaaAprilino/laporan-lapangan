import { Request, RequestHandler, Response, Router } from "express";
import { pool } from "../db";

// Express 4 tidak menangkap rejection dari async handler — teruskan ke error middleware.
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

const router = Router();

// Buat laporan — status awal 'pending'
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body?.description === "string" ? req.body.description.trim() : "";
    if (!name || !description) {
      res.status(400).json({ error: "name and description are required" });
      return;
    }
    if (name.length > 255) {
      res.status(400).json({ error: "name must be at most 255 characters" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO reports (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    res.status(201).json(rows[0]);
  })
);

// Daftar laporan
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(rows);
  })
);

// Ubah status — hanya approved / rejected
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body ?? {};
    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ error: "status must be approved or rejected" });
      return;
    }
    const { rows } = await pool.query(
      "UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "report not found" });
      return;
    }
    res.json(rows[0]);
  })
);

export default router;
