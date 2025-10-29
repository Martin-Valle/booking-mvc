// src/controllers/LoginController.ts
import { LoginView } from "../views/LoginView";
import { authLogin, authMe } from "../services/auth.service";
import { router } from "../core/router";

export async function LoginController() {
  const mount = document.getElementById("view")!;

  // Si ya hay sesión, redirige
  const me = await authMe();
  if (me) {
    router.navigate("/profile");
    return;
  }

  const view: any = LoginView(async (email: string, password: string) => {
    try {
      await authLogin(email, password);

      // vuelve a consultar el usuario ya autenticado
      const u = await authMe();

      // actualiza el texto del menú "Perfil"
      const link = document.querySelector('a[href="#/profile"]');
      if (link) (link as HTMLAnchorElement).textContent = u ? u.name : "Perfil";

      router.navigate("/profile");
    } catch (e: any) {
      const msg = e?.message ?? "No se pudo iniciar sesión.";
      if (typeof view?.setError === "function") view.setError(msg);
      else alert(msg);
    }
  });

  mount.innerHTML = "";
  // soporta que la vista devuelva elemento o { el }
  mount.appendChild(view instanceof HTMLElement ? view : (view?.el ?? view));
}
