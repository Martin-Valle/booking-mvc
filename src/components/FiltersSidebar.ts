// src/components/FiltersSidebar.ts
import type { FilterState, ServiceKind } from "../models/types";

const KIND_LABEL: Record<ServiceKind, string> = {
  hotel: "Hoteles",
  car: "Autos",
  flight: "Vuelos",
  restaurant: "Restaurantes",
};

export function FiltersSidebar(initial: FilterState, onChange: (f: FilterState) => void) {
  const f: FilterState = { ...initial, kinds: [...(initial.kinds ?? [])] };

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
      ${(["hotel","car","flight","restaurant"] as ServiceKind[]).map(k => `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${k}" id="k-${k}" ${f.kinds.includes(k) ? "checked":""}/>
          <label class="form-check-label" for="k-${k}">${KIND_LABEL[k]}</label>
        </div>`).join("")}
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Precio (USD)</div>
      <div class="input-group input-group-sm mb-1">
        <span class="input-group-text">$</span>
        <input type="number" class="form-control" placeholder="mín" id="priceMin" value="${f.priceMin ?? ""}">
        <span class="input-group-text">—</span>
        <input type="number" class="form-control" placeholder="máx" id="priceMax" value="${f.priceMax ?? ""}">
      </div>
      <div class="form-text">Para autos es por día.</div>
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Ciudad (Hoteles/Restaurantes/Autos)</div>
      <input class="form-control form-control-sm" id="city" placeholder="Quito, Madrid..." value="${f.city ?? ""}">
    </div>

    <div class="mb-3">
      <div class="fw-semibold small text-muted mb-1">Rating mínimo (Hoteles/Restaurantes)</div>
      <input type="range" class="form-range" min="0" max="5" step="0.5" id="ratingMin" value="${f.ratingMin ?? 0}">
      <div class="d-flex justify-content-between small">
        <span>0</span><span id="ratingVal">${f.ratingMin ?? 0}</span><span>5</span>
      </div>
    </div>

    <div class="mb-2">
      <div class="fw-semibold small text-muted mb-1">Ordenar por</div>
      <select class="form-select form-select-sm" id="sort">
        <option value="">Relevancia</option>
        <option value="price-asc"  ${f.sort==="price-asc"?"selected":""}>Precio: menor a mayor</option>
        <option value="price-desc" ${f.sort==="price-desc"?"selected":""}>Precio: mayor a menor</option>
        <option value="rating-desc"${f.sort==="rating-desc"?"selected":""}>Rating: alto primero</option>
      </select>
    </div>
  `;

  const emit = () => onChange({ ...f, kinds: [...f.kinds] });

  function clear() {
    f.kinds = ["hotel","car","flight","restaurant"];
    f.priceMin = f.priceMax = undefined;
    f.city = undefined;
    f.ratingMin = 0;
    f.sort = undefined;

    (["hotel","car","flight","restaurant"] as ServiceKind[]).forEach(k => {
      (el.querySelector(`#k-${k}`) as HTMLInputElement).checked = true;
    });
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

  // 'change' → checkboxes y select
  el.addEventListener("change", (e) => {
    const t = e.target as HTMLElement;

    if (t instanceof HTMLInputElement && t.id.startsWith("k-") && t.type === "checkbox") {
      const kind = t.value as ServiceKind;
      if (t.checked) {
        if (!f.kinds.includes(kind)) f.kinds = [...f.kinds, kind];
      } else {
        f.kinds = f.kinds.filter(k => k !== kind);
      }
      emit();
      return;
    }

    if (t instanceof HTMLSelectElement && t.id === "sort") {
      f.sort = (t.value || undefined) as any;
      emit();
    }
  });

  // 'input' → num/text/range
  el.addEventListener("input", (e) => {
    const t = e.target as HTMLElement;

    if (t instanceof HTMLInputElement) {
      if (t.id === "priceMin") f.priceMin = t.value ? +t.value : undefined;
      if (t.id === "priceMax") f.priceMax = t.value ? +t.value : undefined;
      if (t.id === "city")     f.city     = t.value || undefined;
      if (t.id === "ratingMin") {
        f.ratingMin = +t.value;
        (el.querySelector("#ratingVal") as HTMLElement).textContent = String(f.ratingMin);
      }
      emit();
    }
  });

  (el as any).clear = clear;
  return el as any;
}
