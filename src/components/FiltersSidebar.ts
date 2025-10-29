import type { FilterState, ServiceKind } from "../models/types";

const KIND_LABEL: Record<ServiceKind, string> = {
  hotel: "Hoteles",
  car: "Autos",
  flight: "Vuelos",
  restaurant: "Restaurantes",
};

// Helper: garantiza array aunque llegue undefined/null
const toArray = <T,>(x: T[] | undefined | null): T[] => (Array.isArray(x) ? x : []);

const ALL_KINDS: ServiceKind[] = ["hotel", "car", "flight", "restaurant"];

export function FiltersSidebar(initial: FilterState, onChange: (f: FilterState) => void) {
  const f: FilterState = { ...initial };

  // Defaults seguros para que nunca truene el UI
  f.kinds = toArray(f.kinds);
  if (f.kinds.length === 0) f.kinds = [...ALL_KINDS];
  if (typeof f.ratingMin !== "number") f.ratingMin = 0;

  const el = document.createElement("aside");
  el.className = "card shadow-sm p-3 sticky-top";
  el.style.top = "1rem";
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5 class="m-0">Filtros</h5>
      <button class="btn btn-sm btn-link p-0" data-act="clear">Limpiar</button>
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Tipo</div>
      ${ALL_KINDS
        .map(
          (k) => `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${k}" id="k-${k}" ${
            toArray(f.kinds).includes(k) ? "checked" : ""
          }/>
          <label class="form-check-label" for="k-${k}">
            ${k === "restaurant" ? `<span class="text-warning">🍽️ ${KIND_LABEL[k]}</span>` : KIND_LABEL[k]}
          </label>
        </div>`
        )
        .join("")}
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Precio (USD)</div>
      <div class="input-group input-group-sm mb-1">
        <span class="input-group-text">$</span>
        <input type="number" class="form-control" placeholder="mín" id="priceMin" value="${f.priceMin ?? ""}">
        <span class="input-group-text">—</span>
        <input type="number" class="form-control" placeholder="máx" id="priceMax" value="${f.priceMax ?? ""}">
      </div>
      <div class="form-text">Para autos: precio por día | Restaurantes: por persona</div>
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Ciudad (Hoteles y Restaurantes)</div>
      <input class="form-control form-control-sm" id="city" placeholder="Quito, Cuenca..." value="${f.city ?? ""}">
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Rating mínimo (Hoteles y Restaurantes)</div>
      <input type="range" class="form-range" min="0" max="5" step="0.5" id="ratingMin" value="${f.ratingMin ?? 0}">
      <div class="d-flex justify-content-between small">
        <span>0</span><span id="ratingVal">${f.ratingMin ?? 0}</span><span>5</span>
      </div>
    </div>

    <div class="mb-2">
      <div class="fw-semibold small text-muted mb-1">Ordenar por</div>
      <select class="form-select form-select-sm" id="sort">
        <option value="">Relevancia</option>
        <option value="price-asc"  ${f.sort === "price-asc" ? "selected" : ""}>Precio: menor a mayor</option>
        <option value="price-desc" ${f.sort === "price-desc" ? "selected" : ""}>Precio: mayor a menor</option>
        <option value="rating-desc"${f.sort === "rating-desc" ? "selected" : ""}>Rating: alto primero</option>
      </select>
    </div>
  `;

  function emit() {
    onChange({ ...f });
  }

  // === clear para uso interno y externo ===
  function clear() {
    f.kinds = [...ALL_KINDS];
    f.priceMin = f.priceMax = undefined;
    f.city = undefined;
    f.ratingMin = 0;
    f.sort = undefined;
    ALL_KINDS.forEach((k) => ((el.querySelector(`#k-${k}`) as HTMLInputElement).checked = true));
    (el.querySelector("#priceMin") as HTMLInputElement).value = "";
    (el.querySelector("#priceMax") as HTMLInputElement).value = "";
    (el.querySelector("#city") as HTMLInputElement).value = "";
    (el.querySelector("#ratingMin") as HTMLInputElement).value = "0";
    (el.querySelector("#ratingVal") as HTMLElement).textContent = "0";
    (el.querySelector("#sort") as HTMLSelectElement).value = "";
    emit();
  }

  el.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.getAttribute("data-act") === "clear") clear();
  });

  el.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    if (t.id.startsWith("k-")) {
      const kind = t.getAttribute("value") as ServiceKind;
      if (t instanceof HTMLInputElement && t.type === "checkbox") {
        // Trabaja sobre una copia segura y reasigna
        let kinds = toArray(f.kinds);
        if (t.checked && !kinds.includes(kind)) kinds = [...kinds, kind];
        if (!t.checked) kinds = kinds.filter((k) => k !== kind);
        f.kinds = kinds;
      }
    }
    if (t.id === "priceMin") f.priceMin = t.value ? +t.value : undefined;
    if (t.id === "priceMax") f.priceMax = t.value ? +t.value : undefined;
    if (t.id === "city") f.city = t.value || undefined;
    if (t.id === "ratingMin") {
      f.ratingMin = +t.value;
      (el.querySelector("#ratingVal") as HTMLElement).textContent = String(f.ratingMin);
    }
    if (t.id === "sort") f.sort = (t.value || undefined) as any;
    emit();
  });

  // expone clear() al controller
  (el as any).clear = clear;
  return el as any;
}
