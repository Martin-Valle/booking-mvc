// src/controllers/RegisterController.ts
import { RegisterView } from "../views/RegisterView";
import { auth } from "../services/auth.service";
import { router } from "../core/router";

// pequeño helper por si la vista devuelve { el } o el nodo directo
function toEl(x: any): HTMLElement {
  if (x instanceof HTMLElement) return x;
  if (x?.el instanceof HTMLElement) return x.el as HTMLElement;
  const wrap = document.createElement("div");
  wrap.innerHTML = "";
  return wrap;
}

export async function RegisterController() {
  const mount = document.getElementById("view")!;

  // si ya hay sesión, redirige
  const already = auth.user() ?? (await auth.me());
  if (already) {
    router.navigate("/profile");
    return;
  }

  // La vista debe llamarnos con el payload del formulario
  const view: any = RegisterView(
    async (payload: {
      name?: string;
      nombre?: string;
      apellido?: string;
      email: string;
      telefono?: string;
      password: string;
    }) => {
      try {
        await auth.register(payload);

        // Actualiza el texto del menú "Perfil" con el nombre
        const u = auth.user();
        const link = document.querySelector('a[href="#/profile"]') as
          | HTMLElement
          | null;
        if (link && u) link.textContent = u.name || "Perfil";

        router.navigate("/profile");
      } catch (e: any) {
        const msg = e?.message ?? "No se pudo crear la cuenta.";
        if (typeof view?.setError === "function") view.setError(msg);
        else alert(msg);
      }
    }
  );

  mount.innerHTML = "";
  mount.appendChild(toEl(view));
}
