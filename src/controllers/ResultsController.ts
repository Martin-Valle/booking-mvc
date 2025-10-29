import { searchAll } from "../services/search.service";
import { ResultsView } from "../views/ResultsView";
import { showToast } from "../core/toast";
import { addFromResult } from "../services/cart.service";
import type { FilterState, SearchResult } from "../models/types";

function skeletonGrid(n = 6) {
  return Array.from({ length: n })
    .map(
      () => `
    <div class="col-12 col-md-6 col-xl-4 mb-3">
      <div class="card shadow-sm">
        <div style="height:180px" class="placeholder-wave bg-light"></div>
        <div class="card-body">
          <h5 class="placeholder-glow"><span class="placeholder col-8"></span></h5>
          <p class="placeholder-glow"><span class="placeholder col-4"></span></p>
          <div class="d-flex justify-content-between">
            <span class="placeholder col-2"></span>
            <span class="btn btn-primary disabled placeholder col-3">&nbsp;</span>
          </div>
        </div>
      </div>
    </div>`
    )
    .join("");
}

// Convierte “algo” a HTMLElement de forma segura
function toEl(x: any): HTMLElement {
  if (x instanceof HTMLElement) return x;
  if (x?.el instanceof HTMLElement) return x.el as HTMLElement;
  const w = document.createElement("div");
  w.innerHTML = String(x ?? "");
  return (w.firstElementChild as HTMLElement) ?? w;
}

export function ResultsController() {
  const q = sessionStorage.getItem("q") || "";
  const mount = document.getElementById("view")!;

  // Loader con skeletons
  mount.innerHTML = `<div class="container py-4"><div class="row">${skeletonGrid(6)}</div></div>`;

  const initial: FilterState = {
    kinds: ["hotel", "car", "flight", "restaurant"],
    priceMin: undefined,
    priceMax: undefined,
    ratingMin: 0,
    city: "",
    sort: undefined,
  };

  (async () => {
    try {
      const results = await searchAll(q, initial);

      mount.innerHTML = "";

      // View principal (usa el mini panel interno)
      const viewAny: any = ResultsView(results, (r: SearchResult) => {
        addFromResult(r);
        showToast();
      });
      const viewEl = toEl(viewAny);
      mount.appendChild(viewEl);

      // --------- WIRING: mini panel de filtros ---------
      // Callback común para aplicar filtros
      const applyFilters = async (f: FilterState) => {
        const filtered = await searchAll(q, f);
        viewAny?.paint?.(filtered);
      };

      // (A) Si la vista expone onFiltersChange(callback)
      if (typeof viewAny?.onFiltersChange === "function") {
        viewAny.onFiltersChange((f: FilterState) => applyFilters(f));
      }

      // (B) Si la vista emite CustomEvent('filters-change', {detail: FilterState})
      viewEl.addEventListener?.("filters-change", (ev: any) => {
        if (ev?.detail) applyFilters(ev.detail as FilterState);
      });

      // (C) Limpiar filtros desde la vista (si lo emite)
      viewEl.addEventListener?.("clear-filters", () => {
        applyFilters(initial);
      });

      // Toggle del mini panel (si existe en la vista)
      viewAny?.toggleBtn?.addEventListener?.("click", () => {
        const target =
          (viewAny?.filtersMount as HTMLElement | undefined) ??
          (viewEl.querySelector?.("[data-filters]") as HTMLElement | null);
        target?.classList.toggle("d-none");
      });
      // -----------------------------------------------

    } catch (err) {
      console.error("[ResultsController] error:", err);
      mount.innerHTML = `
        <div class="container py-5">
          <div class="alert alert-danger">
            No se pudo cargar resultados. Intenta nuevamente.
          </div>
        </div>`;
    }
  })();
}
