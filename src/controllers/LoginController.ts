import { LoginView } from "../views/LoginView";
import { auth } from "../services/auth.service";
import { router } from "../core/router";
import { toast } from "../core/toast";

export function LoginController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";
  mount.appendChild(
    LoginView(async (email, password) => {
      try {
        await auth.login(email, password);
        toast.success("Sesión iniciada");
        router.navigate("/"); // o /profile
      } catch (e: any) {
        toast.error(e.message || "No se pudo iniciar sesión");
      }
    })
  );
}
