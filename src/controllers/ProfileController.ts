// src/controllers/ProfileController.ts
import { authMe, myOrders, adminUsers, adminOrdersByUser, logout as _logout } from "../services/auth.service";
import type { Order } from "../models/types";
import { router } from "../core/router";
const logout = _logout;
// formatea dinero con fallback de moneda
function fmtMoney(n: number, c?: string) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: c || "USD",
  }).format(Number.isFinite(n) ? n : 0);
}

function renderOrdersTable(list: Order[] = []) {
  if (!list || list.length === 0) {
    return `<div class="text-muted">Aún no se han realizado compras.</div>`;
  }

  return `
  <div class="table-responsive">
    <table class="table align-middle">
      <thead>
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map((o, i) => {
            const id = (o as any).id || (o as any).idReserva || `#${i + 1}`;
            const fechaRaw = (o as any).date || (o as any).fecha || (o as any).fechaReserva;
            const fecha = fechaRaw ? new Date(fechaRaw) : null;
            const estado = (o as any).status || (o as any).estado || "";
            const total = (o as any).total || (o as any).totalPrice || 0;
            const currency = (o as any).currency || "USD";

            return `
              <tr>
                <td>${id}</td>
                <td>${fecha ? fecha.toLocaleString() : "-"}</td>
                <td>${estado}</td>
                <td>${fmtMoney(Number(total), currency)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  </div>`;
}

export async function ProfileController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML =
    `<div class="container py-4"><div class="text-muted">Cargando perfil…</div></div>`;

  // 1) Ver sesión
  const me = await authMe();

  if (!me) {
    mount.innerHTML = `
      <div class="container py-5">
        <h3>Perfil</h3>
        <p>Inicia sesión para ver tu historial de compras.</p>
        <a class="btn btn-primary" href="#/login">Iniciar sesión</a>
        <a class="btn btn-outline-secondary ms-2" href="#/register">Crear cuenta</a>
      </div>`;
    return;
  }

  // 2) Actualiza el link del topbar "Perfil" con el nombre
  const link = document.querySelector('a[href="#/profile"]');
  if (link) (link as HTMLAnchorElement).textContent = me.name || me.nombre || "Perfil";

  // 3) Render por rol
  if (me.role === "user") {
    const orders = await myOrders();

    mount.innerHTML = `
      <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">Hola, ${me.name || me.nombre || me.email}</h3>
          <button id="btnLogout" class="btn btn-outline-danger btn-sm">Cerrar sesión</button>
        </div>

        <h5 class="mb-3">Mi historial de compras</h5>
        ${renderOrdersTable(orders)}
      </div>`;

    mount.querySelector<HTMLButtonElement>("#btnLogout")?.addEventListener("click", async () => {
      await logout();
      const l = document.querySelector('a[href="#/profile"]');
      if (l) (l as HTMLAnchorElement).textContent = "Perfil";
      router.navigate("/login");
    });

    return;
  }

  // Admin
  if (me.role === "admin") {
    const users = await adminUsers();

    mount.innerHTML = `
      <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">Admin</h3>
          <button id="btnLogout" class="btn btn-outline-danger btn-sm">Cerrar sesión</button>
        </div>

        <div class="row">
          <aside class="col-12 col-md-4 mb-3">
            <div class="card">
              <div class="card-header">Usuarios</div>
              <ul class="list-group list-group-flush" id="usersList">
                ${users
                  .map((u: any) => {
                    const uid = u.id || u.idUsuario || u.userId || "";
                    const name = u.name || (u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : (u.nombre || u.fullName || u.email));
                    const email = u.email || u.correo || "";
                    return `<li class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <div class="fw-semibold">${name || email}</div>
                        <div class="small text-muted">${email}</div>
                      </div>
                      <button class="btn btn-sm btn-primary" data-userid="${uid}">Ver órdenes</button>
                    </li>`;
                  })
                  .join("")}
              </ul>
            </div>
          </aside>

          <main class="col-12 col-md-8">
            <div class="card">
              <div class="card-header">Órdenes del usuario</div>
              <div class="card-body" id="ordersDetail">
                <div class="text-muted">Selecciona un usuario para ver sus órdenes.</div>
              </div>
            </div>
          </main>
        </div>
      </div>`;

    mount.querySelector<HTMLButtonElement>("#btnLogout")?.addEventListener("click", async () => {
      await logout();
      const l = document.querySelector('a[href="#/profile"]');
      if (l) (l as HTMLAnchorElement).textContent = "Perfil";
      router.navigate("/login");
    });

    // Delegación: click en "Ver órdenes"
    mount.querySelector("#usersList")?.addEventListener("click", async (ev) => {
      const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("button[data-userid]");
      if (!btn) return;

      const userId = btn.getAttribute("data-userid")!;
      const detail = mount.querySelector<HTMLDivElement>("#ordersDetail")!;
      detail.innerHTML = `<div class="text-muted">Cargando órdenes…</div>`;

      try {
        const list = await adminOrdersByUser(userId);
        detail.innerHTML = renderOrdersTable(list as any);
      } catch (e: any) {
        detail.innerHTML = `<div class="alert alert-danger">${e?.message || "No se pudieron cargar las órdenes."}</div>`;
      }
    });

    return;
  }

  // Rol desconocido
  mount.innerHTML = `
    <div class="container py-4">
      <div class="alert alert-warning">Tu rol no tiene una vista asignada.</div>
    </div>`;
}
