import { one } from "../../server/pg";
import bcrypt from "bcryptjs";
import { signSession, setCookieHeader } from "../../server/auth";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

  const { email, password } = await req.json();
  if (!email || !password) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

  const u = await one<{ id: string; nombre: string; apellido: string; email: string; role: "user"|"admin"; passhash: string; activo: boolean }>(
    `SELECT "idUsuario" AS id, "nombre", "apellido", email, "role", "passHash" AS passhash, "activo"
       FROM usuario WHERE lower(email)=lower($1)`, [email]
  );
  if (!u || !u.activo) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

  const ok = await bcrypt.compare(password, u.passhash || "");
  if (!ok) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

  const token = signSession({ sub: u.id, email: u.email, role: u.role, name: u.nombre });
  return new Response(JSON.stringify({
    user: { id: u.id, name: `${u.nombre} ${u.apellido??""}`.trim(), email: u.email, role: u.role }
  }), { headers: { "Set-Cookie": setCookieHeader(token), "Content-Type": "application/json" } });
};
