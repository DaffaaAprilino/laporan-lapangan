-- Skema database: Dashboard Laporan Lapangan
-- Jalankan di PostgreSQL/Neon:  psql "$DATABASE_URL" -f schema.sql

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;

-- Pengguna. Akun hanya dibuat oleh admin (tidak ada registrasi mandiri).
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'reporter', 'approver')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Laporan lapangan.
CREATE TABLE reports (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected')),
  -- Pelapor pemilik laporan; laporan hanya terlihat olehnya (admin & approver melihat semua).
  created_by  INTEGER NOT NULL REFERENCES users (id),
  -- Catatan keputusan terakhir: siapa dan kapan.
  decided_by  INTEGER REFERENCES users (id),
  decided_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reports_created_by_idx ON reports (created_by);
CREATE INDEX reports_status_idx ON reports (status);
