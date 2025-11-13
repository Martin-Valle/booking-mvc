type Route = { path: string; action: () => void };

export class Router {
  private routes: Route[] = [];

  constructor() {
    console.log('[Router] Constructor called, attaching event listeners');
    window.addEventListener("hashchange", () => {
      console.log('[Router] hashchange event fired');
      this.resolve();
    });
    window.addEventListener("load", () => {
      console.log('[Router] load event fired');
      this.resolve();
    });
  }

  register(path: string, action: () => void) {
    this.routes.push({ path, action });
  }

  /**
   * Navega asegurando el prefijo "/"
   * Ej: navigate("login") -> "#/login"
   */
  navigate(path: string) {
    const clean = path.startsWith("/") ? path : "/" + path;
    location.hash = clean;
  }

  private resolve() {
    // Normaliza: "#/ruta?x=1" -> "/ruta"
    const raw = (location.hash || "#/").replace(/^#/, "");
    const path = raw.split("?")[0] || "/";

    const hit =
      this.routes.find((r) => r.path === path) ??
      this.routes.find((r) => r.path === "*");

    if (hit) hit.action();
  }
}

// ✅ singleton para usar: import { router } from "../core/router";
export const router = new Router();
