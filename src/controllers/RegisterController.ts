import { RegisterView } from "../views/RegisterView";
import { auth } from "../services/auth.service"; // o tu servicio de usuarios

export function RegisterController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  const view = RegisterView(async (data) => {
    try {
      // aquí llamas a tu backend o función Netlify para registrar
      // por ejemplo: await auth.register(data)
      // y luego logueas/rediriges:
      // await auth.login(data.email, data.password);
      location.hash = "#/profile";
    } catch (err) {
      alert("No se pudo crear la cuenta");
      console.error(err);
    }
  });

  mount.appendChild(view);
}
