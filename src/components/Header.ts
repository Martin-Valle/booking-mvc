import { router } from "../core/router";
import { auth } from "../services/auth.service";

/* ---------- Helpers carrito ---------- */
function getCartCount(): number {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(cart)
      ? cart.reduce((s: number, it: any) => s + (Number(it?.qty) || 0), 0)
      : 0;
  } catch {
    return 0;
  }
}
function updateCartBadge() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const n = getCartCount();
  el.textContent = String(n);
  el.classList.toggle("d-none", n === 0);
}

/* Enfocar el input de búsqueda del héroe al ir al Home */
function focusHeroSearch() {
  // intenta varios selectores comunes
  const input =
    (document.querySelector<HTMLInputElement>("#q") ||
      document.querySelector<HTMLInputElement>("#search") ||
      document.querySelector<HTMLInputElement>('input[name="q"]')) ?? null;

  if (input) {
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* ---------- Render del bloque derecho ---------- */
function renderRightNav(ul: HTMLUListElement) {
  ul.innerHTML = ""; // limpia

  const u = auth.user();

  // --- SI ES ADMIN: solo Admin + Cerrar sesión ---
  if (u && (u as any).role === "admin") {
    const liAdmin = document.createElement("li");
    liAdmin.className = "nav-item";
    liAdmin.innerHTML = `<a class="nav-link" href="#/admin" id="admin-link">Admin</a>`;
    ul.appendChild(liAdmin);

    const liLogout = document.createElement("li");
    liLogout.className = "nav-item";
    liLogout.innerHTML = `<a class="nav-link" href="#" id="logout-link">Cerrar sesión</a>`;
    ul.appendChild(liLogout);

    // eventos
    ul.querySelector<HTMLAnchorElement>("#admin-link")!
      .addEventListener("click", (e) => { e.preventDefault(); router.navigate("/admin"); });
    ul.querySelector<HTMLAnchorElement>("#logout-link")!
      .addEventListener("click", async (e) => {
        e.preventDefault();
        try { await auth.logout(); } finally { router.navigate("/"); }
      });

    return; // no mostramos nada más al admin
  }

  // --- Usuarios (no logueado o normal) ---
  // Buscar (SIEMPRE navega al home y enfoca la búsqueda)
  const liSearch = document.createElement("li");
  liSearch.className = "nav-item";
  liSearch.innerHTML = `<a class="nav-link" href="#/" id="nav-search">Buscar</a>`;
  ul.appendChild(liSearch);

  // Carrito
  const liCart = document.createElement("li");
  liCart.className = "nav-item";
  liCart.innerHTML = `
    <a class="nav-link position-relative" href="#/cart">
      Carrito
      <span id="cart-count" class="badge text-bg-warning align-text-top ms-1 d-none">0</span>
    </a>`;
  ul.appendChild(liCart);

  // No logueado -> “Iniciar sesión”
  if (!u) {
    const liLogin = document.createElement("li");
    liLogin.className = "nav-item";
    liLogin.innerHTML = `<a class="nav-link" href="#/login">Iniciar sesión</a>`;
    ul.appendChild(liLogin);
    updateCartBadge();

    // click en Buscar
    ul.querySelector<HTMLAnchorElement>("#nav-search")!
      .addEventListener("click", (e) => { e.preventDefault(); router.navigate("/"); setTimeout(focusHeroSearch); });
    return;
  }

  // Usuario normal: nombre (perfil) + cerrar sesión
  const first = String(
    (u as any).nombre || (u as any).name || (u as any).fullName || (u as any).email || "Usuario"
  ).split(" ")[0];

  const liUser = document.createElement("li");
  liUser.className = "nav-item";
  liUser.innerHTML = `<a class="nav-link" href="#/profile" id="user-link">${first}</a>`;
  ul.appendChild(liUser);

  const liLogout = document.createElement("li");
  liLogout.className = "nav-item";
  liLogout.innerHTML = `<a class="nav-link" href="#" id="logout-link">Cerrar sesión</a>`;
  ul.appendChild(liLogout);

  // eventos
  ul.querySelector<HTMLAnchorElement>("#user-link")!
    .addEventListener("click", (e) => { e.preventDefault(); router.navigate("/profile"); });

  ul.querySelector<HTMLAnchorElement>("#logout-link")!
    .addEventListener("click", async (e) => {
      e.preventDefault();
      try { await auth.logout(); } finally { router.navigate("/"); }
    });

  ul.querySelector<HTMLAnchorElement>("#nav-search")!
    .addEventListener("click", (e) => { e.preventDefault(); router.navigate("/"); setTimeout(focusHeroSearch); });

  updateCartBadge();
}

/* ---------- Montaje ---------- */
export function mountHeader() {
  // crea <header> si no existe
  let header = document.getElementById("header") as HTMLElement | null;
  if (!header) {
    header = document.createElement("header");
    header.id = "header";
    const app = document.getElementById("app");
    (app ?? document.body).prepend(header);
  }

  header.innerHTML = `
  <nav class="navbar navbar-expand-lg bg-primary navbar-dark">
    <div class="container">
      <a class="navbar-brand fw-bold" href="#/" id="brand">UniBooking</a>
      <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav">
        <ul class="navbar-nav ms-auto align-items-lg-center" id="nav-right"></ul>
      </div>
    </div>
  </nav>`;

  const right = header.querySelector<HTMLUListElement>("#nav-right")!;
  const rerender = () => renderRightNav(right);

  // Render inicial
  rerender();

  // Badge carrito reactivo
  window.addEventListener("cart:updated", updateCartBadge);
  window.addEventListener("storage", (e) => { if (e.key === "cart") updateCartBadge(); });

  // Cambios de auth (soporte servicios con/sin onChange)
  try { (auth as any).onChange?.(rerender); } catch { /* opcional */ }
  window.addEventListener("auth:changed", rerender);
  window.addEventListener("auth:login", rerender);
  window.addEventListener("auth:logout", rerender);

  // Brand con router
  header.querySelector<HTMLAnchorElement>("#brand")!
    .addEventListener("click", (ev) => { ev.preventDefault(); router.navigate("/"); setTimeout(focusHeroSearch); });
}
