/**
 * Vista de Búsqueda de Hoteles por Cadena
 * Interfaz unificada para buscar hoteles en cualquier cadena hotelera
 */

import type { SearchResult } from "../models/types";

const COMPANY_NAMES: Record<string, string> = {
  hotelcr: "Hotel CR",
  cuencahotels: "Cuenca Hotels",
  madrid25: "Madrid Hotels 25",
  hotelperros: "🐕 Hotel Perros (Pet Hotel)"
};

export function CompanyHotelSearchView(companyId: string) {
  const section = document.createElement("section");
  section.className = "py-4";
  
  const companyName = COMPANY_NAMES[companyId] || "Hoteles";
  const showCityFilter = companyId === "cuencahotels" || companyId === "madrid25";
  
  section.innerHTML = `
    <div class="container">
      <div class="row">
        <!-- Filters Sidebar -->
        <div class="col-lg-3 mb-4">
          <div class="card shadow-sm sticky-top" style="top: 20px;">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-funnel"></i> Filtros</h5>
            </div>
            <div class="card-body">
              <!-- Back Button -->
              <a href="#/hotels" class="btn btn-outline-secondary w-100 mb-3">
                <i class="bi bi-arrow-left"></i> Volver a Cadenas
              </a>

              <!-- City Filter (conditional) -->
              ${showCityFilter ? `
              <div class="mb-3">
                <label class="form-label fw-bold">Ciudad</label>
                <select class="form-select" id="cityFilter">
                  <option value="">Todas las ciudades</option>
                  ${companyId === "cuencahotels" ? `
                    <option value="cuenca">Cuenca</option>
                    <option value="azogues">Azogues</option>
                  ` : `
                    <option value="madrid">Madrid</option>
                    <option value="toledo">Toledo</option>
                  `}
                </select>
              </div>
              ` : ''}

              <!-- Stars Filter -->
              <div class="mb-3">
                <label class="form-label fw-bold">Estrellas</label>
                <select class="form-select" id="starsFilter">
                  <option value="">Todas</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 estrellas)</option>
                  <option value="4">⭐⭐⭐⭐ (4 estrellas)</option>
                  <option value="3">⭐⭐⭐ (3 estrellas)</option>
                </select>
              </div>

              <!-- Price Range -->
              <div class="mb-3">
                <label class="form-label fw-bold">Precio por noche</label>
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
              <button class="btn btn-primary w-100" id="searchBtn">
                <i class="bi bi-search"></i> Buscar
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
              <h2 class="mb-1">🏨 ${companyName}</h2>
              <p class="text-muted mb-0" id="resultsCount">Busca hoteles disponibles</p>
            </div>
          </div>

          <!-- Loading Spinner -->
          <div id="loadingSpinner" class="text-center py-5" style="display: none;">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Buscando hoteles...</p>
          </div>

          <!-- Results Grid -->
          <div id="resultsGrid" class="row g-4">
            <!-- Los resultados se insertarán aquí -->
          </div>

          <!-- Empty State -->
          <div id="emptyState" class="text-center py-5" style="display: none;">
            <i class="bi bi-search" style="font-size: 4rem; color: #ccc;"></i>
            <h4 class="mt-3">No se encontraron hoteles</h4>
            <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return section;
}

/**
 * Renderiza los resultados de hoteles
 */
export function renderHotelResults(results: SearchResult[], container: HTMLElement) {
  const grid = container.querySelector('#resultsGrid') as HTMLElement;
  const emptyState = container.querySelector('#emptyState') as HTMLElement;
  const resultsCount = container.querySelector('#resultsCount') as HTMLElement;

  if (results.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    resultsCount.textContent = 'No se encontraron resultados';
    return;
  }

  emptyState.style.display = 'none';
  grid.style.display = 'flex';
  resultsCount.textContent = `${results.length} hotel${results.length !== 1 ? 'es' : ''} encontrado${results.length !== 1 ? 's' : ''}`;

  grid.innerHTML = results.map(result => {
    const hotel = result.item as any; // Type assertion for flexibility
    return `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 shadow-sm hotel-card" style="transition: all 0.3s; cursor: pointer;">
          <img src="${hotel.photo || '/hotel-placeholder.jpg'}" 
               class="card-img-top" 
               alt="${hotel.name}"
               style="height: 200px; object-fit: cover;"
               onerror="this.src='/hotel-placeholder.jpg'">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${hotel.name}</h5>
            <p class="text-muted small mb-2">
              <i class="bi bi-geo-alt"></i> ${hotel.city}
            </p>
            <div class="mb-2">
              ${generateStars(hotel.rating)}
              <small class="text-muted ms-1">(${hotel.rating})</small>
            </div>
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <small class="text-muted">Desde</small>
                  <div class="h5 mb-0 text-primary">$${hotel.price.toFixed(2)}</div>
                  <small class="text-muted">por noche</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="alert('Función de reserva próximamente')">
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Hover effects
  setTimeout(() => {
    const cards = grid.querySelectorAll('.hotel-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        (card as HTMLElement).style.transform = 'translateY(-5px)';
        (card as HTMLElement).style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      });
      card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'translateY(0)';
        (card as HTMLElement).style.boxShadow = '';
      });
    });
  }, 0);
}

function generateStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '⭐';
  }
  if (hasHalfStar) {
    stars += '½';
  }
  
  return stars;
}
