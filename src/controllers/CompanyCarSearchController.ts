/**
 * Controlador de Búsqueda de Vehículos por Empresa
 * Maneja la búsqueda específica según la empresa seleccionada
 */

import type { SearchResult } from "../models/types";
import { CompanyCarSearchView, type CarFilters } from "../views/CompanyCarSearchView";
import * as searchService from "../services/search.service";
import { showToast } from "../core/toast";
import { router } from "../main";

// Mapeo de IDs de empresa a nombres
const COMPANY_NAMES: Record<string, string> = {
  easycar: "Easy Car",
  cuencacar: "Cuenca Car Rental",
  rentcar: "Autos RentCar",
  rentaautosmadrid: "Renta Autos Madrid",
  alquileraugye: "Alquiler Augye"
};

// Simular carrito
const cart: any[] = [];

export async function CompanyCarSearchController(app: HTMLElement, companyId: string) {
  console.log("[CompanyCarSearchController] Iniciando para empresa:", companyId);

  const companyName = COMPANY_NAMES[companyId] || "Empresa de Autos";

  // Initial empty view
  const view = CompanyCarSearchView(
    companyId,
    companyName,
    [],
    handleAdd,
    handleFilter,
    handleBack
  );
  app.innerHTML = "";
  app.appendChild(view);

  // Show loading
  view.showLoading();

  // Load initial results (no filters)
  await loadCars(companyId, {});

  async function loadCars(company: string, filters: CarFilters) {
    try {
      console.log(`[CompanyCarSearchController] ====== INICIO CARGA ======`);
      console.log(`[CompanyCarSearchController] Empresa: ${company}`);
      console.log(`[CompanyCarSearchController] Filtros:`, JSON.stringify(filters));
      
      let results: SearchResult[] = [];

      // Llamar al servicio correspondiente según la empresa
      switch (company) {
        case "easycar":
          console.log(`[CompanyCarSearchController] Llamando a searchEasyCar...`);
          results = await searchService.searchEasyCar(filters);
          break;
        case "cuencacar":
          console.log(`[CompanyCarSearchController] Llamando a searchCuencaCar...`);
          results = await searchService.searchCuencaCar(filters);
          break;
        case "rentcar":
          console.log(`[CompanyCarSearchController] Llamando a searchRentCar...`);
          results = await searchService.searchRentCar(filters);
          break;
        case "rentaautosmadrid":
          console.log(`[CompanyCarSearchController] Llamando a searchRentaAutosMadrid...`);
          results = await searchService.searchRentaAutosMadrid(filters);
          break;
        case "alquileraugye":
          console.log(`[CompanyCarSearchController] Llamando a searchAlquilerAugye...`);
          results = await searchService.searchAlquilerAugye(filters);
          break;
        default:
          console.log(`[CompanyCarSearchController] ⚠️ Empresa ${company} no reconocida`);
          results = [];
      }
      
      console.log(`[CompanyCarSearchController] ✅ Respuesta recibida: ${results.length} resultados`);
      console.log(`[CompanyCarSearchController] Actualizando vista con ${results.length} vehículos`);
      
      // Update view
      view.paint(results);
      
      if (results.length === 0) {
        console.log(`[CompanyCarSearchController] Sin resultados - mostrando toast`);
        showToast("toast-info");
      } else {
        console.log(`[CompanyCarSearchController] ✅ ${results.length} vehículos mostrados`);
      }
      
    } catch (error: any) {
      console.error("[CompanyCarSearchController] ❌ ERROR:");
      console.error("[CompanyCarSearchController] Mensaje:", error?.message);
      console.error("[CompanyCarSearchController] Stack:", error?.stack);
      console.error("[CompanyCarSearchController] Error completo:", error);
      
      // Mostrar error al usuario
      showToast("toast-error");
      view.paint([]);
      
      // Mostrar alerta con más detalles
      alert(`Error al buscar vehículos:\n\n${error?.message || 'Error desconocido'}\n\nRevisa la consola del navegador (F12) para más detalles.`);
    }
  }

  function handleFilter(filters: CarFilters) {
    console.log("[CompanyCarSearchController] Aplicando filtros:", filters);
    loadCars(companyId, filters);
  }

  function handleAdd(result: SearchResult) {
    if (result.kind !== "car") return;
    
    const car = result.item as any;
    console.log("[CompanyCarSearchController] Agregando auto al carrito:", car);
    
    cart.push({
      kind: "car",
      id: car.id,
      title: `${car.brand} ${car.model}`,
      subtitle: companyName,
      qty: 1,
      price: car.pricePerDay,
      photo: car.photo
    });
    
    console.log("[CompanyCarSearchController] Carrito actual:", cart);
    showToast("toast-success");
  }

  function handleBack() {
    console.log("[CompanyCarSearchController] Volviendo a lista de empresas");
    router.navigate("/cars");
  }
}
