/**
 * Vista de Búsqueda de Vehículos por Empresa
 * Vista unificada que se adapta según la empresa seleccionada
 */

import type { SearchResult, Car } from "../models/types";
import { fmtUSD } from "../core/money";

export interface CarFilters {
  categoria?: string;
  transmision?: string;
  minPrecio?: number;
  maxPrecio?: number;
  ciudad?: string; // Para Cuenca Car
}

export function CompanyCarSearchView(
  companyId: string,
  companyName: string,
  results: SearchResult[],
  onAdd: (r: SearchResult) => void,
  onFilter: (filters: CarFilters) => void,
  onBack: () => void
) {
  const section = document.createElement("section");
  section.className = "py-4";
  
  // Determinar qué filtros mostrar según la empresa
  const showCityFilter = companyId === "cuencacar";
  // const showAdvancedFilters = companyId === "alquileraugye"; // TODO: Usar cuando se implemente
  
  section.innerHTML = `
    <div class="container">
      <div class="row">
        <!-- Filters Sidebar -->
        <div class="col-lg-3 mb-3" id="filtersSidebar">
          <button class="btn btn-outline-secondary mb-3 w-100" id="backBtn">
            <i class="bi bi-arrow-left"></i> Volver a Empresas
          </button>
          
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-funnel"></i> Filtros
              </h5>
            </div>
            <div class="card-body">
              <form id="filtersForm">
                <!-- Category -->
                <div class="mb-3">
                  <label class="form-label fw-bold">Categoría</label>
                  <select class="form-select" name="categoria">
                    <option value="">Todas</option>
                    <option value="ECONOMY">Economy</option>
                    <option value="COMPACT">Compact</option>
                    <option value="SUV">SUV</option>
                    <option value="LUXURY">Luxury</option>
                    <option value="VAN">Van</option>
                  </select>
                </div>

                <!-- Transmission -->
                <div class="mb-3">
                  <label class="form-label fw-bold">Transmisión</label>
                  <select class="form-select" name="transmision">
                    <option value="">Todas</option>
                    <option value="AT">Automático</option>
                    <option value="MT">Manual</option>
                  </select>
                </div>

                ${showCityFilter ? `
                <!-- City (Cuenca Car specific) -->
                <div class="mb-3">
                  <label class="form-label fw-bold">Ciudad</label>
                  <select class="form-select" name="ciudad">
                    <option value="">Todas</option>
                    <option value="Cuenca">Cuenca</option>
                    <option value="Quito">Quito</option>
                    <option value="Guayaquil">Guayaquil</option>
                  </select>
                </div>
                ` : ''}

                <!-- Price Range -->
                <div class="mb-3">
                  <label class="form-label fw-bold">Rango de Precio (día)</label>
                  <div class="row g-2">
                    <div class="col-6">
                      <input type="number" class="form-control" name="minPrecio" placeholder="Mín" min="0">
                    </div>
                    <div class="col-6">
                      <input type="number" class="form-control" name="maxPrecio" placeholder="Máx" min="0">
                    </div>
                  </div>
                </div>

                <!-- Buttons -->
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary">
                    <i class="bi bi-search"></i> Aplicar Filtros
                  </button>
                  <button type="button" class="btn btn-outline-secondary" id="clearBtn">
                    <i class="bi bi-x-circle"></i> Limpiar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Results Grid -->
        <div class="col-lg-9">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 class="mb-0">
                <i class="bi bi-car-front-fill text-primary"></i> ${companyName}
              </h2>
              <p class="text-muted mb-0">Vehículos disponibles para alquiler</p>
            </div>
            <span class="badge bg-secondary fs-6" id="countBadge">0 vehículos</span>
          </div>

          <div id="loading" class="text-center py-5 d-none">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Buscando vehículos...</p>
          </div>

          <div class="row" id="grid"></div>
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

  // Paint results
  function paint(list: SearchResult[]) {
    loading.classList.add("d-none");
    countBadge.textContent = `${list.length} vehículos`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="text-center text-muted py-5">
            <i class="bi bi-car-front" style="font-size: 4rem;"></i>
            <p class="mt-3 mb-3">No encontramos vehículos con esos filtros.</p>
            <button class="btn btn-outline-secondary" id="clearF">Limpiar filtros</button>
          </div>
        </div>`;
      grid.querySelector("#clearF")?.addEventListener("click", () => {
        form.reset();
        onFilter({});
      });
      return;
    }

    grid.innerHTML = "";
    list.forEach(r => {
      if (r.kind !== 'car') return;
      const car = r.item as Car;
      
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-xl-4 mb-3";
      
      const card = document.createElement("div");
      card.className = "card h-100 shadow-sm hover-shadow";
      card.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${car.brand} ${car.model}</h5>
            <span class="badge bg-primary">AUTO</span>
          </div>
          <p class="text-muted small mb-2">
            <i class="bi bi-building"></i> ${companyName}
          </p>
          
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
              <div class="h4 mb-0 text-primary">${fmtUSD(car.pricePerDay)}</div>
              <small class="text-muted">por día</small>
            </div>
            <button class="btn btn-outline-primary btn-sm add-btn">
              <i class="bi bi-cart-plus"></i> Agregar
            </button>
          </div>
        </div>
      `;
      
      card.querySelector(".add-btn")?.addEventListener("click", () => onAdd(r));
      col.appendChild(card);
      grid.appendChild(col);
    });
  }

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    loading.classList.remove("d-none");
    grid.innerHTML = "";
    
    const formData = new FormData(form);
    const filters: CarFilters = {};
    
    const categoria = formData.get("categoria")?.toString();
    const transmision = formData.get("transmision")?.toString();
    const ciudad = formData.get("ciudad")?.toString();
    const minPrecio = formData.get("minPrecio")?.toString();
    const maxPrecio = formData.get("maxPrecio")?.toString();
    
    if (categoria) filters.categoria = categoria;
    if (transmision) filters.transmision = transmision;
    if (ciudad) filters.ciudad = ciudad;
    if (minPrecio) filters.minPrecio = parseFloat(minPrecio);
    if (maxPrecio) filters.maxPrecio = parseFloat(maxPrecio);
    
    onFilter(filters);
  });

  // Clear button
  clearBtn.addEventListener("click", () => {
    form.reset();
    loading.classList.remove("d-none");
    grid.innerHTML = "";
    onFilter({});
  });

  // Initial paint
  paint(results);

  // Expose methods
  (section as any).paint = paint;
  (section as any).showLoading = () => {
    loading.classList.remove("d-none");
    grid.innerHTML = "";
  };

  return section as any;
}
