/**
 * Controlador de Búsqueda de Hoteles por Cadena
 */

import { CompanyHotelSearchView, renderHotelResults } from "../views/CompanyHotelSearchView";
import * as searchService from "../services/search.service";
import type { SearchResult } from "../models/types";
import { showToast } from "../core/toast";

export class CompanyHotelSearchController {
  private companyId: string;
  private view: HTMLElement;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.view = CompanyHotelSearchView(companyId);
  }

  mount(container: HTMLElement) {
    container.innerHTML = '';
    container.appendChild(this.view);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial search
    this.loadHotels({});
  }

  private setupEventListeners() {
    const searchBtn = this.view.querySelector('#searchBtn');
    const clearBtn = this.view.querySelector('#clearFiltersBtn');
    const cityFilter = this.view.querySelector('#cityFilter');
    const starsFilter = this.view.querySelector('#starsFilter');
    const minPrice = this.view.querySelector('#minPrice');
    const maxPrice = this.view.querySelector('#maxPrice');

    searchBtn?.addEventListener('click', () => {
      const filters = this.getFilters();
      this.loadHotels(filters);
    });

    clearBtn?.addEventListener('click', () => {
      if (cityFilter) (cityFilter as HTMLSelectElement).value = '';
      if (starsFilter) (starsFilter as HTMLSelectElement).value = '';
      if (minPrice) (minPrice as HTMLInputElement).value = '';
      if (maxPrice) (maxPrice as HTMLInputElement).value = '';
      this.loadHotels({});
    });

    // Enter key in price inputs
    [minPrice, maxPrice].forEach(input => {
      input?.addEventListener('keypress', (e: any) => {
        if (e.key === 'Enter') {
          const filters = this.getFilters();
          this.loadHotels(filters);
        }
      });
    });
  }

  private getFilters() {
    const cityFilter = this.view.querySelector('#cityFilter') as HTMLSelectElement;
    const starsFilter = this.view.querySelector('#starsFilter') as HTMLSelectElement;
    const minPrice = this.view.querySelector('#minPrice') as HTMLInputElement;
    const maxPrice = this.view.querySelector('#maxPrice') as HTMLInputElement;

    return {
      ciudad: cityFilter?.value || undefined,
      estrellas: starsFilter?.value ? parseInt(starsFilter.value) : undefined,
      minPrecio: minPrice?.value ? parseFloat(minPrice.value) : undefined,
      maxPrecio: maxPrice?.value ? parseFloat(maxPrice.value) : undefined
    };
  }

  private async loadHotels(filters: any) {
    const loadingSpinner = this.view.querySelector('#loadingSpinner') as HTMLElement;
    const resultsGrid = this.view.querySelector('#resultsGrid') as HTMLElement;
    const emptyState = this.view.querySelector('#emptyState') as HTMLElement;

    try {
      // Show loading
      loadingSpinner.style.display = 'block';
      resultsGrid.style.display = 'none';
      emptyState.style.display = 'none';

      console.log(`[CompanyHotelSearchController] Buscando hoteles en ${this.companyId}...`);
      
      let results: SearchResult[] = [];

      // Route to appropriate service based on company
      switch (this.companyId) {
        case 'hotelcr':
          results = await searchService.searchHotelCR(filters);
          break;
        case 'cuencahotels':
          results = await searchService.searchCuencaHotels(filters);
          break;
        case 'madrid25':
          results = await searchService.searchMadrid25(filters);
          break;
        case 'km25madrid':
          results = await searchService.searchKM25Madrid(filters);
          break;
        case 'petfriendly':
          results = await searchService.searchPetFriendly(filters);
          break;
        case 'weworkhub':
          results = await searchService.searchWeWorkHub(filters);
          break;
        case 'hotelperros':
          results = await searchService.searchHotelPerros(filters);
          break;
        case 'hoteluio':
          results = await searchService.searchHotelUIO(filters);
          break;
        case 'hotelboutique':
          results = await searchService.searchHotelBoutique(filters);
          break;
        default:
          console.error(`[CompanyHotelSearchController] Compañía no soportada: ${this.companyId}`);
      }

      console.log(`[CompanyHotelSearchController] ${results.length} hoteles encontrados`);

      // Hide loading
      loadingSpinner.style.display = 'none';

      // Render results
      renderHotelResults(results, this.view);

      if (results.length > 0) {
        showToast('toast-success');
      }

    } catch (error: any) {
      console.error('[CompanyHotelSearchController] Error:', error);
      loadingSpinner.style.display = 'none';
      emptyState.style.display = 'block';
      showToast('toast-error');
      alert(`Error al buscar hoteles:\n\n${error?.message || 'Error desconocido'}`);
    }
  }
}
