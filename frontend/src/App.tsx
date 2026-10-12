import { useEffect, useState } from "react";
import type { Report, Status } from "./api";
import { createReport, fetchReports, updateStatus } from "./api";
import "./App.css";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

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
    setError("");
    setBusyId(id);
    try {
      const updated = await updateStatus(id, status);
      setReports((rs) => rs.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError("Gagal mengubah status");
    } finally {
      setBusyId(null);
    }
  };

  const counts: Record<Status, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of reports) counts[r.status] += 1;

  return (
    <main className="container">
      <header className="head">
        <h1>Dashboard Laporan Lapangan</h1>
      </header>

      <div className="stats">
        <div className="stat stat-total">
          <span className="label">Total</span>
          <span className="value">{reports.length}</span>
        </div>
        <div className="stat stat-pending">
          <span className="label">Pending</span>
          <span className="value">{counts.pending}</span>
        </div>
        <div className="stat stat-approved">
          <span className="label">Approved</span>
          <span className="value">{counts.approved}</span>
        </div>
        <div className="stat stat-rejected">
          <span className="label">Rejected</span>
          <span className="value">{counts.rejected}</span>
        </div>
      </div>

      <form className="form" onSubmit={handleCreate}>
        <h2>Tambah Laporan</h2>
        <label className="field">
          <span>Nama</span>
          <input
            placeholder="Contoh: Jembatan rusak Cimahi"
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Deskripsi</span>
          <textarea
            placeholder="Kondisi, lokasi, dan detail temuan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <button type="submit">Simpan</button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <h2 className="section">
        Daftar Laporan <span className="count">{reports.length}</span>
      </h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-name">Nama</th>
              <th className="col-desc">Deskripsi</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="cell-name" data-label="Nama">
                  <span className="name-wrap">
                    <span className="name">{r.name}</span>
                    <span className="meta">{formatDate(r.created_at)}</span>
                  </span>
                </td>
                <td className="cell-desc" data-label="Deskripsi">
                  {r.description}
                </td>
                <td data-label="Status">
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </td>
                <td className="cell-actions" data-label="Aksi">
                  <span className="actions">
                    <button
                      className="btn-approve"
                      disabled={busyId === r.id}
                      onClick={() => handleStatus(r.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      disabled={busyId === r.id}
                      onClick={() => handleStatus(r.id, "rejected")}
                    >
                      Reject
                    </button>
                  </span>
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
