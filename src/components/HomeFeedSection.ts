// src/components/HomeFeedSection.ts
import type { Place } from "../config/places";
import type { SearchResult } from "../models/types";
import { ResultCard } from "./ResultCard";

export function createHomeFeedSection(
  place: Place,
  onAdd: (r: SearchResult) => void,
  onSeeMore: (place: Place) => void
) {
  const el = document.createElement("section");
  el.className = "container py-4";
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-end mb-3">
      <div>
        <h3 class="mb-1">${place.city}</h3>
        <div class="text-muted">${place.country}</div>
      </div>
      <button class="btn btn-outline-primary btn-sm" data-act="see-more">Ver más</button>
    </div>

    <div class="row g-3" data-role="grid">
      ${skeletonRow(6)}
    </div>
  `;

  el.querySelector<HTMLButtonElement>('[data-act="see-more"]')!
    .addEventListener("click", () => onSeeMore(place));

  const grid = el.querySelector<HTMLElement>('[data-role="grid"]')!;

  function paint(items: SearchResult[]) {
    grid.innerHTML = "";
    items.forEach((r) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-xl-4";
      col.appendChild(ResultCard(r, () => onAdd(r)));
      grid.appendChild(col);
    });
  }

  return { el, paint };
}

function skeletonRow(n: number) {
  return Array.from({ length: n })
    .map(
      () => `
      <div class="col-12 col-md-6 col-xl-4">
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
