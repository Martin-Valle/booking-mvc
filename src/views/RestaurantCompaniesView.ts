/**
 * Vista de Selección de Restaurantes
 */

const RESTAURANT_COMPANIES = [
  { id: "saborandino", name: "Sabor Andino", status: "100%", functional: true, count: 30, description: "Restaurante con 30 mesas disponibles - Guayaquil. Ubicaciones: Terraza, Interior, Afuera, VIP" },
  { id: "elcangrejofeliz", name: "El Cangrejo Feliz", status: "100%", functional: true, count: 5, description: "Restaurante con 5 mesas - Guayaquil. Especialidad en mariscos. Ubicaciones: Interior y Exterior" },
  { id: "sanctumcortejo", name: "Sanctum Cortejo", status: "100%", functional: true, count: 25, description: "Restaurante elegante con 25 mesas - Madrid. Alta cocina europea. Ubicaciones: Interior y Exterior" },
  { id: "sietemares", name: "7 Mares Restaurant", status: "100%", functional: true, count: 4, description: "🐟 Restaurante especializado en mariscos - Guayaquil. 4 tipos de mesas: Interior, Exterior, VIP Interior y VIP Exterior" },
  { id: "restaurantgh", name: "Restaurant GH", status: "100%", functional: true, count: 12, description: "Restaurantes gourmet y alta cocina" },
  { id: "madrfood", name: "MadrFood", status: "75%", functional: false, count: 20, description: "Comida española tradicional" },
  { id: "foodkm25", name: "Food KM25", status: "62.5%", functional: false, count: 25, description: "Restaurantes en zona metropolitana" },
  { id: "cuencafood", name: "Cuenca Food", status: "50%", functional: false, count: 15, description: "Gastronomía ecuatoriana" }
];

export function RestaurantCompaniesView() {
  const section = document.createElement("section");
  section.className = "py-5 bg-light";
  
  section.innerHTML = `
    <div class="container">
      <div class="text-center mb-5">
        <h1 class="display-4 fw-bold mb-3">🍽️ Restaurantes</h1>
        <p class="lead text-muted">Selecciona un servicio de restaurantes</p>
      </div>

      <div class="row g-4">
        ${RESTAURANT_COMPANIES.map(c => `
          <div class="col-md-6">
            <div class="card h-100 shadow-sm ${!c.functional ? 'opacity-75' : ''}" 
                 data-id="${c.id}" style="cursor: ${c.functional ? 'pointer' : 'not-allowed'}">
              <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                  <h3 class="h5">${c.name}</h3>
                  <span class="badge ${c.functional ? 'bg-success' : 'bg-warning'}">${c.status}</span>
                </div>
                <p class="text-muted small mb-2">${c.description}</p>
                <p class="text-muted">${c.count} restaurantes disponibles</p>
                <button class="btn btn-primary w-100 ${!c.functional ? 'disabled' : ''}" ${!c.functional ? 'disabled' : ''}>
                  Ver Restaurantes
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  setTimeout(() => {
    RESTAURANT_COMPANIES.filter(c => c.functional).forEach(c => {
      const card = section.querySelector(`[data-id="${c.id}"]`);
      card?.addEventListener('click', () => window.location.hash = `#/restaurants/${c.id}`);
    });
  }, 0);

  return section;
}
