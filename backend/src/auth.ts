import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

const scrypt = promisify(scryptCb);

export type Role = "admin" | "reporter" | "approver";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const COOKIE_NAME = "token";
export const SESSION_MS = 8 * 60 * 60 * 1000; // 8 jam

const secret = process.env.JWT_SECRET ?? "";
if (!secret) {
  throw new Error("JWT_SECRET wajib diisi di .env (lihat .env.example)");
}

// Password disimpan sebagai "salt:hash" memakai scrypt bawaan Node (tanpa dependency tambahan).
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = (await scrypt(password, salt, 64)) as Buffer;
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const signToken = (userId: number) => jwt.sign({ sub: userId }, secret, { expiresIn: "8h" });

export function readToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || payload === null) return null;
    return typeof payload.sub === "number" ? payload.sub : null;
  } catch {
    return null; // kedaluwarsa atau tanda tangan tidak cocok
  }
}
