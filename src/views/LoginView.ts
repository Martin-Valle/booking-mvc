export function LoginView(onSubmit: (email: string, password: string) => void) {
  const el = document.createElement("section");
  el.className = "container py-4";
  el.innerHTML = `
    <h2 class="mb-3">Iniciar sesión</h2>
    <form id="form" class="card p-3" style="max-width:420px">
      <div class="mb-3">
        <label class="form-label">Correo</label>
        <input type="email" class="form-control" id="email" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Contraseña</label>
        <input type="password" class="form-control" id="password" required>
      </div>
      <button class="btn btn-primary w-100" type="submit">Entrar</button>
    </form>
  `;
  const form = el.querySelector<HTMLFormElement>("#form")!;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (el.querySelector<HTMLInputElement>("#email")!).value.trim();
    const password = (el.querySelector<HTMLInputElement>("#password")!).value;
    onSubmit(email, password);
  });
  return el;
}
