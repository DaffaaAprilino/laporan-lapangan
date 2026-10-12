import { useState } from "react";
import type { User } from "./api";
import { ApiError, login } from "./api";

// Akun demo dari `npm run db:seed` — memudahkan penilai mencoba tiap role.
const DEMO = [
  { role: "Pelapor", email: "pelapor@laporan.test" },
  { role: "Approver", email: "approver@laporan.test" },
  { role: "Admin", email: "admin@laporan.test" },
];

const DEMO_PASSWORD = "password123";

function Login({ onSuccess }: { onSuccess: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      onSuccess(await login(email, password));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  };

  const useDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M13.5 3v4.5H18" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M8 12.5h7M8 16h5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <h1>Dashboard Laporan Lapangan</h1>
            <p className="brand-sub">Masuk untuk mengelola laporan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              placeholder="nama@laporan.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <div className="demo">
          <p className="demo-title">Akun demo</p>
          <div className="demo-list">
            {DEMO.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-chip"
                onClick={() => useDemo(account.email)}
              >
                <span className="demo-role">{account.role}</span>
                <span className="demo-email">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="demo-note">
            Klik untuk mengisi otomatis. Password semuanya <code>{DEMO_PASSWORD}</code>.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
