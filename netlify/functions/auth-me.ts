import { one } from "../../server/pg";
import { verifyFromRequest } from "../../server/auth";

export default async (req: Request) => {
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });

  const claims = verifyFromRequest(req);
  if (!claims) return new Response(JSON.stringify({ user: null }), { headers: { "Content-Type": "application/json" } });

  const u = await one<{ id: string; nombre: string; apellido: string; email: string; role: "user"|"admin" }>(
    `SELECT "idUsuario" AS id, "nombre", "apellido", email, "role" FROM usuario WHERE "idUsuario"=$1`, [claims.sub]
  );
  if (!u) return new Response(JSON.stringify({ user: null }), { headers: { "Content-Type": "application/json" } });

  return new Response(JSON.stringify({
    user: { id: u.id, name: `${u.nombre} ${u.apellido??""}`.trim(), email: u.email, role: u.role }
  }), { headers: { "Content-Type": "application/json" } });
};
