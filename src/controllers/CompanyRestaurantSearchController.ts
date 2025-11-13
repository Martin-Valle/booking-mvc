/**
 * Controlador de Búsqueda de Mesas de Restaurante por Compañía
 */

import { CompanyRestaurantSearchView, renderRestaurantResults } from "../views/CompanyRestaurantSearchView";
import * as searchService from "../services/search.service";
import type { SearchResult } from "../models/types";
import { showToast } from "../core/toast";

export class CompanyRestaurantSearchController {
  private companyId: string;
  private view: HTMLElement;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.view = CompanyRestaurantSearchView(companyId);
  }

  mount(container: HTMLElement) {
    container.innerHTML = '';
    container.appendChild(this.view);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial search - mostrar todas las mesas
    this.loadTables({});
  }

  private setupEventListeners() {
    const searchBtn = this.view.querySelector('#searchBtn');
    const clearBtn = this.view.querySelector('#clearFiltersBtn');
    const ubicacionFilter = this.view.querySelector('#ubicacionFilter');
    const capacidadFilter = this.view.querySelector('#capacidadFilter');
    const minPrice = this.view.querySelector('#minPrice');
    const maxPrice = this.view.querySelector('#maxPrice');

    searchBtn?.addEventListener('click', () => {
      const filters = this.getFilters();
      this.loadTables(filters);
    });

    clearBtn?.addEventListener('click', () => {
      if (ubicacionFilter) (ubicacionFilter as HTMLSelectElement).value = '';
      if (capacidadFilter) (capacidadFilter as HTMLSelectElement).value = '';
      if (minPrice) (minPrice as HTMLInputElement).value = '';
      if (maxPrice) (maxPrice as HTMLInputElement).value = '';
      this.loadTables({});
    });

    // Enter key in price inputs
    [minPrice, maxPrice].forEach(input => {
      input?.addEventListener('keypress', (e: any) => {
        if (e.key === 'Enter') {
          const filters = this.getFilters();
          this.loadTables(filters);
        }
      });
    });
  }

  private getFilters() {
    const ubicacionFilter = this.view.querySelector('#ubicacionFilter') as HTMLSelectElement;
    const capacidadFilter = this.view.querySelector('#capacidadFilter') as HTMLSelectElement;
    const minPrice = this.view.querySelector('#minPrice') as HTMLInputElement;
    const maxPrice = this.view.querySelector('#maxPrice') as HTMLInputElement;

    return {
      ubicacion: ubicacionFilter?.value || undefined,
      capacidad: capacidadFilter?.value ? parseInt(capacidadFilter.value) : undefined,
      minPrecio: minPrice?.value ? parseFloat(minPrice.value) : undefined,
      maxPrecio: maxPrice?.value ? parseFloat(maxPrice.value) : undefined
    };
  }

  private async loadTables(filters: any) {
    const loadingSpinner = this.view.querySelector('#loadingSpinner') as HTMLElement;
    const resultsGrid = this.view.querySelector('#resultsGrid') as HTMLElement;
    const emptyState = this.view.querySelector('#emptyState') as HTMLElement;

    try {
      // Show loading
      loadingSpinner.style.display = 'block';
      resultsGrid.style.display = 'none';
      emptyState.style.display = 'none';

      console.log(`[CompanyRestaurantSearchController] Buscando mesas en ${this.companyId}...`);
      
      let results: SearchResult[] = [];

      // Route to appropriate service based on company
      switch (this.companyId) {
        case 'saborandino':
          results = await searchService.searchSaborAndino(filters);
          break;
        case 'elcangrejofeliz':
          results = await searchService.searchElCangrejoFeliz(filters);
          break;
        case 'sanctumcortejo':
          results = await searchService.searchSanctumCortejo(filters);
          break;
        case 'sietemares':
          results = await searchService.searchSieteMares(filters);
          break;
        case 'restaurantgh':
          results = await searchService.searchRestaurantGH(filters);
          break;
        case 'madrfood':
          results = await searchService.searchMadrFood(filters);
          break;
        case 'foodkm25':
          results = await searchService.searchFoodKM25(filters);
          break;
        case 'cuencafood':
          results = await searchService.searchCuencaFood(filters);
          break;
        default:
          console.error(`[CompanyRestaurantSearchController] Compañía no soportada: ${this.companyId}`);
      }

      console.log(`[CompanyRestaurantSearchController] ${results.length} mesas encontradas`);

      // Hide loading
      loadingSpinner.style.display = 'none';

      // Render results
      renderRestaurantResults(results, this.view);

      if (results.length > 0) {
        showToast('toast-success');
      }

    } catch (error: any) {
      console.error('[CompanyRestaurantSearchController] Error:', error);
      loadingSpinner.style.display = 'none';
      emptyState.style.display = 'block';
      showToast('toast-error');
      alert(`Error al buscar mesas:\n\n${error?.message || 'Error desconocido'}`);
    }
  }
}
