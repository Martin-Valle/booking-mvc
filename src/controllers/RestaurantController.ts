import { getRestaurantById } from "../services/adapters/mock.adapter";
import { RestaurantDetailView } from "../views/RestaurantDetailView";
import { addFromResult } from "../services/cart.service";
import { showToast } from "../core/toast";
import type { SearchResult } from "../models/types";

export function RestaurantController() {
  const mount = document.getElementById("view")!;
  mount.innerHTML = "";

  // Ruta: #/restaurant?id=...
  const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const id = params.get("id");

  if (!id) {
    mount.innerHTML = `
      <div class="container py-5">
        <h3>Restaurante no encontrado</h3>
        <p class="text-muted">Falta el parámetro <code>id</code>.</p>
      </div>`;
    return;
  }

  const r = getRestaurantById(id);
  if (!r) {
    mount.innerHTML = `<div class="container py-5"><h3>Restaurante no encontrado</h3></div>`;
    return;
  }

  // --- callback que usará la vista ---
  const onAdd = () => {
    const sr: SearchResult = { kind: "restaurant", item: r };
    addFromResult(sr);
    showToast(); // o showToast("Agregado al carrito");
  };

  // Pasamos el callback a la vista
  const view = RestaurantDetailView(r, onAdd);
  mount.appendChild(view);

  // Fallback: si la vista aún no enlaza #add internamente, lo enlazamos aquí
  const btn = view.querySelector<HTMLButtonElement>("#add");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", onAdd);
    btn.dataset.bound = "1";
  }
}
