export type Status = "pending" | "approved" | "rejected";

export interface Report {
  id: number;
  name: string;
  description: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/reports";

export async function fetchReports(): Promise<Report[]> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function createReport(name: string, description: string): Promise<Report> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error("Failed to create report");
  return res.json();
}

export async function updateStatus(id: number, status: Status): Promise<Report> {
  const res = await fetch(`${API}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}
