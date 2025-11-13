// src/views/AdminConfigView.ts
import type { AppConfig, ServiceKind } from "../models/types";

export function AdminConfigView(
  cfg: AppConfig,
  onSave: (cfg: AppConfig) => void
) {
  const el = document.createElement("section");
  el.id = "admin-root";
  el.className = "container py-4 d-flex justify-content-center";

  // valores saneados
  const ivaVal = Number.isFinite(cfg.iva) ? Math.max(0, Math.min(100, Math.round(cfg.iva!))) : 12;
  const promo = cfg.bundlePromo ?? { active: false, discountPercent: 0, kinds: [] };

  el.innerHTML = `
    <div class="w-100" style="max-width:860px">
      <h2 class="mb-3">Panel de Administración</h2>

      <ul class="nav nav-tabs" id="adminTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="tab-config-btn" data-bs-toggle="tab" data-bs-target="#tab-config" type="button" role="tab">Configuración</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-users-btn" data-bs-toggle="tab" data-bs-target="#tab-users" type="button" role="tab">Usuarios</button>
        </li>
      </ul>

      <div class="tab-content border-start border-end border-bottom p-3 rounded-bottom">
        <!-- CONFIG -->
        <div class="tab-pane fade show active" id="tab-config" role="tabpanel">
          <form id="cfg-form" class="card p-3 border-0" style="max-width:720px">
            <div class="mb-3">
              <label class="form-label">IVA (%)</label>
              <input type="number" min="0" max="100" step="1" class="form-control" id="iva" value="${ivaVal}">
              <div class="form-text">Valores enteros 0–100.</div>
            </div>

            <h5>Promoción por combinación</h5>
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="promoActive" ${promo.active ? "checked" : ""}>
              <label class="form-check-label" for="promoActive">Activa</label>
            </div>

            <div class="mb-2">
              <label class="form-label">Descuento (%)</label>
              <input type="number" min="0" max="100" step="1" class="form-control" id="promoPct" value="${Math.round(promo.discountPercent || 0)}">
            </div>

            <div class="mb-3">
              <label class="form-label">Servicios requeridos</label>
              <div class="d-flex gap-3 flex-wrap" id="kinds">
                ${(["hotel","car","flight","restaurant"] as ServiceKind[])
                  .map((k) => `
                    <div class="form-check">
                      <input class="form-check-input kind" type="checkbox" value="${k}" id="k-${k}">
                      <label class="form-check-label" for="k-${k}">${k}</label>
                    </div>`
                  ).join("")}
              </div>
              <small class="text-muted">La promo aplica si el carrito incluye <strong>todos</strong> los seleccionados.</small>
            </div>

            <button class="btn btn-primary" id="save">Guardar cambios</button>
          </form>
        </div>

        <!-- USERS -->
        <div class="tab-pane fade" id="tab-users" role="tabpanel">
          <div id="users-box" class="py-2 text-muted">Cargando usuarios...</div>
        </div>
      </div>
    </div>
  `;

  // marcar kinds existentes
  const current = new Set(promo.kinds ?? []);
  el.querySelectorAll<HTMLInputElement>(".kind").forEach((chk) => {
    chk.checked = current.has(chk.value as ServiceKind);
  });

  // habilitar/deshabilitar campos de promo al activar/desactivar
  const $promoActive = el.querySelector<HTMLInputElement>("#promoActive")!;
  const togglePromoFields = () => {
    const disabled = !$promoActive.checked;
    el.querySelectorAll<HTMLInputElement>(".kind").forEach((c) => (c.disabled = disabled));
    (el.querySelector<HTMLInputElement>("#promoPct")!).disabled = disabled;
  };
  togglePromoFields();
  $promoActive.addEventListener("change", togglePromoFields);

  // submit
  el.querySelector<HTMLFormElement>("#cfg-form")!.addEventListener("submit", (e) => {
    e.preventDefault();

    const iva = clampInt((el.querySelector<HTMLInputElement>("#iva")!).value, 0, 100);
    const active = $promoActive.checked;
    const discountPercent = clampInt((el.querySelector<HTMLInputElement>("#promoPct")!).value, 0, 100);
    const kinds = Array.from(el.querySelectorAll<HTMLInputElement>(".kind"))
      .filter((c) => c.checked)
      .map((c) => c.value as ServiceKind);

    onSave({
      iva,
      bundlePromo: { active, discountPercent, kinds },
    } as AppConfig);

    // opcional: notificar a la app
    window.dispatchEvent(new CustomEvent("config:changed"));
  });

  return el;
}

function clampInt(v: string, min: number, max: number) {
  const n = Math.round(Number(v || 0));
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}
