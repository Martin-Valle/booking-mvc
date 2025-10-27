import type { AppConfig, ServiceKind } from "../models/types";

export function AdminConfigView(
  cfg: AppConfig,
  onSave: (cfg: AppConfig) => void
) {
  const el = document.createElement("section");
  el.className = "container py-4";
  el.innerHTML = `
    <h2 class="mb-3">Panel de Administración</h2>
    <div class="card p-3" style="max-width:720px">
      <div class="mb-3">
        <label class="form-label">IVA (%)</label>
        <input type="number" step="0.01" class="form-control" id="iva" value="${cfg.iva ?? 12}">
      </div>

      <h5>Promoción por combinación</h5>
      <div class="form-check form-switch mb-2">
        <input class="form-check-input" type="checkbox" id="promoActive" ${cfg.bundlePromo?.active ? "checked":""}>
        <label class="form-check-label" for="promoActive">Activa</label>
      </div>

      <div class="mb-2">
        <label class="form-label">Descuento (%)</label>
        <input type="number" class="form-control" id="promoPct" value="${cfg.bundlePromo?.discountPercent ?? 10}">
      </div>

      <div class="mb-3">
        <label class="form-label">Servicios requeridos</label>
        <div class="d-flex gap-3 flex-wrap" id="kinds">
          ${(["hotel","car","flight","restaurant"] as ServiceKind[]).map(k => `
            <div class="form-check">
              <input class="form-check-input kind" type="checkbox" value="${k}" id="k-${k}">
              <label class="form-check-label" for="k-${k}">${k}</label>
            </div>
          `).join("")}
        </div>
        <small class="text-muted">La promo se aplica si el carrito incluye todos los seleccionados.</small>
      </div>

      <button class="btn btn-primary" id="save">Guardar cambios</button>
    </div>
  `;

  // marcar kinds existentes
  const current = new Set(cfg.bundlePromo?.kinds ?? []);
  el.querySelectorAll<HTMLInputElement>(".kind").forEach(chk => {
    chk.checked = current.has(chk.value as any);
  });

  el.querySelector<HTMLButtonElement>("#save")!.onclick = () => {
    const iva = Number((el.querySelector<HTMLInputElement>("#iva")!).value);
    const active = (el.querySelector<HTMLInputElement>("#promoActive")!).checked;
    const discountPercent = Number((el.querySelector<HTMLInputElement>("#promoPct")!).value);
    const kinds = Array.from(el.querySelectorAll<HTMLInputElement>(".kind"))
      .filter(c => c.checked)
      .map(c => c.value as ServiceKind);

    onSave({
      iva,
      bundlePromo: { active, discountPercent, kinds }
    });
  };

  return el;
}
