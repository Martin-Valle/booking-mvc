import { auth } from "../services/auth.service";
import { router } from "../core/router";
import { getMyOrders } from "../services/orders.service";
import { ProfileView } from "../views/ProfileView";
import type { Order } from "../models/types";

export async function ProfileController() {
  const mount = document.getElementById("view")!;
  const user = auth.user();

  if (!user) { router.navigate("/login"); return; }
  if ((user as any).role === "admin") { router.navigate("/admin"); return; }

  mount.innerHTML = `<div class="container py-5 text-center text-muted">Cargando...</div>`;

  let orders: Order[] = [];
  try { orders = await getMyOrders(); } catch { orders = []; }

  mount.innerHTML = "";
  mount.appendChild(ProfileView(user, orders));
}
