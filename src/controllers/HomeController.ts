import { HomeView } from "../views/HomeView";
import { router } from "../core/router";
import { searchAll } from "../services/search.service";
import { addFromResult } from "../services/cart.service";
import { showToast } from "../core/toast";
import { ResultCard } from "../components/ResultCard";
import type { FilterState, SearchResult } from "../models/types";

export function HomeController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  // 👉 NO vuelvas a escribir "kinds" aquí. SearchBar ya lo guarda.
  const view = HomeView((q) => {
    sessionStorage.setItem("q", q); // opcional (SearchBar ya lo guardó)
    router.navigate("/results");
  });
  mount.appendChild(view.el);

  // Config base para el feed "Recomendado" (mostrar todo)
  const base: FilterState = {
    kinds: ["hotel", "car", "flight", "restaurant"],
    priceMin: undefined,
    priceMax: undefined,
    ratingMin: 0,
    city: "",
    sort: undefined,
  };

  // Skeletons
  view.gridMount.innerHTML = Array.from({ length: 6 })
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

  // Carga todo para el home (q vacío)
  searchAll("", base).then((items) => paintGrid(items));

  function paintGrid(items: SearchResult[]) {
    const grid = view.gridMount;
    grid.innerHTML = "";
    items.forEach((r) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-xl-4";
      col.appendChild(
        ResultCard(r, () => {
          addFromResult(r);
          showToast();
        })
      );
      grid.appendChild(col);
    });
  }
}
