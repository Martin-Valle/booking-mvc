// src/controllers/LoginController.ts
import { LoginView } from "../views/LoginView";
import { auth } from "../services/auth.service";
import { router } from "../core/router";
import { toast } from "../core/toast";

export function LoginController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  const view = LoginView(async (email, password) => {
    try {
      await auth.login(email, password);

      // Saludo con primer nombre (o email si no hay nombre)
      const u = auth.user();
      const first = String(
        (u as any)?.nombre || (u as any)?.name || (u as any)?.fullName || (u as any)?.email || "usuario"
      ).split(" ")[0];

      toast.success(`Hola, ${first}`);

      // Notificar al header (por si tu auth no emite eventos propios)
      window.dispatchEvent(new Event("auth:login"));
      window.dispatchEvent(new Event("auth:changed"));

      router.navigate("/"); // o "/profile" si prefieres
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo iniciar sesión");
    }
  });

  mount.appendChild(view);
}
