// src/controllers/CartController.ts
import { getCart, inc, dec, del } from "../services/cart.service";
import { auth, authMe } from "../services/auth.service";
import { router } from "../core/router";

function esc(s?: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function CartController() {
  const mount = document.getElementById("view");
  if (!mount) return;

  const isLogged = () => !!auth.user() || !!localStorage.getItem("token");

  function render() {
    const items = getCart();
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const iva = subtotal * 0.15;
    const total = subtotal + iva;
    const logged = isLogged();

    mount.innerHTML = `
      <div class="container py-4">
        <h2 class="mb-4">Carrito</h2>

        <div class="row g-4">
          <div class="col-lg-8">
            ${
              items.length === 0
                ? `<div class="text-muted">Tu carrito está vacío.</div>`
                : items
                    .map(
                      (i) => `
              <div class="card mb-3" data-item="${esc(i.id)}">
                <div class="card-body d-flex align-items-center gap-3 flex-wrap">
                  <img src="${esc(i.photo) || "/assets/hero.jpg"}" alt="" width="72" height="72" class="rounded" />
                  <div class="flex-fill">
                    <div class="fw-semibold">${esc(i.title)}</div>
                    ${
                      i.subtitle
                        ? `<div class="text-muted small">${esc(i.subtitle)}</div>`
                        : ""
                    }
                  </div>

                  <div class="d-flex align-items-center">
                    <button class="btn btn-outline-secondary btn-sm" data-dec="${esc(
                      i.id
                    )}" aria-label="Disminuir">−</button>
                    <span class="px-3">${i.qty}</span>
                    <button class="btn btn-outline-secondary btn-sm" data-inc="${esc(
                      i.id
                    )}" aria-label="Aumentar">+</button>
                  </div>

                  <div class="ms-3">$${(i.price * i.qty).toFixed(2)}</div>
                  <button class="btn btn-outline-danger btn-sm ms-2" data-del="${esc(
                    i.id
                  )}" aria-label="Eliminar">&times;</button>
                </div>
              </div>`
                    )
                    .join("")
            }
          </div>

          <div class="col-lg-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Resumen de compra</h5>

                ${
                  logged
                    ? ""
                    : `
                <div class="alert alert-warning mb-3" data-auth-banner>
                  Debes iniciar sesión para continuar con el pago.
                  <a href="#/login" class="alert-link">Iniciar sesión</a>
                </div>`
                }

                <div class="d-flex justify-content-between">
                  <span>Subtotal</span><span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>IVA (15%)</span><span>$${iva.toFixed(2)}</span>
                </div>
                <hr class="my-2" />
                <div class="d-flex justify-content-between fw-semibold">
                  <span>Total</span><span>$${total.toFixed(2)}</span>
                </div>

                <button class="btn btn-primary w-100 mt-3" data-checkout-btn
                  ${!logged || items.length === 0 ? "disabled" : ""}>
                  Continuar al pago
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- inicialización ---
  await authMe();   // hidrata usuario (mock: sessionStorage)
  render();         // pinta la primera vez
  auth.onChange(render); // re-render ante login/logout

  // --- delegación de eventos ---
  mount.addEventListener("click", (ev) => {
    const el = ev.target as HTMLElement | null;
    if (!el) return;

    // Checkout: si no hay sesión, redirige a login
    const checkoutBtn =
      (el.closest?.("[data-checkout-btn]") as HTMLButtonElement | null) ?? null;
    if (checkoutBtn) {
      if (!isLogged()) {
        ev.preventDefault();
        router.navigate("/login");
        return;
      }
      // Si tienes ruta de checkout, navega:
      // router.navigate("/checkout");
      return;
    }

    // +1
    if (el.matches("[data-inc]")) {
      const id = el.getAttribute("data-inc");
      if (id) inc(id);
      render();
      return;
    }

    // -1
    if (el.matches("[data-dec]")) {
      const id = el.getAttribute("data-dec");
      if (id) dec(id);
      render();
      return;
    }

    // eliminar
    if (el.matches("[data-del]")) {
      const id = el.getAttribute("data-del");
      if (id) del(id);
      render();
      return;
    }
  });
}
