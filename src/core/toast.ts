// src/core/toast.ts
type ToastType = "success" | "error" | "info" | "warning";

function ensureStyles() {
  if (document.getElementById("app-toast-styles")) return;
  const style = document.createElement("style");
  style.id = "app-toast-styles";
  style.textContent = `
    #toast-container {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .toast-card {
      min-width: 240px;
      max-width: 420px;
      border-radius: 10px;
      padding: 10px 12px;
      color: #fff;
      box-shadow: 0 6px 24px rgba(0,0,0,.18);
      font: 500 14px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity .18s ease, transform .18s ease;
    }
    .toast-card.show { opacity: 1; transform: translateY(0); }
    .toast-success { background: #198754; }
    .toast-error   { background: #dc3545; }
    .toast-info    { background: #0d6efd; }
    .toast-warning { background: #fd7e14; }
    .toast-close {
      background: transparent; border: none; color: #fff; opacity: .9;
      margin-left: 8px; cursor: pointer; font-size: 16px; line-height: 1;
    }
    .toast-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  `;
  document.head.appendChild(style);
}

function ensureContainer(): HTMLElement {
  let c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}

/**
 * showToast: API retro-compatible
 * - Sin argumentos -> muestra "Acción realizada".
 * - Con mensaje y opcional tipo -> usa lo enviado.
 */
export function showToast(message?: string, type: ToastType = "info") {
  const finalMsg = message ?? "Acción realizada";
  ensureStyles();
  const container = ensureContainer();

  const el = document.createElement("div");
  el.className = `toast-card toast-${type}`;
  el.innerHTML = `
    <div class="toast-row">
      <div>${finalMsg}</div>
      <button class="toast-close" aria-label="Cerrar">×</button>
    </div>
  `;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add("show"));

  const close = () => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 180);
  };
  el.querySelector(".toast-close")!.addEventListener("click", close);

  // Autocierre
  let timer = window.setTimeout(close, 3500);
  el.addEventListener("mouseenter", () => clearTimeout(timer));
  el.addEventListener("mouseleave", () => (timer = window.setTimeout(close, 1200)));
}

export const toast = {
  success: (m: string) => showToast(m, "success"),
  error:   (m: string) => showToast(m, "error"),
  info:    (m: string) => showToast(m, "info"),
  warning: (m: string) => showToast(m, "warning"),
};
