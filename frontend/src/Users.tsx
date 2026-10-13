import { useEffect, useState } from "react";
import type { Role, User } from "./api";
import { ApiError, createUser, deleteUser, fetchUsers } from "./api";
import { IconCheck, IconTrash } from "./icons";

const ROLES: Role[] = ["reporter", "approver", "admin"];

const ROLE_LABEL: Record<Role, string> = {
  reporter: "Pelapor",
  approver: "Approver",
  admin: "Admin",
};

// Satu kalimat per role: pengguna baru tahu apa yang bisa dilakukan akun
// yang ia buat tanpa harus menebak dari nama rolenya.
const ROLE_DESC: Record<Role, string> = {
  reporter: "Membuat dan mengedit laporan sendiri",
  approver: "Menyetujui atau menolak laporan masuk",
  admin: "Mengelola akun dan seluruh data",
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

function Users({ currentUserId, onDeleted }: { currentUserId: number; onDeleted: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  // Role tidak diisi default: pengguna harus memilih secara sadar.
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "" as Role | "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tutup dialog dengan tombol Escape (keyboard a11y).
  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirming(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, deleting]);

  const load = () => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat pengguna"));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) return; // pengaman; `required` pada radio sudah mencegah submit
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const created = await createUser(form.name, form.email, form.password, form.role);
      setUsers((us) => [...us, created]);
      setNotice(`Akun ${created.email} dibuat.`);
      setForm({ name: "", email: "", password: "", role: "" });
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
      <div className="users-grid">
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
              type="password"
              autoComplete="new-password"
              minLength={6}
              placeholder="min. 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="field">
          <span>Role</span>
          {/* Kartu radio, bukan toggle: satu pilihan selalu jelas terpilih,
              dan deskripsi singkat menjelaskan hak tiap role. */}
          <div className="role-cards" role="radiogroup" aria-label="Role akun baru">
            {ROLES.map((role) => (
              <label
                key={role}
                className={`role-card ${form.role === role ? "checked" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={form.role === role}
                  onChange={() => setForm({ ...form, role })}
                  required
                />
                <span className="role-card-check" aria-hidden="true">
                  <IconCheck size={13} />
                </span>
                <span className="role-card-body">
                  <span className="role-card-name">{ROLE_LABEL[role]}</span>
                  <span className="role-card-desc">{ROLE_DESC[role]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </form>

      <div className="users-main">
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

      <h2 className="table-title">Daftar Akun</h2>
      <div className="table-wrap">
        <table className="table-users">
          <thead>
            <tr>
              <th className="col-user">Pengguna</th>
              <th className="col-role">Role</th>
              <th className="col-created">Terdaftar</th>
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
                  <span className={`role role-${u.role}`}>{ROLE_LABEL[u.role]}</span>
                </td>
                <td className="cell-created" data-label="Terdaftar">
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
                <td colSpan={4} className="empty">
                  Belum ada akun. Buat akun pertama lewat form di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
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
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
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
