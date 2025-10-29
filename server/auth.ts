import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const SESSION_COOKIE = "ub_session";

export function signSession(payload: { sub: string; email: string; role: "user"|"admin"; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyFromRequest(req: Request):
  null | { sub: string; email: string; role: "user"|"admin"; name: string } {
  const cookie = req.headers.get("cookie") || "";
  const cookies = parse(cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export function setCookieHeader(token: string) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7*24*60*60}`;
}
export function clearCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
