/**
 * Controlador de Búsqueda de Vuelos por Aerolínea
 * Maneja la búsqueda específica según la aerolínea seleccionada
 */

import type { SearchResult } from "../models/types";
import { CompanyFlightSearchView, type FlightFilters } from "../views/CompanyFlightSearchView";
import * as searchService from "../services/search.service";
import { showToast } from "../core/toast";

// Mapeo de IDs de aerolínea a nombres
const COMPANY_NAMES: Record<string, string> = {
  skyandes: "✈️ SkyAndes",
  madridair25: "Madrid Air 25",
  flyuio: "Fly UIO",
  skyconnect: "Sky Connect",
  americanfly: "American Fly"
};

export class CompanyFlightSearchController {
  private companyId: string;
  private view?: ReturnType<typeof CompanyFlightSearchView>;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  mount(app: HTMLElement) {
    console.log("[CompanyFlightSearchController] Iniciando para aerolínea:", this.companyId);

    const companyName = COMPANY_NAMES[this.companyId] || "Aerolínea";

    // Initial empty view
    this.view = CompanyFlightSearchView(
      this.companyId,
      companyName,
      [],
      this.handleAdd.bind(this),
      this.handleFilter.bind(this),
      this.handleBack.bind(this)
    );
    
    app.innerHTML = "";
    app.appendChild(this.view);

    // Show loading
    this.view.showLoading();

    // Load initial results (no filters)
    this.loadFlights({});
  }

  private async loadFlights(filters: FlightFilters) {
    try {
      console.log(`[CompanyFlightSearchController] ====== INICIO CARGA ======`);
      console.log(`[CompanyFlightSearchController] Aerolínea: ${this.companyId}`);
      console.log(`[CompanyFlightSearchController] Filtros:`, JSON.stringify(filters));
      
      let results: SearchResult[] = [];

      // Llamar al servicio correspondiente según la aerolínea
      switch (this.companyId) {
        case "skyandes":
          console.log(`[CompanyFlightSearchController] Llamando a searchSkyAndes...`);
          results = await searchService.searchSkyAndes(filters);
          break;
        default:
          console.log(`[CompanyFlightSearchController] ⚠️ Aerolínea ${this.companyId} no implementada`);
          results = [];
      }
      
      console.log(`[CompanyFlightSearchController] ✅ Respuesta recibida: ${results.length} resultados`);
      
      // Update view
      if (this.view) {
        this.view.paint(results);
        
        if (results.length === 0) {
          console.log(`[CompanyFlightSearchController] Sin resultados - mostrando toast`);
          showToast("toast-info");
        } else {
          console.log(`[CompanyFlightSearchController] ✅ ${results.length} vuelos mostrados`);
        }
      }
      
    } catch (error: any) {
      console.error("[CompanyFlightSearchController] ❌ ERROR:");
      console.error("[CompanyFlightSearchController] Mensaje:", error?.message);
      console.error("[CompanyFlightSearchController] Stack:", error?.stack);
      
      showToast("toast-danger");
      if (this.view) {
        this.view.paint([]);
      }
    }
  }

  private handleAdd(result: SearchResult) {
    console.log("[CompanyFlightSearchController] Añadir al carrito:", result);
    showToast("toast-success");
    // TODO: Implementar carrito
  }

  private handleFilter(filters: FlightFilters) {
    console.log("[CompanyFlightSearchController] Filtrar con:", filters);
    this.loadFlights(filters);
  }

  private handleBack() {
    console.log("[CompanyFlightSearchController] Volver a lista de aerolíneas");
    window.location.hash = "#/flights";
  }
}
