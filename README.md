# MAPID Study Case — Field Reports Dashboard

Aplikasi web sederhana untuk mengelola laporan lapangan: REST API + dashboard.

- **Backend:** Express.js (TypeScript) + PostgreSQL (Neon)
- **Frontend:** React (Vite, TypeScript)

## Fitur

- Buat laporan (nama, deskripsi) — status awal `pending`
- Tampilkan daftar laporan dalam tabel
- Ubah status laporan menjadi `approved` / `rejected`

## Struktur

```
backend/    Express TS API + schema.sql
frontend/   React Vite dashboard
```

## Menjalankan Backend

```bash
cd backend
npm install
# isi .env:
# DATABASE_URL=postgresql://... (Neon/PostgreSQL)
# PORT=3001
npm run dev
```

API berjalan di `http://localhost:3001`.

### Endpoint

| Method | Path                  | Deskripsi                          |
| ------ | --------------------- | ---------------------------------- |
| GET    | `/api/reports`        | Daftar semua laporan               |
| POST   | `/api/reports`        | Buat laporan `{ name, description }` |
| PATCH  | `/api/reports/:id/status` | Ubah status `{ status: "approved" \| "rejected" }` |

### Skema Database

Jalankan `backend/schema.sql` pada database PostgreSQL (sudah diterapkan ke Neon).

## Menjalankan Frontend

```bash
cd frontend
npm install
# isi .env:
# VITE_API_URL=http://localhost:3001/api/reports
npm run dev
```

Dashboard berjalan di `http://localhost:5174`.
