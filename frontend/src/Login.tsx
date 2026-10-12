import { useState } from "react";
import type { User } from "./api";
import { ApiError, login } from "./api";

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

  return (
    <main className="container container-narrow">
      <header className="head">
        <h1>Dashboard Laporan Lapangan</h1>
      </header>

      <form className="form form-login" onSubmit={handleSubmit}>
        <h2>Masuk</h2>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            placeholder="nama@mapid.test"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Memproses…" : "Masuk"}
        </button>
        <p className="hint">
          Akun dibuat oleh admin. Gunakan akun demo pada README bila tersedia.
        </p>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}

export default Login;
