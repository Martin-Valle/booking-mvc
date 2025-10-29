import { one, exec } from "../../server/pg";
import bcrypt from "bcryptjs";
import { signSession, setCookieHeader } from "../../server/auth";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

  const { name, lastname, email, password, phone } = await req.json();
  if (!name || !email || !password) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

  const exists = await one<{ id: string }>(
    `SELECT "idUsuario" AS id FROM usuario WHERE lower(email)=lower($1)`, [email]
  );
  if (exists) return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });

  const passHash = await bcrypt.hash(password, 10);
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const role = admins.includes(String(email).toLowerCase()) ? "admin" : "user";

  const created = await one<{ id: string; nombre: string; apellido: string; email: string; role: "user"|"admin" }>(
    `INSERT INTO usuario ("nombre","apellido","email","telefono","activo","passHash","role")
     VALUES ($1,$2,$3,$4,true,$5,$6)
     RETURNING "idUsuario" AS id, "nombre", "apellido", email, "role"`,
    [name, lastname ?? "", email, phone ?? null, passHash, role]
  );

  const token = signSession({ sub: created!.id, email: created!.email, role: role as any, name: `${created!.nombre}` });
  return new Response(JSON.stringify({
    user: { id: created!.id, name: `${created!.nombre} ${created!.apellido??""}`.trim(), email: created!.email, role }
  }), {
    status: 201,
    headers: { "Set-Cookie": setCookieHeader(token), "Content-Type": "application/json" }
  });
};
