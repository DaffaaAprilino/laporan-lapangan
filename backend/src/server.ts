import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import reportsRouter from "./routes/reports";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/reports", reportsRouter);

// Info root — port ini API saja, dashboard ada di Vite (5173).
app.get("/", (_req, res) => {
  res.json({
    service: "MAPID Field Reports API",
    endpoints: [
      "GET /api/reports",
      "POST /api/reports { name, description }",
      "PATCH /api/reports/:id/status { status: 'approved' | 'rejected' }",
    ],
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
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
