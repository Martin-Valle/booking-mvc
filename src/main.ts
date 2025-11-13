// src/main.ts

// Vendor
import "flatpickr/dist/flatpickr.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Estilos (Bootstrap con overrides)
import "./styles/custom.scss";

// Inyecta assets del tema (imágenes héroe) via variables CSS
import { initThemeAssets } from "./core/theme";

import { router } from "./core/router";
import { auth } from "./services/auth.service";

import { mountHeader } from "./components/Header";
import { mountFooter } from "./components/Footer";
import { mountFloatingCart } from "./components/FloatingCart";

import { HomeController } from "./controllers/HomeController";
import { ResultsController } from "./controllers/ResultsController";
import { CartController } from "./controllers/CartController";
import { ProfileController } from "./controllers/ProfileController";
import { HotelDetailController } from "./controllers/HotelDetailController";
import { CarDetailController } from "./controllers/CarDetailController";
import { FlightDetailController } from "./controllers/FlightDetailController";
import { RestaurantController } from "./controllers/RestaurantController";
import { LoginController } from "./controllers/LoginController";
import { AdminConfigController } from "./controllers/AdminConfigController";
import { RegisterController } from "./controllers/RegisterController";

// ---------- Setup tema ----------
initThemeAssets();

// ---------- Shell ----------
function mountShell() {
  console.log('[main.ts] mountShell called');
  mountHeader();
  mountFooter();
  mountFloatingCart();
}
mountShell();

// ---------- Helpers de auth/rol ----------
const isAdmin = () => (auth.user() as any)?.role === "admin";

const guardCustomerOnly = (controller: () => void) => () => {
  if (isAdmin()) { router.navigate("/admin"); return; }
  controller();
};

const guardAuthOnly = (controller: () => void) => () => {
  if (!auth.user()) { router.navigate("/login"); return; }
  controller();
};

// Redirigir al admin apenas entre o inicie sesión
function redirectAdminIfNeeded() {
  const path = location.hash.replace(/^#/, "");
  if (isAdmin() && path !== "/admin") {
    router.navigate("/admin");
  }
}

/* ---------- Rutas ---------- */
// Públicas (pero ocultas para admin)
router.register("/",              guardCustomerOnly(HomeController));
router.register("/results",       guardCustomerOnly(ResultsController));
router.register("/cart",          guardCustomerOnly(CartController));
router.register("/hotel",         guardCustomerOnly(HotelDetailController));
router.register("/car",           guardCustomerOnly(CarDetailController));
router.register("/flight",        guardCustomerOnly(FlightDetailController));
router.register("/restaurant",    guardCustomerOnly(RestaurantController));
router.register("/register",      guardCustomerOnly(RegisterController));

// Auth
router.register("/login", LoginController);

// Perfil: requiere sesión (y no es admin)
router.register("/profile", () => {
  if (!auth.user()) { router.navigate("/login"); return; }
  if (isAdmin())    { router.navigate("/admin"); return; }
  ProfileController();
});

// Admin: requiere sesión + rol admin
router.register("/admin", () => {
  if (!auth.user())    { router.navigate("/login"); return; }
  if (!isAdmin())      { router.navigate("/"); return; }
  AdminConfigController();
});

// 404
router.register("*", () => {
  const mount = document.getElementById("view")!;
  mount.innerHTML = `<div class="container py-5">404</div>`;
});

/* ---------- Arranque de auth y eventos ---------- */
auth.bootstrap();
redirectAdminIfNeeded();                  // redirige admin al cargar

window.addEventListener("auth:login", redirectAdminIfNeeded);
window.addEventListener("auth:changed", redirectAdminIfNeeded);
window.addEventListener("auth:unauthorized", () => router.navigate("/login"));
