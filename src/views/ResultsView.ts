// src/views/ResultsView.ts
import type { FilterState } from "../models/types";
import { FiltersSidebar } from "../components/FiltersSidebar";

export function ResultsView(
  initial: FilterState,
  onChange: (f: FilterState) => void
) {
  const el = document.createElement("section");
  el.className = "container py-4";
  el.innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <h3 id="results-title" class="mb-3">Resultados</h3>
      </div>
      <div class="col-12 col-lg-3" id="filters-mount"></div>
      <div class="col-12 col-lg-9">
        <div id="results-grid" class="row g-3"></div>
      </div>
    </div>
  `;

  // Montar Sidebar de filtros con valores iniciales
  const fm = el.querySelector("#filters-mount") as HTMLElement;
  fm.appendChild(FiltersSidebar(initial, onChange));

  return {
    el,
    gridMount: el.querySelector("#results-grid") as HTMLElement,
    setTitle(txt: string) {
      (el.querySelector("#results-title") as HTMLElement).textContent = txt;
    },
  };
}
