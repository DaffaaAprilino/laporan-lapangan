import { useEffect, useState } from "react";
import type { User } from "./api";
import { logout, me } from "./api";
import Dashboard from "./Dashboard";
import Login from "./Login";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Cookie sesi mungkin masih berlaku — cek ke API, bukan ke localStorage.
    me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    setUser(null);
  };

  if (checking) {
    return (
      <main className="container">
        <p className="loading">Memuat…</p>
      </main>
    );
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <Login onSuccess={setUser} />
  );
}

export default App;
