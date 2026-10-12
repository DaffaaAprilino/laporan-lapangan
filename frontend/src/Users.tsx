import { useEffect, useState } from "react";
import type { Role, User } from "./api";
import { ApiError, createUser, fetchUsers } from "./api";

const ROLES: Role[] = ["reporter", "approver", "admin"];

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reporter" as Role });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

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

      {notice && <p className="notice">{notice}</p>}
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
              <th className="col-desc">Email</th>
              <th className="col-status">Role</th>
              <th className="col-actions">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Nama">{u.name}</td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Role">
                  <span className={`role role-${u.role}`}>{u.role}</span>
                </td>
                <td data-label="Dibuat" className="cell-actions">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Users;
