export function RegisterView(onSubmit: (p: {
  nombre: string; apellido: string; email: string; telefono?: string; password: string;
}) => void) {
  const el = document.createElement("div");
  el.className = "container py-4";
  el.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-12 col-md-7 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h4 class="mb-3">Crear cuenta</h4>
            <div class="row g-2">
              <div class="col-md-6 mb-2">
                <label class="form-label">Nombre</label>
                <input id="nombre" class="form-control" required />
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">Apellido</label>
                <input id="apellido" class="form-control" required />
              </div>
            </div>
            <div class="mb-2">
              <label class="form-label">Email</label>
              <input id="email" type="email" class="form-control" required />
            </div>
            <div class="mb-2">
              <label class="form-label">Teléfono (opcional)</label>
              <input id="telefono" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <input id="password" type="password" class="form-control" required />
            </div>
            <div class="d-grid gap-2">
              <button id="btnReg" class="btn btn-success">Crear cuenta</button>
              <a href="#/login" class="btn btn-outline-secondary">Ya tengo cuenta</a>
            </div>
            <div id="msg" class="text-danger small mt-3" style="display:none"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  el.querySelector<HTMLButtonElement>("#btnReg")!.addEventListener("click", () => {
    const payload = {
      nombre: (el.querySelector("#nombre") as HTMLInputElement).value.trim(),
      apellido: (el.querySelector("#apellido") as HTMLInputElement).value.trim(),
      email: (el.querySelector("#email") as HTMLInputElement).value.trim(),
      telefono: (el.querySelector("#telefono") as HTMLInputElement).value.trim() || undefined,
      password: (el.querySelector("#password") as HTMLInputElement).value,
    };
    onSubmit(payload);
  });

  (el as any).setError = (m: string) => {
    const msg = el.querySelector<HTMLDivElement>("#msg")!;
    msg.textContent = m;
    msg.style.display = m ? "block" : "none";
  };

  return el as any;
}
