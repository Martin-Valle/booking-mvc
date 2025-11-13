// src/views/RegisterView.ts

type RegisterData = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
};

export function RegisterView(onSubmit: (data: RegisterData) => void) {
  const el = document.createElement("section");
  el.className = "container d-flex align-items-center justify-content-center py-5";
  (el.style as any).minHeight = "calc(100vh - 140px)";

  el.innerHTML = `
    <div class="card shadow-sm p-4 w-100" style="max-width:520px">
      <h2 class="mb-3 text-center">Crear cuenta</h2>

      <form id="form" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="nombre">Nombre</label>
            <input class="form-control" id="nombre" required
                   autocomplete="given-name" inputmode="text">
            <div class="invalid-feedback">Solo letras, 2–40 caracteres.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="apellido">Apellido</label>
            <input class="form-control" id="apellido" required
                   autocomplete="family-name" inputmode="text">
            <div class="invalid-feedback">Solo letras, 2–40 caracteres.</div>
          </div>

          <div class="col-12">
            <label class="form-label" for="email">Correo</label>
            <input type="email" class="form-control" id="email" required
                   autocomplete="email" spellcheck="false">
            <div class="invalid-feedback">Correo no válido (ej: nombre@dominio.com).</div>
          </div>

          <div class="col-12">
            <label class="form-label" for="password">Contraseña</label>
            <div class="input-group">
              <input type="password" class="form-control no-reveal" id="password"
                     autocomplete="new-password" required minlength="8" maxlength="64">
              <button class="btn btn-outline-secondary" type="button" id="togglePwd">👁</button>
            </div>
            <div class="form-text">
              Mín. 8 caracteres con mayúscula, minúscula, número y símbolo.
            </div>

            <div class="progress mt-2" style="height:8px">
              <div id="meter" class="progress-bar" style="width:0%"></div>
            </div>
            <div id="pwdTips" class="small mt-2">
              <span data-k="len"    class="text-danger">• 8+ caracteres</span><br>
              <span data-k="lower"  class="text-danger">• minúscula</span><br>
              <span data-k="upper"  class="text-danger">• mayúscula</span><br>
              <span data-k="digit"  class="text-danger">• número</span><br>
              <span data-k="symbol" class="text-danger">• símbolo</span>
            </div>

            <div class="invalid-feedback">La contraseña no cumple los requisitos.</div>
          </div>
        </div>

        <button class="btn btn-primary w-100 mt-3" type="submit">Crear cuenta</button>
      </form>

      <p class="text-center mt-3 mb-0">
        ¿Ya tienes cuenta? <a href="#/login">Iniciar sesión</a>
      </p>
    </div>
  `;

  // Helpers de validación
  const $ = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const nameRe = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+([ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
  const emailRe = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;

  const nombre   = $("#nombre")   as HTMLInputElement;
  const apellido = $("#apellido") as HTMLInputElement;
  const email    = $("#email")    as HTMLInputElement;
  const pwd      = $("#password") as HTMLInputElement;
  const form     = $("#form")     as HTMLFormElement;
  const meter    = $("#meter")    as HTMLDivElement;

  // Mostrar/ocultar contraseña
  $("#togglePwd").addEventListener("click", () => {
    pwd.type = pwd.type === "password" ? "text" : "password";
  });

  function validateName(input: HTMLInputElement) {
    const ok = input.value.trim().length >= 2 &&
               input.value.trim().length <= 40 &&
               nameRe.test(input.value.trim());
    setValidityUi(input, ok);
    return ok;
  }

  function validateEmail(input: HTMLInputElement) {
    const val = input.value.trim();
    const ok = emailRe.test(val);
    setValidityUi(input, ok);
    return ok;
  }

  function scorePassword(s: string) {
    const hasLower  = /[a-z]/.test(s);
    const hasUpper  = /[A-Z]/.test(s);
    const hasDigit  = /\d/.test(s);
    const hasSymbol = /[^A-Za-z0-9]/.test(s);
    const long8     = s.length >= 8;
    const long12    = s.length >= 12;

    // Actualiza tips
    setTip("len", long8);
    setTip("lower", hasLower);
    setTip("upper", hasUpper);
    setTip("digit", hasDigit);
    setTip("symbol", hasSymbol);

    let score = 0;
    if (long8) score++;
    if (hasLower) score++;
    if (hasUpper) score++;
    if (hasDigit) score++;
    if (hasSymbol) score++;
    if (long12) score++; // bonus por longitud

    return Math.min(score, 6); // 0..6
  }

  function setTip(key: string, ok: boolean) {
    const el = elRoot.querySelector(`[data-k="${key}"]`);
    if (!el) return;
    el.classList.toggle("text-danger", !ok);
    el.classList.toggle("text-success", ok);
  }
  const elRoot = el; // para usar en setTip

  function validatePassword(input: HTMLInputElement) {
    const s = input.value;
    const sc = scorePassword(s);
    const ok = sc >= 5; // al menos 5/6 criterios

    // Barra
    const pct = [0,20,40,60,80,100,100][sc];
    meter.style.width = pct + "%";
    meter.className = "progress-bar";
    meter.classList.add(
      sc <= 2 ? "bg-danger" : sc <= 4 ? "bg-warning" : "bg-success"
    );

    setValidityUi(input, ok);
    return ok;
  }

  function setValidityUi(input: HTMLInputElement, ok: boolean) {
    input.classList.toggle("is-valid", ok);
    input.classList.toggle("is-invalid", !ok);
    input.setCustomValidity(ok ? "" : "invalid");
  }

  // Validación en tiempo real
  const debounced = (fn: Function, ms = 150) => {
    let t: any; return (...args: any[]) => {
      clearTimeout(t); t = setTimeout(() => fn(...args), ms);
    };
  };

  nombre .addEventListener("input", debounced(() => validateName(nombre)));
  apellido.addEventListener("input", debounced(() => validateName(apellido)));
  email  .addEventListener("input", debounced(() => validateEmail(email)));
  pwd    .addEventListener("input",  () => validatePassword(pwd));

  // Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.classList.add("was-validated");

    const ok =
      validateName(nombre) &&
      validateName(apellido) &&
      validateEmail(email) &&
      validatePassword(pwd);

    if (!ok) {
      // Lleva al primer campo inválido
      const firstInvalid = form.querySelector(".is-invalid") as HTMLElement;
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSubmit({
      nombre: nombre.value.trim(),
      apellido: apellido.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: pwd.value,
    });
  });

  return el;
}
