// src/views/ProfileView.ts
import type { User, Order } from "../models/types";
import { fmtUSD } from "../core/money";

function fmtDate(iso: string | number | Date): string {
  const d = new Date(iso);
  const dd = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const t  = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dd} · ${t}`;
}

export function ProfileView(user: User, orders: Order[]) {
  const el = document.createElement("section");
  el.className = "container py-4";

  const first = String(
    (user as any).nombre || (user as any).name || user.fullName || user.email || "Usuario"
  ).split(" ")[0];

  el.innerHTML = `
    <h2 class="mb-4">Hola, ${first}</h2>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="mb-0">Mis compras</h5>
          <span class="text-muted small">${orders.length} ${orders.length === 1 ? "compra" : "compras"}</span>
        </div>
        <div id="orders"></div>
      </div>

      <div class="col-lg-4">
        <div class="card p-3">
          <h6 class="mb-2">Mi cuenta</h6>
          <div class="small text-muted">Nombre</div>
          <div class="mb-2">${user.fullName || (user as any).nombre || (user as any).name || "-"}</div>

          <div class="small text-muted">Correo</div>
          <div class="mb-2">${user.email ?? "-"}</div>
        </div>
      </div>
    </div>
  `;

  const $orders = el.querySelector<HTMLDivElement>("#orders")!;

  if (!orders.length) {
    $orders.innerHTML = `
      <div class="card p-4 text-center text-muted">Aún no has realizado compras.</div>
    `;
  } else {
    const frag = document.createDocumentFragment();

    orders.forEach((o, idx) => {
      const code   = (o as any).code || (o as any).id || `ORD-${idx + 1}`;
      const date   = (o as any).createdAt || Date.now();
      const status = String((o as any).status || "pagado").toLowerCase();
      const items  = (((o as any).items || []) as any[]);
      const subtotal = items.reduce((s, it: any) => s + (Number(it?.qty) || 0) * (Number(it?.price) || 0), 0);
      const iva     = Number((o as any).tax ?? (o as any).iva ?? 0);
      const total   = Number((o as any).total ?? subtotal + iva);

      const badge = status === "pagado" ? "success" : status === "pendiente" ? "warning" : "secondary";

      const card = document.createElement("div");
      card.className = "card mb-3";
      card.innerHTML = `
        <div class="card-body d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div>
            <div class="fw-semibold">Orden #${code}</div>
            <div class="text-muted small">${fmtDate(date)}</div>
          </div>

          <div class="ms-auto me-3">
            <span class="badge text-bg-${badge} text-capitalize">${status}</span>
          </div>

          <div class="fw-bold">${fmtUSD(total)}</div>

          <button class="btn btn-sm btn-outline-primary ms-auto" data-act="toggle" data-i="${idx}">
            Ver detalle
          </button>
        </div>

        <div class="border-top px-3 py-2 d-none" data-detail="${idx}">
          ${
            items.length
              ? items
                  .map(
                    (it: any) => `
            <div class="d-flex align-items-center justify-content-between py-1">
              <div class="text-truncate">
                <span class="badge text-bg-light me-2">${(it.kind || "").toString().toUpperCase()}</span>
                ${it.title || "-"}
                <span class="text-muted small">×${it.qty || 0}</span>
              </div>
              <div class="fw-semibold">${fmtUSD((Number(it.qty) || 0) * (Number(it.price) || 0))}</div>
            </div>`
                  )
                  .join("")
              : `<div class="text-muted py-2">Sin ítems</div>`
          }

          <hr class="my-2">
          <div class="d-flex justify-content-between small"><span>Subtotal</span><span>${fmtUSD(subtotal)}</span></div>
          <div class="d-flex justify-content-between small"><span>Impuestos</span><span>${fmtUSD(iva)}</span></div>
          <div class="d-flex justify-content-between fw-semibold"><span>Total</span><span>${fmtUSD(total)}</span></div>
        </div>
      `;
      frag.appendChild(card);
    });

    $orders.appendChild(frag);

    // Delegación: toggle detalle
    $orders.addEventListener("click", (ev) => {
      const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-act="toggle"]');
      if (!btn) return;
      const i = btn.getAttribute("data-i")!;
      const detail = $orders.querySelector<HTMLElement>(`[data-detail="${i}"]`);
      if (detail) detail.classList.toggle("d-none");
      btn.textContent = btn.textContent?.includes("Ver detalle") ? "Ocultar detalle" : "Ver detalle";
    });
  }

  return el;
}
