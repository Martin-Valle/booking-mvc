// src/components/SearchBar.ts
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import rangePlugin from "flatpickr/dist/plugins/rangePlugin.js";
import type { ServiceKind } from "../models/types";
import { router } from "../core/router";

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function SearchBar(onSubmit?: (q: string) => void) {
  const el = document.createElement("form");
  el.className = "row g-2 align-items-stretch";

  el.innerHTML = `
    <div class="col-12 col-lg-4">
      <input class="form-control form-control-lg" name="q" placeholder="Ciudad, hotel, vuelo..." />
    </div>

    <div class="col-6 col-lg-3">
      <input type="text" id="checkin" class="form-control form-control-lg" placeholder="Fecha de entrada" readonly />
    </div>

    <div class="col-6 col-lg-3">
      <input type="text" id="checkout" class="form-control form-control-lg" placeholder="Fecha de salida" readonly />
    </div>

    <div class="col-12 col-lg-2 d-flex gap-2">
      <select class="form-select form-select-lg flex-grow-1" name="kind" id="kind">
        <option value="all" selected>Todos</option>
        <option value="hotel">Hoteles</option>
        <option value="car">Autos</option>
        <option value="flight">Vuelos</option>
        <option value="restaurant">Restaurantes</option>
      </select>
    </div>

    <div class="col-12 col-sm-4 col-lg-2 d-grid">
      <button class="btn btn-lg btn-secondary" type="submit">Buscar</button>
    </div>
  `;

  // Flatpickr: 1 calendario para 2 inputs (rango)
  const $start = el.querySelector<HTMLInputElement>("#checkin")!;
  const $end = el.querySelector<HTMLInputElement>("#checkout")!;

  flatpickr($start, {
    locale: Spanish,
    dateFormat: "d/m/Y",
    minDate: "today",
    maxDate: addDays(new Date(), 365),
    plugins: [(rangePlugin as any)({ input: $end })],
    onChange(dates) {
      if (dates.length === 2) (this as any).close?.();
    },
  });

  el.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(el);

    const q = (data.get("q")?.toString() || "").trim();

    // Persistir tipo(s) seleccionados
    const v = (data.get("kind")?.toString() || "all") as "all" | ServiceKind;
    let kinds: ServiceKind[] = ["hotel", "car", "flight", "restaurant"];
    if (v !== "all") kinds = [v];
    sessionStorage.setItem("kinds", JSON.stringify(kinds));

    // También guardamos fechas por si luego las usas en el servicio
    sessionStorage.setItem("checkin", $start.value || "");
    sessionStorage.setItem("checkout", $end.value || "");

    // Callback opcional (si tu Home lo usa)
    onSubmit?.(q);

    // Navega con ?q= para sincronizar con el filtro "Ciudad"
    router.navigate(q ? `/results?q=${encodeURIComponent(q)}` : "/results");
  });

  return el;
}
