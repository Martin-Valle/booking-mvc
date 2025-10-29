export function LoginView(onSubmit: (email: string, password: string) => void) {
  const el = document.createElement("div");
  el.className = "container py-4";
  el.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-12 col-md-6 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body">
            <h4 class="mb-3">Iniciar sesión</h4>

            <form id="form" novalidate>
              <div class="mb-3">
                <label class="form-label" for="email">Email</label>
                <input id="email" name="email" type="email" class="form-control" autocomplete="email" required />
                <div class="invalid-feedback">Ingresa un correo válido.</div>
              </div>

              <div class="mb-3">
                <label class="form-label" for="password">Contraseña</label>
                <div class="input-group">
                  <input id="password" name="password" type="password" class="form-control" autocomplete="current-password" required />
                  <button id="togglePassword" type="button" class="btn btn-outline-secondary" aria-label="Mostrar/ocultar contraseña">Mostrar</button>
                </div>
              </div>

              <div class="d-grid gap-2">
                <button id="btnLogin" class="btn btn-primary" type="submit">Entrar</button>
                <a href="#/register" class="btn btn-outline-secondary" role="button">Crear cuenta</a>
              </div>

              <div id="msg" class="text-danger small mt-3 d-none"></div>
            </form>

          </div>
        </div>
      </div>
    </div>
  `;

  const form = el.querySelector<HTMLFormElement>("#form")!;
  const emailInput = el.querySelector<HTMLInputElement>("#email")!;
  const passwordInput = el.querySelector<HTMLInputElement>("#password")!;
  const btnLogin = el.querySelector<HTMLButtonElement>("#btnLogin")!;
  const msg = el.querySelector<HTMLDivElement>("#msg")!;
  const togglePassword = el.querySelector<HTMLButtonElement>("#togglePassword")!;

  // UX: autofocus
  setTimeout(() => emailInput.focus(), 0);

  function setError(m: string) {
    msg.textContent = m || "";
    msg.classList.toggle("d-none", !m);
  }

  function setBusy(busy: boolean) {
    emailInput.disabled = busy;
    passwordInput.disabled = busy;
    btnLogin.disabled = busy;
    if (busy) {
      (btnLogin as any).dataset.originalText = btnLogin.innerHTML;
      btnLogin.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Entrando…';
    } else {
      btnLogin.innerHTML = (btnLogin as any).dataset.originalText || "Entrar";
    }
  }

  togglePassword.addEventListener("click", () => {
    const isPwd = passwordInput.type === "password";
    passwordInput.type = isPwd ? "text" : "password";
    togglePassword.textContent = isPwd ? "Ocultar" : "Mostrar";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");
    if (!emailInput.value || !form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      setBusy(true);
      await Promise.resolve(onSubmit(email, password)); // soporta sync/async
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  });

  // API pública del elemento para control externo
  (el as any).setError = (m: string) => setError(m);
  (el as any).setBusy = (b: boolean) => setBusy(b);

  return el as any;
}
