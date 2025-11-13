// src/views/LoginView.ts
export function LoginView(onSubmit: (email: string, password: string) => void) {
  const el = document.createElement("section");
  el.className = "container d-flex align-items-center justify-content-center py-5";
  (el.style as any).minHeight = "calc(100vh - 140px)";

  el.innerHTML = `
    <div class="card shadow-sm p-4 w-100" style="max-width:420px">
      <h2 class="mb-3 text-center">Iniciar sesión</h2>

      <form id="form" novalidate>
        <div class="mb-3">
          <label class="form-label" for="email">Correo</label>
          <input type="email" class="form-control" id="email"
                 autocomplete="username" required>
          <div class="invalid-feedback">Ingresa un correo válido.</div>
        </div>

        <div class="mb-2">
          <label class="form-label" for="password">Contraseña</label>
          <div class="input-group">
            <input type="password" class="form-control" id="password"
                   autocomplete="current-password" required>
            <button class="btn btn-outline-secondary" type="button" id="togglePwd"
                    aria-label="Mostrar u ocultar contraseña">👁</button>
          </div>
          <div class="invalid-feedback">Ingresa tu contraseña.</div>
        </div>

        <button class="btn btn-primary w-100 mt-2" type="submit" id="submitBtn">Entrar</button>
      </form>

      <hr class="my-4">
      <p class="mb-0 text-center text-muted">
        ¿No tienes cuenta? <a href="#/register">Crear cuenta</a>
      </p>
    </div>
  `;

  // Mostrar/ocultar contraseña (solo un ojo: el nuestro)
  const pwd = el.querySelector<HTMLInputElement>("#password")!;
  el.querySelector<HTMLButtonElement>("#togglePwd")!.addEventListener("click", () => {
    pwd.type = pwd.type === "password" ? "text" : "password";
  });

  // Envío + validación nativa
  const form = el.querySelector<HTMLFormElement>("#form")!;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.classList.add("was-validated");
    if (!form.checkValidity()) return;

    const email = (el.querySelector<HTMLInputElement>("#email")!).value.trim();
    const password = (el.querySelector<HTMLInputElement>("#password")!).value;
    onSubmit(email, password);
  });

  return el;
}
