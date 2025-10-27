import type { CartItem } from "../models/types";
import { fmtUSD } from "../core/money";

/**
 * Vista del carrito.
 * @param items Items actuales del carrito.
 * @param onChange (opcional) callback cuando cambian cantidades o se elimina un item.
 * @param opts (opcional) { isLoggedIn?: ()=>boolean, onCheckout?: (items)=>void }
 */
export function CartView(
  items: CartItem[],
  onChange?: (items: CartItem[]) => void,
  opts?: { isLoggedIn?: () => boolean; onCheckout?: (items: CartItem[]) => void }
) {
  const el = document.createElement("section");
  el.className = "container py-4";

  // ---- helpers ----
  const isLoggedIn =
    opts?.isLoggedIn ??
    (() =>
      !!localStorage.getItem("user") ||
      !!localStorage.getItem("token") ||
      !!sessionStorage.getItem("user"));

  const computeTotals = () => {
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const iva = subtotal * 0.15;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const renderSummary = () => {
    const { subtotal, iva, total } = computeTotals();
    (el.querySelector("#subtotal") as HTMLElement).textContent = fmtUSD(subtotal);
    (el.querySelector("#iva") as HTMLElement).textContent = fmtUSD(iva);
    (el.querySelector("#total") as HTMLElement).textContent = fmtUSD(total);

    const payBtn = el.querySelector("#pay-btn") as HTMLButtonElement | null;
    if (payBtn) payBtn.disabled = items.length === 0;
  };

  const renderList = () => {
    const list = el.querySelector("#list") as HTMLElement;
    list.innerHTML = "";

    if (items.length === 0) {
      list.innerHTML = `<li class="list-group-item text-center text-muted py-4">Tu carrito está vacío</li>`;
      renderSummary();
      return;
    }

    items.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex align-items-center";
      li.innerHTML = `
        <img src="${it.photo || "/assets/placeholder.jpg"}"
             class="me-3 rounded" style="width:72px;height:72px;object-fit:cover" />
        <div class="flex-grow-1">
          <div class="fw-semibold">${it.title}</div>
          <small class="text-muted">${it.subtitle || it.kind.toUpperCase()}</small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" data-act="dec" data-i="${idx}">-</button>
          <span>${it.qty}</span>
          <button class="btn btn-sm btn-outline-secondary" data-act="inc" data-i="${idx}">+</button>
          <span class="ms-3 fw-bold">${fmtUSD(it.price * it.qty)}</span>
          <button class="btn btn-sm btn-outline-danger ms-2" data-act="del" data-i="${idx}">×</button>
        </div>`;
      list.appendChild(li);
    });

    renderSummary();
  };

  // ---- layout base ----
  el.innerHTML = `
    <h2 class="mb-3">Carrito</h2>
    <div class="row">
      <div class="col-lg-8">
        <ul class="list-group mb-3" id="list"></ul>
      </div>
      <div class="col-lg-4">
        <div class="card p-3 summary-box">
          <h5 class="mb-2">Resumen de compra</h5>
          <div id="login-alert" class="alert alert-warning d-none alert-dismissible fade show mt-1" role="alert">
            Debes iniciar sesión para continuar con el pago.
            <a href="#/profile" class="alert-link">Iniciar sesión</a>
            <button type="button" class="btn-close" aria-label="Close"
              onclick="(this.parentElement as HTMLElement).classList.add('d-none')"></button>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <span>Subtotal</span>
            <strong id="subtotal">$0.00</strong>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <span>IVA (15%)</span>
            <strong id="iva">$0.00</strong>
          </div>
          <hr>
          <div class="d-flex justify-content-between">
            <span>Total</span>
            <strong class="fs-5 text-primary" id="total">$0.00</strong>
          </div>
          <button id="pay-btn" class="btn btn-primary w-100 mt-3">Continuar al pago</button>
        </div>
      </div>
    </div>`;

  // Primera pintura
  renderList();

  // ---- eventos carrito (+ / – / eliminar) ----
  el.addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>("[data-act]");
    if (!btn) return;

    const act = btn.dataset.act!;
    const i = Number(btn.dataset.i);
    if (Number.isNaN(i) || i < 0 || i >= items.length) return;

    const it = items[i];

    if (act === "inc") {
      it.qty += 1;
    } else if (act === "dec") {
      it.qty = Math.max(0, it.qty - 1);
      if (it.qty === 0) items.splice(i, 1);
    } else if (act === "del") {
      items.splice(i, 1);
    }

    renderList();
    onChange?.(items);
  });

  // ---- botón Continuar al pago ----
  (el.querySelector("#pay-btn") as HTMLButtonElement).addEventListener("click", (e) => {
    e.preventDefault();
    const alertBox = el.querySelector("#login-alert") as HTMLElement;

    if (!isLoggedIn()) {
      alertBox.classList.remove("d-none");
      alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Si está logueado, dispara callback opcional (o aquí navega a tu checkout)
    opts?.onCheckout?.(items);
  });

  return el;
}
