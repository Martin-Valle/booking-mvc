// src/controllers/AdminConfigController.ts
import { AdminConfigView } from "../views/AdminConfigView";
import { getConfig, saveConfig } from "../services/config.service";
import { adminGetUsers, adminGetUserOrders } from "../services/admin.service";
import { toast } from "../core/toast";
import { fmtUSD } from "../core/money";

export async function AdminConfigController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  try {
    // 1) Cargar configuración y montar vista
    const cfg = await getConfig();
    const view = AdminConfigView(cfg, async (newCfg) => {
      try {
        await saveConfig(newCfg);
        toast.success("Configuración guardada");
      } catch (e: any) {
        toast.error(e?.message || "No se pudo guardar");
      }
    });
    mount.appendChild(view);

    // 2) Pestaña Usuarios
    const $usersBox = view.querySelector<HTMLDivElement>("#users-box")!;
    let users: any[] = [];
    try {
      users = await adminGetUsers();
    } catch {
      // ignora y deja mensaje abajo
    }

    if (!users?.length) {
      $usersBox.innerHTML = `<div class="text-muted">No hay usuarios registrados.</div>`;
      return;
    }

    $usersBox.innerHTML = `
      <div class="list-group">
        ${users
          .map(
            (u, i) => `
          <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-i="${i}">
            <div>
              <div class="fw-semibold">${[u.nombre, u.apellido].filter(Boolean).join(" ") || u.fullName || u.email}</div>
              <div class="small text-muted">${u.email ?? ""}</div>
            </div>
            <span class="small text-primary">Ver historial ›</span>
          </a>`
          )
          .join("")}
      </div>
      <div id="user-orders" class="mt-3"></div>
    `;

    $usersBox.addEventListener("click", async (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("[data-i]");
      if (!a) return;
      e.preventDefault();

      const idx = Number(a.dataset.i);
      const u = users[idx];
      const $target = $usersBox.querySelector<HTMLDivElement>("#user-orders")!;
      $target.innerHTML = `Cargando compras de <strong>${u.nombre || u.fullName || u.email}</strong>…`;

      try {
        const orders = await adminGetUserOrders(u.id);
        if (!orders?.length) {
          $target.innerHTML = `<div class="card p-3 mt-2 text-muted">Sin compras.</div>`;
          return;
        }

        $target.innerHTML = `
          <div class="card p-3 mt-2">
            <h6 class="mb-3">Compras de ${u.nombre || u.fullName || u.email}</h6>
            <ul class="list-group">
              ${orders
                .map(
                  (o: any) => `
                <li class="list-group-item d-flex justify-content-between">
                  <div>
                    <div class="fw-semibold">${o.code ?? o.id}</div>
                    <small class="text-muted">${new Date(o.createdAt ?? o.fecha ?? Date.now()).toLocaleString()}</small>
                  </div>
                  <div class="fw-semibold">${fmtUSD(Number(o.total ?? 0))}</div>
                </li>`
                )
                .join("")}
            </ul>
          </div>`;
      } catch {
        $target.innerHTML = `<div class="alert alert-danger mt-2">No se pudo cargar las compras.</div>`;
      }
    });
  } catch (e: any) {
    mount.innerHTML = `<div class="alert alert-danger">No se pudo cargar la configuración.</div>`;
  }
}
