import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import reportsRouter from "./routes/reports";
import usersRouter from "./routes/users";

const app = express();
// credentials: true + origin eksplisit — browser menolak cookie bila origin berupa "*".
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);

// Info root — port ini API saja, dashboard ada di Vite (5173).
app.get("/", (_req, res) => {
  res.json({
    service: "Field Reports API",
    endpoints: [
      "POST /api/auth/login { email, password }",
      "POST /api/auth/logout",
      "GET /api/auth/me",
      "GET /api/users (admin)",
      "POST /api/users { name, email, password, role } (admin)",
      "GET /api/reports (reporter: miliknya sendiri)",
      "POST /api/reports { name, description } (reporter)",
      "PATCH /api/reports/:id { name, description } (reporter, pemilik, status pending)",
      "PATCH /api/reports/:id/status { status: 'approved' | 'rejected' } (approver)",
    ],
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "endpoint tidak ditemukan" });
});

// Error middleware: detail hanya ke log server, client dapat pesan umum.
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({ error: status === 500 ? "internal server error" : err.message });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
