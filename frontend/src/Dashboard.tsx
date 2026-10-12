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

function IconReports() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M13.5 3v4.5H18M8 13h7M8 16.5h5" />
      </g>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9.5" cy="8.5" r="3.2" />
        <path d="M3.5 19.5c0-3 2.7-4.8 6-4.8s6 1.8 6 4.8" />
        <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.9c1.9.6 3 1.9 3 4.1" />
      </g>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v8" />
        <path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
      </g>
    </svg>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; name: string; description: string } | null>(
    null
  );
  const [view, setView] = useState<"laporan" | "pengguna">("laporan");

  const isReporter = user.role === "reporter";
  const isApprover = user.role === "approver";
  const isAdmin = user.role === "admin";

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

  const reportsTitle = isReporter ? "Laporan Saya" : "Semua Laporan";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="side-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                <path d="M13.5 3v4.5H18M8 13h7M8 16.5h5" />
              </g>
            </svg>
          </span>
          <span className="side-brand-text">Laporan Lapangan</span>
        </div>

        <nav className="nav">
          <button
            type="button"
            className={`nav-item ${view === "laporan" ? "active" : ""}`}
            aria-current={view === "laporan" ? "page" : undefined}
            onClick={() => setView("laporan")}
          >
            <IconReports />
            {reportsTitle}
            <span className="nav-count">{reports.length}</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${view === "pengguna" ? "active" : ""}`}
              aria-current={view === "pengguna" ? "page" : undefined}
              onClick={() => setView("pengguna")}
            >
              <IconUsers />
              Pengguna
            </button>
          )}
        </nav>

        <div className="side-user">
          <span className="avatar" aria-hidden="true">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="side-user-text">
            <span className="side-user-name" title={user.name}>
              {user.name}
            </span>
            <span className={`role role-${user.role}`}>{ROLE_LABEL[user.role]}</span>
          </span>
          <button
            type="button"
            className="btn-icon"
            onClick={onLogout}
            aria-label="Keluar"
            title="Keluar"
          >
            <IconLogout />
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="page-head">
          <h1>{view === "pengguna" ? "Kelola Pengguna" : reportsTitle}</h1>
          <p className="page-sub">
            {view === "pengguna"
              ? "Buat akun dan atur perannya. Tidak ada registrasi mandiri."
              : isReporter
                ? "Buat laporan baru dan sunting selama statusnya masih pending."
                : isApprover
                  ? "Tinjau laporan lapangan, lalu approve atau reject."
                  : "Pantau seluruh laporan lapangan yang masuk."}
          </p>
        </header>

        {view === "pengguna" ? (
          <Users />
        ) : (
          <>
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
                              onChange={(e) =>
                                setEditing({ ...editing, description: e.target.value })
                              }
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
                                    setEditing({
                                      id: r.id,
                                      name: r.name,
                                      description: r.description,
                                    })
                                  }
                                >
                                  Edit
                                </button>
                              </span>
                            ))}
                          {isAdmin && <span className="muted">—</span>}
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
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
