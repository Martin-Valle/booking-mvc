/**
 * Vista de Empresas de Arriendo de Autos
 * Muestra todas las empresas disponibles para alquiler de vehículos
 */

export interface CarCompany {
  id: string;
  name: string;
  description: string;
  status: string; // "100%", "75%", etc.
  functional: boolean;
  logo?: string;
  vehicles?: number;
}

export function CarCompaniesView(
  companies: CarCompany[],
  onSelectCompany: (companyId: string) => void
) {
  const section = document.createElement("section");
  section.className = "py-4";
  section.innerHTML = `
    <div class="container">
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="display-5 fw-bold">
            <i class="bi bi-car-front-fill text-primary"></i> Arriendo de Autos
          </h1>
          <p class="lead text-muted">
            Selecciona la empresa de tu preferencia para buscar vehículos disponibles
          </p>
        </div>
      </div>

      <div class="row g-4" id="companiesGrid">
        <!-- Companies cards will be inserted here -->
      </div>
    </div>
  `;

  const grid = section.querySelector("#companiesGrid")! as HTMLElement;

  function paint(list: CarCompany[]) {
    if (!list.length) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="text-center text-muted py-5">
            <i class="bi bi-car-front" style="font-size: 4rem;"></i>
            <p class="mt-3">No hay empresas de autos disponibles en este momento.</p>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = "";
    list.forEach(company => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4";
      
      const statusColor = company.functional ? "success" : "warning";
      const statusIcon = company.functional ? "check-circle-fill" : "exclamation-triangle-fill";
      
      col.innerHTML = `
        <div class="card h-100 shadow-sm hover-shadow company-card" style="cursor: pointer; transition: transform 0.2s;">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 class="card-title mb-1">${company.name}</h4>
                <p class="text-muted small mb-0">
                  <i class="bi bi-building"></i> Empresa de alquiler
                </p>
              </div>
              <span class="badge bg-${statusColor}">
                <i class="bi bi-${statusIcon}"></i> ${company.status}
              </span>
            </div>

            <p class="card-text text-secondary">
              ${company.description}
            </p>

            ${company.vehicles ? `
              <div class="mb-3">
                <span class="badge bg-light text-dark">
                  <i class="bi bi-car-front"></i> ${company.vehicles} vehículos disponibles
                </span>
              </div>
            ` : ''}

            <div class="d-grid">
              <button class="btn btn-primary btn-select">
                <i class="bi bi-search"></i> Ver Vehículos
              </button>
            </div>
          </div>
        </div>
      `;

      // Hover effect
      const card = col.querySelector(".company-card") as HTMLElement;
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-5px)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
      });

      // Click handler
      col.querySelector(".btn-select")?.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectCompany(company.id);
      });

      grid.appendChild(col);
    });
  }

  // Initial paint
  paint(companies);

  // Expose methods
  (section as any).paint = paint;

  return section as any;
}
