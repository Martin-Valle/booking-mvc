/**
 * Vista de Búsqueda de Mesas de Restaurante por Compañía
 * Interfaz unificada para buscar mesas en cualquier restaurante
 */

import type { SearchResult } from "../models/types";

const COMPANY_NAMES: Record<string, string> = {
  saborandino: "Sabor Andino",
  elcangrejofeliz: "El Cangrejo Feliz",
  sanctumcortejo: "Sanctum Cortejo",
  sietemares: "7 Mares",
  restaurantgh: "Restaurant GH",
  madrfood: "MadrFood",
  foodkm25: "Food KM25",
  cuencafood: "Cuenca Food"
};

export function CompanyRestaurantSearchView(companyId: string) {
  const section = document.createElement("section");
  section.className = "py-4";
  
  const companyName = COMPANY_NAMES[companyId] || "Restaurante";
  const isSaborAndino = companyId === "saborandino";
  const isElCangrejoFeliz = companyId === "elcangrejofeliz";
  const isSanctumCortejo = companyId === "sanctumcortejo";
  const isSieteMares = companyId === "sietemares";
  const showFilters = isSaborAndino || isElCangrejoFeliz || isSanctumCortejo || isSieteMares;
  
  section.innerHTML = `
    <div class="container">
      <div class="row">
        <!-- Filters Sidebar -->
        <div class="col-lg-3 mb-4">
          <div class="card shadow-sm sticky-top" style="top: 20px;">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0"><i class="bi bi-funnel"></i> Filtros</h5>
            </div>
            <div class="card-body">
              <!-- Back Button -->
              <a href="#/restaurants" class="btn btn-outline-secondary w-100 mb-3">
                <i class="bi bi-arrow-left"></i> Volver a Restaurantes
              </a>

              ${showFilters ? `
              <!-- Ubicación Filter -->
              <div class="mb-3">
                <label class="form-label fw-bold">Ubicación de Mesa</label>
                <select class="form-select" id="ubicacionFilter">
                  <option value="">Todas las ubicaciones</option>
                  ${isSaborAndino ? `
                  <option value="Terraza">🌅 Terraza</option>
                  <option value="Afuera">🏞️ Afuera</option>
                  <option value="Interior">🏠 Interior</option>
                  <option value="VIP">⭐ VIP</option>
                  ` : ''}
                  ${isElCangrejoFeliz ? `
                  <option value="Interior">🏠 Interior</option>
                  <option value="Exterior">🌳 Exterior</option>
                  ` : ''}
                  ${isSanctumCortejo ? `
                  <option value="Interior">🏠 Interior</option>
                  <option value="Exterior">🌳 Exterior</option>
                  ` : ''}
                </select>
              </div>

              <!-- Capacidad Filter -->
              <div class="mb-3">
                <label class="form-label fw-bold">Capacidad (personas)</label>
                <select class="form-select" id="capacidadFilter">
                  <option value="">Cualquier capacidad</option>
                  ${isSaborAndino ? `
                  <option value="2">👥 2 personas</option>
                  <option value="5">👥 5 personas</option>
                  <option value="10">👥 10 personas</option>
                  <option value="12">👥 12 personas</option>
                  ` : ''}
                  ${isElCangrejoFeliz ? `
                  <option value="2">👥 2 personas</option>
                  <option value="4">👥 4 personas</option>
                  <option value="6">👥 6 personas</option>
                  ` : ''}
                  ${isSanctumCortejo ? `
                  <option value="2">👥 2 personas</option>
                  <option value="4">👥 4 personas</option>
                  <option value="6">👥 6 personas</option>
                  ` : ''}
                </select>
              </div>
              ` : ''}

              <!-- Price Range -->
              <div class="mb-3">
                <label class="form-label fw-bold">Precio de Reserva</label>
                <div class="row g-2">
                  <div class="col">
                    <input type="number" class="form-control" id="minPrice" placeholder="Mín" min="0">
                  </div>
                  <div class="col">
                    <input type="number" class="form-control" id="maxPrice" placeholder="Máx" min="0">
                  </div>
                </div>
              </div>

              <!-- Search Button -->
              <button class="btn btn-warning w-100" id="searchBtn">
                <i class="bi bi-search"></i> Buscar Mesas
              </button>

              <!-- Clear Filters -->
              <button class="btn btn-outline-secondary w-100 mt-2" id="clearFiltersBtn">
                <i class="bi bi-x-circle"></i> Limpiar
              </button>
            </div>
          </div>
        </div>

        <!-- Results Area -->
        <div class="col-lg-9">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="mb-1">🍽️ ${companyName}</h2>
              <p class="text-muted mb-0" id="resultsCount">${
                isSaborAndino ? 'Guayaquil - 30 mesas disponibles' : 
                isElCangrejoFeliz ? 'Guayaquil - 5 mesas disponibles (Especialidad en mariscos 🦀)' :
                isSanctumCortejo ? 'Madrid - 25 mesas disponibles (Alta cocina europea 🍷)' :
                isSieteMares ? 'Guayaquil - 4 tipos de mesas: Interior, Exterior, VIP Interior y VIP Exterior 🐟' :
                'Busca mesas disponibles'
              }</p>
            </div>
          </div>

          <!-- Loading Spinner -->
          <div id="loadingSpinner" class="text-center py-5" style="display: none;">
            <div class="spinner-border text-warning" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Buscando mesas...</p>
          </div>

          <!-- Results Grid -->
          <div id="resultsGrid" class="row g-4">
            <!-- Los resultados se insertarán aquí -->
          </div>

          <!-- Empty State -->
          <div id="emptyState" class="text-center py-5" style="display: none;">
            <i class="bi bi-search" style="font-size: 4rem; color: #ccc;"></i>
            <h4 class="mt-3">No se encontraron mesas</h4>
            <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return section;
}

/**
 * Renderiza los resultados de mesas de restaurante
 */
export function renderRestaurantResults(results: SearchResult[], container: HTMLElement) {
  const grid = container.querySelector('#resultsGrid') as HTMLElement;
  const emptyState = container.querySelector('#emptyState') as HTMLElement;
  const resultsCount = container.querySelector('#resultsCount') as HTMLElement;

  if (results.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    resultsCount.textContent = 'No se encontraron mesas';
    return;
  }

  emptyState.style.display = 'none';
  grid.style.display = 'flex';
  resultsCount.textContent = `${results.length} mesa${results.length !== 1 ? 's' : ''} disponible${results.length !== 1 ? 's' : ''}`;

  grid.innerHTML = results.map(result => {
    const restaurant = result.item as any;
    return `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 shadow-sm restaurant-card" style="transition: all 0.3s; cursor: pointer;">
          <img src="${restaurant.photo || '/assets/restaurant-placeholder.jpg'}" class="card-img-top" alt="${restaurant.name}" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title mb-0" style="font-size: 0.95rem;">${restaurant.name}</h5>
              <span class="badge bg-warning text-dark">$${restaurant.price}</span>
            </div>
            <p class="text-muted small mb-2">
              <i class="bi bi-geo-alt-fill"></i> ${restaurant.city}
            </p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="text-warning">
                ${'⭐'.repeat(restaurant.rating || 5)}
              </div>
              <button class="btn btn-sm btn-outline-warning" onclick="window.location.hash='#/restaurant/${restaurant.id}'">
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add hover effect
  setTimeout(() => {
    const cards = grid.querySelectorAll('.restaurant-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        (card as HTMLElement).style.transform = 'translateY(-5px)';
        (card as HTMLElement).style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
      });
      card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'translateY(0)';
        (card as HTMLElement).style.boxShadow = '';
      });
    });
  }, 0);
}
