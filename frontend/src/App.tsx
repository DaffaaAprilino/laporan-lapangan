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

  // Final decision: once approved/rejected, lock both actions
  const isDecided = (r: Report) => r.status !== "pending";

  return (
    <main className="container">
      <h1>Field Reports Dashboard</h1>
      <p className="subtitle">MAPID Study Case — Fullstack Developer</p>

      <div className="stats">
        <div className="stat total">
          <div className="label">Total</div>
          <div className="value">{reports.length}</div>
        </div>
        <div className="stat s-pending">
          <div className="label">Pending</div>
          <div className="value">{reports.filter((r) => r.status === "pending").length}</div>
        </div>
        <div className="stat s-approved">
          <div className="label">Approved</div>
          <div className="value">{reports.filter((r) => r.status === "approved").length}</div>
        </div>
        <div className="stat s-rejected">
          <div className="label">Rejected</div>
          <div className="value">{reports.filter((r) => r.status === "rejected").length}</div>
        </div>
      </div>

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

      <h2 className="section">Daftar Laporan</h2>
      <div className="table-wrap">
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
              <td className="name">{r.name}</td>
              <td>{r.description}</td>
              <td>
                <span className={`badge badge-${r.status}`}>{r.status}</span>
              </td>
              <td>
                <button
                  className="btn-approve"
                  disabled={isDecided(r)}
                  onClick={() => handleStatus(r.id, "approved")}
                >
                  Approve
                </button>
                <button
                  className="btn-reject"
                  disabled={isDecided(r)}
                  onClick={() => handleStatus(r.id, "rejected")}
                >
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
      </div>
    </main>
  );
}

export default App;
