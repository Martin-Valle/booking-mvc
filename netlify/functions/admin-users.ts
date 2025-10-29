import { many } from "../../server/pg";
import { verifyFromRequest } from "../../server/auth";

export default async (req: Request) => {
  const claims = verifyFromRequest(req);
  if (!claims || claims.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  const users = await many<any>(
    `SELECT u."idUsuario" AS id,
            (u."nombre"||' '||COALESCE(u."apellido",'')) AS name,
            u.email, u."role", u."fechaRegistro",
            COALESCE(COUNT(r."idReserva"),0) AS orders
       FROM usuario u
  LEFT JOIN reserva r ON r."idUsuario"=u."idUsuario"
   GROUP BY u."idUsuario"
   ORDER BY u."fechaRegistro" DESC`
  );

  return new Response(JSON.stringify({ users }), { headers: { "Content-Type": "application/json" } });
};
