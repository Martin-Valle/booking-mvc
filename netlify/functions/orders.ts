import { many, one, exec } from "../../server/pg";
import { verifyFromRequest } from "../../server/auth";

export default async (req: Request) => {
  const claims = verifyFromRequest(req);
  if (!claims) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });

  const url = new URL(req.url);

  if (req.method === "GET") {
    // admin puede pasar ?userId=...
    const userId = (claims.role === "admin" && url.searchParams.get("userId")) || claims.sub;
    const rows = await many<any>(
      `SELECT r."idReserva" AS id,
              r."fechaReserva",
              r."totalPrice" AS total,
              json_agg(json_build_object(
                'kind', d."tipoServicio",
                'name', s."nombre",
                'price', d."subtotal"
              ) ORDER BY d."idDetalle") AS items
         FROM reserva r
         JOIN detalle_reserva d ON d."idReserva"=r."idReserva"
         JOIN servicio s ON s."idServicio"=d."idServicio"
        WHERE r."idUsuario"=$1
        GROUP BY r."idReserva"
        ORDER BY r."fechaReserva" DESC`, [userId]
    );
    return new Response(JSON.stringify({ orders: rows }), { headers: { "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    // Espera: { items: [{ idServicio, tipoServicio, cantidad, precioUnitario, subtotal, fechaInicio?, fechaFin? }, ...], total }
    const body = await req.json();
    const items = body?.items;
    const total = Number(body?.total ?? 0);
    if (!Array.isArray(items) || !items.length || !total)
      return new Response(JSON.stringify({ error: "Malformed payload" }), { status: 400 });

    const r = await one<{ id: string }>(
      `INSERT INTO reserva ("idUsuario","estado","totalPrice","currency")
       VALUES ($1,'COMPLETADA',$2,'USD') RETURNING "idReserva" AS id`, [claims.sub, total]
    );

    for (const it of items) {
      await exec(
        `INSERT INTO detalle_reserva ("idReserva","tipoServicio","idServicio","cantidad","precioUnitario","subtotal","fechaInicio","fechaFin")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [r!.id, it.tipoServicio, it.idServicio, it.cantidad ?? 1, it.precioUnitario, it.subtotal, it.fechaInicio ?? null, it.fechaFin ?? null]
      );
    }
    const created = await one(
      `SELECT "idReserva" AS id, "fechaReserva", "totalPrice" AS total FROM reserva WHERE "idReserva"=$1`, [r!.id]
    );
    return new Response(JSON.stringify({ order: created }), { status: 201, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
