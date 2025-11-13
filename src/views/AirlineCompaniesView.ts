/**
 * Vista de Selección de Aerolíneas
 */

const AIRLINE_COMPANIES = [
  { id: "skyandes", name: "✈️ SkyAndes", status: "100%", functional: true, routes: 0, description: "Vuelos nacionales en Ecuador (Quito-Guayaquil)" },
  { id: "madridair25", name: "Madrid Air 25", status: "100%", functional: true, routes: 25, description: "Vuelos nacionales e internacionales desde Madrid" },
  { id: "flyuio", name: "Fly UIO", status: "75%", functional: false, routes: 15, description: "Aerolínea ecuatoriana con base en Quito" },
  { id: "skyconnect", name: "Sky Connect", status: "62.5%", functional: false, routes: 30, description: "Conexiones aéreas europeas" },
  { id: "americanfly", name: "American Fly", status: "50%", functional: false, routes: 40, description: "Vuelos transoceánicos" }
];

export function AirlineCompaniesView() {
  const section = document.createElement("section");
  section.className = "py-5 bg-light";
  
  section.innerHTML = `
    <div class="container">
      <div class="text-center mb-5">
        <h1 class="display-4 fw-bold mb-3">✈️ Aerolíneas</h1>
        <p class="lead text-muted">Selecciona una aerolínea para buscar vuelos</p>
      </div>

      <div class="row g-4">
        ${AIRLINE_COMPANIES.map(c => `
          <div class="col-md-6">
            <div class="card h-100 shadow-sm ${!c.functional ? 'opacity-75' : ''}" 
                 data-id="${c.id}" style="cursor: ${c.functional ? 'pointer' : 'not-allowed'}">
              <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                  <h3 class="h5">${c.name}</h3>
                  <span class="badge ${c.functional ? 'bg-success' : 'bg-warning'}">${c.status}</span>
                </div>
                <p class="text-muted small mb-2">${c.description}</p>
                <p class="text-muted">${c.routes} rutas disponibles</p>
                <button class="btn btn-primary w-100 ${!c.functional ? 'disabled' : ''}" ${!c.functional ? 'disabled' : ''}>
                  Ver Vuelos
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  setTimeout(() => {
    AIRLINE_COMPANIES.filter(c => c.functional).forEach(c => {
      const card = section.querySelector(`[data-id="${c.id}"]`);
      card?.addEventListener('click', () => window.location.hash = `#/flights/${c.id}`);
    });
  }, 0);

  return section;
}
