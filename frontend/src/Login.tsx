import { useState } from "react";
import type { User } from "./api";
import { ApiError, login } from "./api";

function Login({ onSuccess }: { onSuccess: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
            <span className="input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="reveal"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                    <circle cx="12" cy="12" r="3.2" />
                    {showPassword && <path d="M4 20 20 4" />}
                  </g>
                </svg>
              </button>
            </span>
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

        <p className="login-note">
          Akun demo untuk mencoba tiap role tercantum di README repositori.
        </p>
      </section>
    </main>
  );
}

export default Login;
