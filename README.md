# Study Case — Dashboard Laporan Lapangan

Aplikasi web untuk mengelola laporan lapangan: REST API + dashboard berautentikasi.

- **Backend:** Express.js (TypeScript) + PostgreSQL (Neon) — `backend/`
- **Frontend:** React (Vite, TypeScript) — `frontend/`

## Fitur

- Login/logout dengan sesi JWT di cookie **httpOnly** (tidak disimpan di localStorage).
- Tiga role: `reporter`, `approver`, `admin`.
- Pelapor membuat laporan dan hanya melihat **laporannya sendiri**.
- Pelapor dapat **mengedit** laporannya selama statusnya masih `pending`.
- Approver melihat semua laporan dan dapat **approve/reject**; status boleh diubah kembali.
- Setiap keputusan mencatat **siapa** (approver) dan **kapan** (`decided_by`, `decided_at`).
- Admin membuat akun pengguna (tidak ada registrasi mandiri) dan melihat semua laporan.
- Ringkasan jumlah laporan per status pada dashboard.

## Arsitektur

```
frontend/ (React + Vite, :5173)
   │  fetch + credentials: "include"  → cookie sesi ikut otomatis
   ▼
backend/ (Express TS, :3001)
   ├── /api/auth     login, logout, me            (publik / butuh login)
   ├── /api/users    daftar & buat akun           (hanya admin)
   └── /api/reports  laporan + approve/reject     (butuh login + role)
   ▼
PostgreSQL (Neon) — tabel users, reports
```

Alur satu permintaan: `cookie → requireAuth (baca JWT, ambil user dari DB) → requireRole → handler → pool.query`. Peran dibaca ulang dari DB setiap permintaan, jadi perubahan role langsung berlaku tanpa login ulang.

## Matriks Hak Akses

| Aksi | reporter | approver | admin |
| --- | --- | --- | --- |
| Login / logout | ✅ | ✅ | ✅ |
| Lihat daftar laporan | hanya miliknya | semua | semua |
| Buat laporan | ✅ | ❌ | ❌ |
| Edit laporan | miliknya, status `pending` | ❌ | ❌ |
| Approve / reject | ❌ | ✅ | ❌ |
| Kelola pengguna | ❌ | ❌ | ✅ |

Role sengaja dipisah agar hak approve dan hak melapor tidak berada di satu akun. Endpoint yang salah role dibalas `403`; yang belum login dibalas `401`.

## Menjalankan Project

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # Windows: copy .env.example .env
# isi DATABASE_URL (Neon/PostgreSQL, sslmode=require) dan JWT_SECRET (string acak)
npm run db:migrate            # buat tabel users + reports
npm run db:seed               # akun demo + 2 contoh laporan
npm run dev                   # http://localhost:3001
```

Variabel `.env`:

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Koneksi PostgreSQL/Neon (`sslmode=require`) |
| `PORT` | Port API (default `3001`) |
| `JWT_SECRET` | Kunci tanda tangan sesi — wajib, ganti dengan string acak |
| `CORS_ORIGIN` | Origin dashboard untuk CORS berkredensial (default `http://localhost:5173`) |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run dev                   # http://localhost:5173
```

`VITE_API_URL` menunjuk ke basis API (`http://localhost:3001/api`). Port `3001` hanya API — buka `/` untuk daftar endpoint, bukan halaman HTML. Dashboard ada di port Vite.

## Akun Demo

Semua akun dibuat oleh `npm run db:seed`. **Password ketiganya sama: `password123`** — pakai ini untuk login di dashboard.

| Email | Password | Role | Bisa apa |
| --- | --- | --- | --- |
| `admin@laporan.test` | `password123` | admin | Membuat akun, melihat semua laporan |
| `approver@laporan.test` | `password123` | approver | Approve/reject semua laporan |
| `pelapor@laporan.test` | `password123` | reporter | Membuat & mengedit laporan miliknya |

Alur uji cepat: login sebagai **pelapor** → tambah laporan → keluar → login sebagai **approver** → Approve/Reject → kolom Status menampilkan siapa yang memutuskan dan kapan.

> Akun ini hanya untuk penilaian/demo. Ganti password dan `JWT_SECRET` bila dipakai sungguhan.

## Endpoint API

| Method | Path | Akses | Deskripsi |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | publik | `{ email, password }` → set cookie sesi |
| POST | `/api/auth/logout` | publik | Hapus cookie sesi |
| GET | `/api/auth/me` | login | Profil user yang sedang masuk |
| GET | `/api/users` | admin | Daftar pengguna |
| POST | `/api/users` | admin | `{ name, email, password, role }` |
| GET | `/api/reports` | login | reporter: miliknya; approver & admin: semua |
| POST | `/api/reports` | reporter | `{ name, description }` |
| PATCH | `/api/reports/:id` | reporter (pemilik) | `{ name, description }` — hanya saat `pending` |
| PATCH | `/api/reports/:id/status` | approver | `{ status: "approved" \| "rejected" }` |

Kode balasan: `400` input tidak valid, `401` belum login / sesi kedaluwarsa, `403` role tidak berwenang, `404` laporan tidak ada / bukan miliknya / sudah diputuskan, `409` email sudah terdaftar, `500` error server.

Contoh dengan curl:

```bash
curl -c cookie.txt -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"approver@laporan.test","password":"password123"}'

curl -b cookie.txt http://localhost:3001/api/reports

curl -b cookie.txt -X PATCH http://localhost:3001/api/reports/1/status \
  -H 'Content-Type: application/json' -d '{"status":"approved"}'
```

## Skema Database

`backend/schema.sql` — jalankan lewat `npm run db:migrate` (atau `psql "$DATABASE_URL" -f backend/schema.sql`).

- `users` — `id`, `name`, `email` (unik), `password_hash` (scrypt `salt:hash`), `role` (`admin`/`reporter`/`approver`), `created_at`.
- `reports` — `id`, `name`, `description`, `status` (`pending`/`approved`/`rejected`, default `pending`), `created_by` → `users.id`, `decided_by` → `users.id`, `decided_at`, `created_at`, `updated_at`.

Script bantu (dari folder `backend`):

```bash
npm run db:rows     # cetak isi tabel users & reports
```

Isi tabel juga bisa dilihat di **Neon Console → Tables**, atau `psql "$DATABASE_URL" -c "SELECT * FROM reports;"`.

## Catatan Keamanan

- Password di-hash dengan **scrypt** (`node:crypto`) + salt acak; verifikasi memakai perbandingan waktu-tetap.
- Sesi berupa JWT 8 jam di cookie `httpOnly` + `sameSite=lax` (dan `secure` saat `NODE_ENV=production`).
- Login gagal membalas pesan yang sama untuk email tidak dikenal dan password salah.
- Endpoint hanya menerima `approved`/`rejected` sebagai status; kolom `status` juga dibatasi `CHECK` di database.
- Validasi ada di sisi server (nama wajib, maksimal 255 karakter, password minimal 6 karakter) — bukan hanya di UI.

## Deploy

Belum di-deploy — jalankan secara lokal sesuai langkah di atas.
