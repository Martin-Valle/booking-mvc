import type { SearchResult } from "../models/types";
import { EasyCarView, type EasyCarFilters } from "../views/EasyCarView";
import * as searchService from "../services/search.service";
import { showToast } from "../core/toast";

// Simular servicio de carrito simple para demostración
const cart: any[] = [];

export async function EasyCarController(app: HTMLElement) {
  console.log("[EasyCarController] Iniciando...");

  // Initial empty view
  const view = EasyCarView([], handleAdd, handleFilter);
  app.innerHTML = "";
  app.appendChild(view);

  // Show loading
  view.showLoading();

  // Load initial results (no filters)
  await loadCars({});

  async function loadCars(filters: EasyCarFilters) {
    try {
      console.log("[EasyCarController] Buscando vehículos con filtros:", filters);
      
      // Call search service with filters
      const results = await searchService.searchEasyCar(filters);
      
      console.log(`[EasyCarController] Encontrados ${results.length} vehículos`);
      
      // Update view
      view.paint(results);
      
      if (results.length === 0) {
        showToast("toast-info");
      }
    } catch (error: any) {
      console.error("[EasyCarController] Error buscando vehículos:", error);
      showToast("toast-error");
      view.paint([]);
    }
  }

  function handleFilter(filters: EasyCarFilters) {
    console.log("[EasyCarController] Aplicando filtros:", filters);
    loadCars(filters);
  }

  function handleAdd(result: SearchResult) {
    if (result.kind !== "car") return;
    
    const car = result.item as any;
    console.log("[EasyCarController] Agregando auto al carrito:", car);
    
    // Agregar al carrito simple
    cart.push({
      kind: "car",
      id: car.id,
      title: `${car.brand} ${car.model}`,
      subtitle: "Easy Car",
      qty: 1,
      price: car.pricePerDay,
      photo: car.photo
    });
    
    console.log("[EasyCarController] Item agregado. Carrito actual:", cart);
    showToast("toast-success");
  }
}
