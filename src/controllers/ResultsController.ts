// src/controllers/ResultsController.ts
import { searchAll } from "../services/search.service";
import { ResultCard } from "../components/ResultCard";
import { addFromResult } from "../services/cart.service";
import { showToast } from "../core/toast";
import { ResultsView } from "../views/ResultsView";
import type { FilterState, SearchResult, ServiceKind } from "../models/types";

export async function ResultsController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  // 1) Tomar ?q del hash → precarga "Ciudad" del sidebar
  const { qParam } = getQFromHash();

  // 2) kinds desde sessionStorage (si viniste del SearchBar con "Todos/Hotel/Car...")
  let kinds: ServiceKind[] = [];
  try { kinds = JSON.parse(sessionStorage.getItem("kinds") || "[]"); } catch { kinds = []; }
  if (!Array.isArray(kinds) || kinds.length === 0) {
    kinds = ["hotel", "car", "flight", "restaurant"];
  }

  // 3) Estado inicial de filtros (igual que antes, pero con city = ?q)
  let filters: FilterState = {
    kinds,
    priceMin: undefined,
    priceMax: undefined,
    ratingMin: 0,
    city: qParam || "",
    sort: undefined,
  };

  // 4) Montar vista (tu ResultsView ya embebe el sidebar y llama onChange)
  const view = ResultsView(filters, async (f) => {
    filters = { ...filters, ...f };

    // Sincroniza ?q con el campo Ciudad del sidebar
    setHashQueryParam("q", (filters.city || "").trim() || null);

    // (opcional) actualizar título dinámicamente
    view.setTitle(filters.city ? `Resultados para: ${filters.city}` : "Resultados");

    await reload();
  });
  view.setTitle(filters.city ? `Resultados para: ${filters.city}` : "Resultados");
  mount.appendChild(view.el);

  // 5) Primer render
  skeleton(view.gridMount, 6);
  await reload();

  async function reload() {
    const q = (filters.city || "").trim();
    const items = await searchAll(q, filters);
    render(view.gridMount, items);
  }
}

/* ---------- helpers de UI ---------- */
function render(grid: HTMLElement, items: SearchResult[]) {
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML =
      '<div class="col-12"><div class="alert alert-warning">No se encontraron resultados para tu búsqueda.</div></div>';
    return;
  }
  for (const r of items) {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-xl-4";
    col.appendChild(
      ResultCard(r, () => {
        addFromResult(r);
        showToast();
      })
    );
    grid.appendChild(col);
  }
}

function skeleton(grid: HTMLElement, n: number) {
  let html = "";
  for (let i = 0; i < n; i++) {
    html +=
      '<div class="col-12 col-md-6 col-xl-4">' +
      '<div class="card shadow-sm">' +
      '<div style="height:180px" class="placeholder-wave bg-light"></div>' +
      '<div class="card-body">' +
      '<h5 class="placeholder-glow"><span class="placeholder col-8"></span></h5>' +
      '<p class="placeholder-glow"><span class="placeholder col-4"></span></p>' +
      '<div class="d-flex justify-content-between">' +
      '<span class="placeholder col-2"></span>' +
      '<span class="btn btn-primary disabled placeholder col-3">&nbsp;</span>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";
  }
  grid.innerHTML = html;
}

/* ---------- helpers URL ---------- */
function getQFromHash() {
  const [, qs = ""] = location.hash.split("?");
  const sp = new URLSearchParams(qs);
  const qParam = (sp.get("q") || "").trim();
  return { qParam };
}

function setHashQueryParam(key: string, val: string | null) {
  const [path, qs = ""] = location.hash.split("?");
  const sp = new URLSearchParams(qs);
  if (val === null || val === "") sp.delete(key);
  else sp.set(key, val);
  const next = `${path}${sp.toString() ? "?" + sp.toString() : ""}`;
  history.replaceState(null, "", next); // no dispara el router
}
