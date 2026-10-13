export type Status = "pending" | "approved" | "rejected";
export type Role = "admin" | "reporter" | "approver";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
  report_count?: number;
}

export interface Report {
  id: number;
  name: string;
  description: string;
  status: Status;
  created_by: number;
  created_by_name: string;
  decided_by: number | null;
  decided_by_name: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

// Basis API (tanpa /reports) — contoh: http://localhost:3001/api
const API = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// credentials: "include" wajib agar cookie sesi httpOnly ikut terkirim.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? "Terjadi kesalahan", res.status);
  }
  return body as T;
}

export const login = (email: string, password: string) =>
  request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () => request<{ ok: true }>("/auth/logout", { method: "POST" });

export const me = () => request<User>("/auth/me");

export const fetchReports = () => request<Report[]>("/reports");

export const createReport = (name: string, description: string) =>
  request<Report>("/reports", { method: "POST", body: JSON.stringify({ name, description }) });

export const updateReport = (id: number, name: string, description: string) =>
  request<Report>(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, description }),
  });

export const updateStatus = (id: number, status: Status) =>
  request<Report>(`/reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const fetchUsers = () => request<User[]>("/users");

export const createUser = (name: string, email: string, password: string, role: Role) =>
  request<User>("/users", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });

export const deleteUser = (id: number) =>
  request<{ deletedReports: number }>(`/users/${id}`, { method: "DELETE" });
