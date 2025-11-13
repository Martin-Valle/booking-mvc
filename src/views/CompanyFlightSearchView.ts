/**
 * Vista de Búsqueda de Vuelos - SkyAndes
 * Diseño especializado para búsqueda de vuelos
 */

import type { SearchResult } from "../models/types";

export interface FlightFilters {
  originId?: number;
  destinationId?: number;
  fecha?: string;
  cabinClass?: string;
  passengers?: number;
}

// Ciudades disponibles en Ecuador
const CITIES = [
  { id: 1, name: "Quito", code: "UIO", icon: "🏔️" },
  { id: 2, name: "Guayaquil", code: "GYE", icon: "🏖️" },
  { id: 3, name: "Cuenca", code: "CUE", icon: "🏛️" },
  { id: 4, name: "Manta", code: "MEC", icon: "🌊" }
];

export function CompanyFlightSearchView(
  companyId: string,
  companyName: string,
  results: SearchResult[],
  onAdd: (r: SearchResult) => void,
  onFilter: (filters: FlightFilters) => void,
  onBack: () => void
) {
  const section = document.createElement("section");
  section.className = "py-4 bg-light";
  
  const today = new Date().toISOString().split('T')[0];
  
  section.innerHTML = `
    <div class="container">
      <!-- Header con branding de SkyAndes -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card shadow-sm border-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="card-body text-white py-4">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h1 class="mb-2">
                    <i class="bi bi-airplane-fill"></i> ${companyName}
                  </h1>
                  <p class="mb-0 opacity-75">
                    <i class="bi bi-geo-alt"></i> Vuelos nacionales en Ecuador • 
                    <i class="bi bi-calendar-check"></i> Reserva en línea
                  </p>
                </div>
                <button class="btn btn-light" id="backBtn">
                  <i class="bi bi-arrow-left"></i> Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Panel de Búsqueda -->
        <div class="col-lg-12 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-0 py-3">
              <h5 class="mb-0 text-primary">
                <i class="bi bi-search"></i> Buscar Vuelos
              </h5>
            </div>
            <div class="card-body">
              <form id="filtersForm">
                <div class="row g-3">
                  <!-- Origen -->
                  <div class="col-md-3">
                    <label class="form-label fw-bold">
                      <i class="bi bi-geo-alt-fill text-primary"></i> Origen
                    </label>
                    <select class="form-select form-select-lg" name="originId" required>
                      ${CITIES.map(city => `
                        <option value="${city.id}" ${city.id === 1 ? 'selected' : ''}>
                          ${city.icon} ${city.name} (${city.code})
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <!-- Destino -->
                  <div class="col-md-3">
                    <label class="form-label fw-bold">
                      <i class="bi bi-geo-fill text-danger"></i> Destino
                    </label>
                    <select class="form-select form-select-lg" name="destinationId" required>
                      ${CITIES.map(city => `
                        <option value="${city.id}" ${city.id === 2 ? 'selected' : ''}>
                          ${city.icon} ${city.name} (${city.code})
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <!-- Fecha -->
                  <div class="col-md-2">
                    <label class="form-label fw-bold">
                      <i class="bi bi-calendar-event text-success"></i> Fecha
                    </label>
                    <input type="date" class="form-control form-control-lg" name="fecha" 
                           value="${today}" required min="${today}">
                  </div>

                  <!-- Clase -->
                  <div class="col-md-2">
                    <label class="form-label fw-bold">
                      <i class="bi bi-star-fill text-warning"></i> Clase
                    </label>
                    <select class="form-select form-select-lg" name="cabinClass">
                      <option value="Economy" selected>💺 Economy</option>
                      <option value="Business">🎩 Business</option>
                      <option value="First">👑 Primera</option>
                    </select>
                  </div>

                  <!-- Pasajeros -->
                  <div class="col-md-2">
                    <label class="form-label fw-bold">
                      <i class="bi bi-people-fill text-info"></i> Pasajeros
                    </label>
                    <input type="number" class="form-control form-control-lg" name="passengers" 
                           value="1" min="1" max="9">
                  </div>
                </div>

                <!-- Botones -->
                <div class="row mt-4">
                  <div class="col-12">
                    <button type="submit" class="btn btn-primary btn-lg me-2">
                      <i class="bi bi-search"></i> Buscar Vuelos
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-lg" id="clearBtn">
                      <i class="bi bi-x-circle"></i> Limpiar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Resultados -->
        <div class="col-lg-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">
              <i class="bi bi-list-ul"></i> Vuelos Disponibles
            </h4>
            <span class="badge bg-primary fs-6" id="countBadge">0 vuelos</span>
          </div>

          <!-- Loading -->
          <div id="loading" class="text-center py-5 d-none">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted fs-5">Buscando vuelos disponibles...</p>
          </div>

          <!-- Grid de resultados -->
          <div id="grid"></div>
        </div>
      </div>
    </div>`;

  const grid = section.querySelector("#grid")! as HTMLElement;
  const loading = section.querySelector("#loading")! as HTMLElement;
  const countBadge = section.querySelector("#countBadge")! as HTMLElement;
  const form = section.querySelector("#filtersForm")! as HTMLFormElement;
  const clearBtn = section.querySelector("#clearBtn")! as HTMLButtonElement;
  const backBtn = section.querySelector("#backBtn")! as HTMLButtonElement;

  // Back button
  backBtn.addEventListener("click", onBack);

  // Helper para obtener nombre de ciudad
  function getCityName(id: number): string {
    const city = CITIES.find(c => c.id === id);
    return city ? `${city.icon} ${city.name}` : 'N/A';
  }

  // Paint results
  function paint(list: SearchResult[]) {
    loading.classList.add("d-none");
    countBadge.textContent = `${list.length} vuelos`;

    grid.innerHTML = "";
    
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="alert alert-info border-0 shadow-sm text-center py-5">
          <i class="bi bi-airplane fs-1 text-primary mb-3 d-block"></i>
          <h5 class="mb-2">No se encontraron vuelos</h5>
          <p class="text-muted mb-3">No hay vuelos disponibles para esta ruta en la fecha seleccionada.</p>
          <p class="small text-muted">
            <i class="bi bi-lightbulb"></i> 
            Sugerencia: Intenta cambiar la fecha o la ruta de vuelo
          </p>
        </div>`;
      return;
    }

    list.forEach(r => {
      const metadata = r.metadata || {};
      const departureTime = metadata.departureTime 
        ? new Date(metadata.departureTime as string).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) 
        : 'N/A';
      const arrivalTime = metadata.arrivalTime 
        ? new Date(metadata.arrivalTime as string).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) 
        : 'N/A';
      
      const originCity = getCityName(metadata.originId as number || 1);
      const destCity = getCityName(metadata.destinationId as number || 2);
      
      const card = document.createElement("div");
      card.className = "mb-3";
      card.innerHTML = `
        <div class="card border-0 shadow-sm hover-shadow" style="transition: all 0.3s;">
          <div class="card-body p-4">
            <div class="row align-items-center">
              <!-- Información de la aerolínea -->
              <div class="col-lg-2 text-center mb-3 mb-lg-0">
                <div class="d-flex flex-column align-items-center">
                  <div class="bg-primary bg-opacity-10 rounded-circle p-3 mb-2">
                    <i class="bi bi-airplane-fill text-primary" style="font-size: 2rem;"></i>
                  </div>
                  <span class="badge bg-primary px-3 py-2">${metadata.airline || 'SkyAndes'}</span>
                  <p class="fw-bold mb-0 mt-2">${metadata.flightNumber || 'N/A'}</p>
                </div>
              </div>
              
              <!-- Horarios y ruta -->
              <div class="col-lg-6 mb-3 mb-lg-0">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div class="text-center">
                    <h3 class="mb-1 fw-bold">${departureTime}</h3>
                    <p class="text-muted mb-0 small">${originCity}</p>
                    <p class="text-muted mb-0 small">Salida</p>
                  </div>
                  
                  <div class="text-center flex-grow-1 mx-3">
                    <div class="position-relative">
                      <hr class="border-2 border-primary" style="margin: 0.5rem 0;">
                      <i class="bi bi-airplane-fill text-primary position-absolute top-50 start-50 translate-middle bg-white px-2" 
                         style="font-size: 1.5rem;"></i>
                    </div>
                    <p class="text-muted small mb-0 mt-2">
                      <i class="bi bi-clock"></i> ${metadata.duration || 'N/A'}
                    </p>
                  </div>
                  
                  <div class="text-center">
                    <h3 class="mb-1 fw-bold">${arrivalTime}</h3>
                    <p class="text-muted mb-0 small">${destCity}</p>
                    <p class="text-muted mb-0 small">Llegada</p>
                  </div>
                </div>
                
                <div class="d-flex gap-2 flex-wrap">
                  <span class="badge bg-info bg-opacity-10 text-info px-3 py-2">
                    <i class="bi bi-star-fill"></i> ${metadata.cabinClass || 'Economy'}
                  </span>
                  <span class="badge bg-success bg-opacity-10 text-success px-3 py-2">
                    <i class="bi bi-check-circle-fill"></i> Vuelo directo
                  </span>
                </div>
                
                <div class="mt-2">
                  <p class="small text-muted mb-0">
                    <i class="bi bi-info-circle-fill"></i> 
                    ${metadata.cancellationPolicy || 'Consultar política de cancelación'}
                  </p>
                </div>
              </div>
              
              <!-- Precio y acción -->
              <div class="col-lg-4">
                <div class="border-start ps-4 h-100 d-flex flex-column justify-content-center">
                  <div class="text-center text-lg-start mb-3">
                    <p class="text-muted small mb-1">Precio por pasajero desde:</p>
                    <h2 class="text-primary mb-0 fw-bold">
                      $${(r as any).price || 0}
                      <span class="fs-6 text-muted">/persona</span>
                    </h2>
                    <p class="text-muted small mb-0">+ Impuestos y tasas</p>
                  </div>
                  
                  <button class="btn btn-primary btn-lg w-100 addBtn" data-id="${(r as any).id}">
                    <i class="bi bi-cart-plus-fill me-2"></i>
                    Reservar Vuelo
                  </button>
                  
                  <button class="btn btn-outline-secondary btn-sm w-100 mt-2" disabled>
                    <i class="bi bi-info-circle me-1"></i>
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      
      grid.appendChild(card);
    });

    // Add to cart buttons
    grid.querySelectorAll(".addBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.id!;
        const result = list.find(r => (r as any).id === id);
        if (result) onAdd(result);
      });
    });
  }

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const filters: FlightFilters = {
      originId: parseInt(data.get("originId") as string) || 1,
      destinationId: parseInt(data.get("destinationId") as string) || 2,
      fecha: data.get("fecha") as string || today,
      cabinClass: data.get("cabinClass") as string || "Economy",
      passengers: parseInt(data.get("passengers") as string) || 1
    };
    onFilter(filters);
  });

  // Clear filters
  clearBtn.addEventListener("click", () => {
    form.reset();
    // Reset to defaults
    const originSelect = form.querySelector('[name="originId"]') as HTMLSelectElement;
    const destSelect = form.querySelector('[name="destinationId"]') as HTMLSelectElement;
    const dateInput = form.querySelector('[name="fecha"]') as HTMLInputElement;
    const classSelect = form.querySelector('[name="cabinClass"]') as HTMLSelectElement;
    const passengersInput = form.querySelector('[name="passengers"]') as HTMLInputElement;
    
    originSelect.value = "1";
    destSelect.value = "2";
    dateInput.value = today;
    classSelect.value = "Economy";
    passengersInput.value = "1";
    
    onFilter({});
  });

  // Initial paint
  paint(results);

  // Return object with methods
  return Object.assign(section, {
    paint,
    showLoading: () => loading.classList.remove("d-none")
  });
}
