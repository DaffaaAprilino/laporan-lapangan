import { useEffect, useState } from "react";
import type { Report, Status } from "./api";
import { createReport, fetchReports, updateStatus } from "./api";
import "./App.css";

function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetchReports().then(setReports).catch(() => setError("Gagal memuat laporan"));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createReport(name, description);
      setName("");
      setDescription("");
      load();
    } catch {
      setError("Gagal menambah laporan");
    }
  };

  const handleStatus = async (id: number, status: Status) => {
    try {
      await updateStatus(id, status);
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      setError("Gagal mengubah status");
    }
  };

  return (
    <main className="container">
      <h1>Field Reports Dashboard</h1>
      <p className="subtitle">MAPID Study Case — Fullstack Developer</p>

      <form className="form" onSubmit={handleCreate}>
        <h2>Tambah Laporan</h2>
        <input
          placeholder="Nama laporan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Deskripsi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Simpan</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Daftar Laporan</h2>
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Deskripsi</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.description}</td>
              <td>
                <span className={`badge badge-${r.status}`}>{r.status}</span>
              </td>
              <td>
                <button className="btn-approve" onClick={() => handleStatus(r.id, "approved")}>
                  Approve
                </button>
                <button className="btn-reject" onClick={() => handleStatus(r.id, "rejected")}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan={4} className="empty">
                Belum ada laporan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

export default App;
