import { clearCookieHeader } from "../../server/auth";
export default async () =>
  new Response(JSON.stringify({ ok: true }), { headers: { "Set-Cookie": clearCookieHeader(), "Content-Type": "application/json" }});
