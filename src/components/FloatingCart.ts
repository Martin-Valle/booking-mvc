// src/components/FloatingCart.ts
import { fmtUSD } from "../core/money";
import { auth } from "../services/auth.service";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

function cartTotals() {
  const cart = getCart();
  const count = cart.reduce((s: number, it: any) => s + (Number(it?.qty) || 0), 0);
  const total = cart.reduce(
    (s: number, it: any) => s + (Number(it?.qty) || 0) * (Number(it?.price) || 0),
    0
  );
  return { count, total };
}

function onCartClick() {
  location.hash = "/cart";
}

export function mountFloatingCart() {
  // Reusar si ya existe (evita duplicados)
  let el = document.getElementById("floating-cart") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "floating-cart";
    el.className = "floating-cart shadow-lg";
    el.innerHTML = `
      <button class="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 w-100" id="fc-btn">
        <span class="badge text-bg-warning" id="fc-count">0</span>
        <span class="fw-semibold">Ver carrito</span>
        <span class="ms-auto" id="fc-total">$0</span>
      </button>`;
    document.body.appendChild(el);
    el.querySelector<HTMLButtonElement>("#fc-btn")!.addEventListener("click", onCartClick);
  }

  const $count = el.querySelector<HTMLElement>("#fc-count")!;
  const $total = el.querySelector<HTMLElement>("#fc-total")!;

  const render = () => {
    const { count, total } = cartTotals();

    const onCartPage = location.hash.replace("#", "") === "/cart";
    const u = auth.user() as any;
    const isAdmin = u?.role === "admin";

    // Mostrar solo si NO es admin, NO estamos en /cart y sí hay ítems
    const visible = !isAdmin && !onCartPage && count > 0;

    el!.classList.toggle("show", visible);
    $count.textContent = String(count);
    $total.textContent = fmtUSD(total);
  };

  // Vincular listeners solo una vez
  if (!(el as any)._bound) {
    window.addEventListener("cart:updated", render);
    window.addEventListener("hashchange", render);
    window.addEventListener("storage", (e) => {
      if (e.key === "cart") render();
    });
    window.addEventListener("auth:changed", render);
    window.addEventListener("auth:login", render);
    window.addEventListener("auth:logout", render);
    (el as any)._bound = true;
  }

  render();
}
