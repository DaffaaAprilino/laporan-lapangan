import { useEffect, useState } from "react";
import type { Report, Status, User } from "./api";
import { ApiError, createReport, fetchReports, updateReport, updateStatus } from "./api";
import Users from "./Users";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

const ROLE_LABEL: Record<User["role"], string> = {
  admin: "Admin",
  reporter: "Pelapor",
  approver: "Approver",
};

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; name: string; description: string } | null>(
    null
  );

  const isReporter = user.role === "reporter";
  const isApprover = user.role === "approver";

  const load = () => {
    fetchReports()
      .then(setReports)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat laporan"));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const created = await createReport(name, description);
      setReports((rs) => [created, ...rs]);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah laporan");
    }
  };

  const handleStatus = async (id: number, status: Status) => {
    setError("");
    setBusyId(id);
    try {
      const updated = await updateStatus(id, status);
      setReports((rs) => rs.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setError("");
    setBusyId(editing.id);
    try {
      const updated = await updateReport(editing.id, editing.name, editing.description);
      setReports((rs) => rs.map((r) => (r.id === editing.id ? updated : r)));
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setBusyId(null);
    }
  };

  const counts: Record<Status, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of reports) counts[r.status] += 1;

  return (
    <main className="container">
      <header className="head head-row">
        <h1>Dashboard Laporan Lapangan</h1>
        <div className="who">
          <span className="who-name">{user.name}</span>
          <span className={`role role-${user.role}`}>{ROLE_LABEL[user.role]}</span>
          <button className="btn-ghost" onClick={onLogout}>
            Keluar
          </button>
        </div>
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

      {isReporter && (
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
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <h2 className="section">
        {isReporter ? "Laporan Saya" : "Semua Laporan"} <span className="count">{reports.length}</span>
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
            {reports.map((r) => {
              const isEditing = editing?.id === r.id;
              return (
                <tr key={r.id}>
                  <td className="cell-name" data-label="Nama">
                    {isEditing ? (
                      <input
                        className="inline"
                        maxLength={255}
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      />
                    ) : (
                      <span className="name-wrap">
                        <span className="name">{r.name}</span>
                        <span className="meta">
                          {/* Pelapor tahu laporan ini miliknya — nama tidak perlu diulang. */}
                          {isReporter ? "" : `${r.created_by_name} · `}
                          {formatDate(r.created_at)}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="cell-desc" data-label="Deskripsi">
                    {isEditing ? (
                      <textarea
                        className="inline"
                        value={editing.description}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      />
                    ) : (
                      r.description
                    )}
                  </td>
                  <td data-label="Status">
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                    {r.decided_by_name && r.decided_at && (
                      <span className="meta">
                        {r.decided_by_name} · {formatDate(r.decided_at)}
                      </span>
                    )}
                  </td>
                  <td className="cell-actions" data-label="Aksi">
                    {isApprover && (
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
                    )}
                    {isReporter &&
                      (isEditing ? (
                        <span className="actions">
                          <button
                            className="btn-save"
                            disabled={busyId === r.id}
                            onClick={handleSaveEdit}
                          >
                            Simpan
                          </button>
                          <button className="btn-ghost" onClick={() => setEditing(null)}>
                            Batal
                          </button>
                        </span>
                      ) : (
                        <span className="actions">
                          <button
                            className="btn-edit"
                            disabled={r.status !== "pending"}
                            title={
                              r.status === "pending"
                                ? "Edit laporan"
                                : "Hanya laporan pending yang bisa diedit"
                            }
                            onClick={() =>
                              setEditing({ id: r.id, name: r.name, description: r.description })
                            }
                          >
                            Edit
                          </button>
                        </span>
                      ))}
                    {user.role === "admin" && <span className="muted">—</span>}
                  </td>
                </tr>
              );
            })}
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

      {user.role === "admin" && <Users />}
    </main>
  );
}

export default Dashboard;
