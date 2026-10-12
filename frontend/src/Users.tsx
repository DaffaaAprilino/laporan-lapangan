import { useEffect, useState } from "react";
import type { Role, User } from "./api";
import { ApiError, createUser, deleteUser, fetchUsers } from "./api";
import { IconTrash } from "./icons";

const ROLES: Role[] = ["reporter", "approver", "admin"];

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

function Users({ currentUserId, onDeleted }: { currentUserId: number; onDeleted: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reporter" as Role });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat pengguna"));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const created = await createUser(form.name, form.email, form.password, form.role);
      setUsers((us) => [...us, created]);
      setNotice(`Akun ${created.email} dibuat.`);
      setForm({ name: "", email: "", password: "", role: "reporter" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat akun");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirming) return;
    setError("");
    setNotice("");
    setDeleting(true);
    try {
      const { deletedReports } = await deleteUser(confirming.id);
      setUsers((us) => us.filter((u) => u.id !== confirming.id));
      setNotice(
        deletedReports > 0
          ? `Akun ${confirming.email} dihapus beserta ${deletedReports} laporannya.`
          : `Akun ${confirming.email} dihapus.`
      );
      setConfirming(null);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus akun");
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <form className="form form-users" onSubmit={handleSubmit}>
        <h2>Buat Akun</h2>
        <div className="field-row">
          <label className="field">
            <span>Nama</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="text"
              minLength={6}
              placeholder="min. 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" disabled={busy}>
          {busy ? "Menyimpan…" : "Buat Akun"}
        </button>
      </form>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="table-wrap">
        <table className="table-users">
          <thead>
            <tr>
              <th className="col-user">Pengguna</th>
              <th className="col-role">Role</th>
              <th className="col-count">Laporan dibuat</th>
              <th className="col-created">Akun dibuat</th>
              <th className="col-del">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="cell-user" data-label="Pengguna">
                  <span className="name">{u.name}</span>
                  <span className="meta">{u.email}</span>
                </td>
                <td data-label="Role">
                  <span className={`role role-${u.role}`}>{u.role}</span>
                </td>
                <td className="cell-count" data-label="Laporan dibuat">
                  {u.report_count ?? 0}
                </td>
                <td className="cell-created" data-label="Akun dibuat">
                  {formatDate(u.created_at)}
                </td>
                <td className="cell-del" data-label="Aksi">
                  {u.id === currentUserId ? (
                    <span className="muted">Akun Anda</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      onClick={() => {
                        setNotice("");
                        setError("");
                        setConfirming(u);
                      }}
                      aria-label={`Hapus akun ${u.email}`}
                      title={`Hapus akun ${u.email}`}
                    >
                      <IconTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  Belum ada akun. Buat akun pertama lewat form di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirming(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hapus-akun"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="hapus-akun">Hapus akun ini?</h3>
            <p className="modal-text">
              <strong>{confirming.name}</strong> ({confirming.email})
              {(confirming.report_count ?? 0) > 0 ? (
                <>
                  {" "}
                  memiliki <strong>{confirming.report_count} laporan</strong> yang akan ikut
                  terhapus.
                </>
              ) : (
                " belum memiliki laporan."
              )}{" "}
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirming(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Menghapus…" : "Hapus akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Users;
