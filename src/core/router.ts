import { LoginController } from "../controllers/LoginController";
import { RegisterController } from "../controllers/RegisterController";
import { ProfileController } from "../controllers/ProfileController";

type Route = { path: string; action: () => void | Promise<void> };

export class Router {
  private routes: Route[] = [];

  constructor() {
    window.addEventListener("hashchange", () => this.resolve());
    window.addEventListener("load", () => this.resolve());
  }

  /** Registra una ruta. Acepta controladores sync o async. */
  register(path: string, action: () => void | Promise<void>) {
    const p = path.startsWith("/") ? path : "/" + path;
    this.routes.push({ path: p, action });
  }

  /** Alias para compatibilidad: router.add(...) */
  add(path: string, action: () => void | Promise<void>) {
    this.register(path, action);
  }

  /** Navega asegurando el prefijo "/" y fuerza render si es la misma ruta. */
  navigate(path: string) {
    const clean = path.startsWith("/") ? path : "/" + path;
    const target = `#${clean}`;
    if (location.hash !== target) location.hash = clean;
    else this.resolve();
  }

  /** Resuelve la ruta actual del hash. */
  resolve() {
    // "#/ruta?x=1" -> "/ruta"
    const raw = (location.hash || "#/").slice(1);
    const path = decodeURIComponent(raw.split("?")[0] || "/");

    const hit =
      this.routes.find((r) => r.path === path) ??
      this.routes.find((r) => r.path === "*");

    if (hit) {
      try {
        const out = hit.action();
        if (out && typeof (out as any).then === "function") {
          (out as Promise<void>).catch((err) =>
            console.error("[Router] Route action error:", err)
          );
        }
      } catch (err) {
        console.error("[Router] Route action error:", err);
      }
    } else {
      console.warn("[Router] No route matched for", path);
    }
  }
}

// ✅ singleton para usar en toda la app
export const router = new Router();

/* ========= Rutas de autenticación ========= */
router.add("/login", LoginController);
router.add("/register", RegisterController);
router.add("/profile", ProfileController); // mostrará nombre / admin panel según rol
