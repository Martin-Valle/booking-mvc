/**
 * Vista de Selección de Cadenas Hoteleras
 * Muestra un catálogo de todas las cadenas de hoteles disponibles
 */

interface HotelCompany {
  id: string;
  name: string;
  description: string;
  status: string;
  functional: boolean;
  hotelCount: number;
}

const HOTEL_COMPANIES: HotelCompany[] = [
  {
    id: "hotelcr",
    name: "Hotel CR",
    description: "Cadena hotelera costarricense con hoteles en todo el país",
    status: "100%",
    functional: true,
    hotelCount: 5
  },
  {
    id: "cuencahotels",
    name: "Cuenca Hotels",
    description: "Hoteles y alojamiento en la ciudad de Cuenca, Ecuador",
    status: "87.5%",
    functional: false,
    hotelCount: 8
  },
  {
    id: "madrid25",
    name: "Madrid Hotels 25",
    description: "Red de hoteles en Madrid y alrededores",
    status: "75%",
    functional: false,
    hotelCount: 12
  },
  {
    id: "km25madrid",
    name: "KM25 Madrid Hotels",
    description: "Hotel premium en Madrid con 5 estrellas. Servicios de alta calidad",
    status: "100%",
    functional: true,
    hotelCount: 1
  },
  {
    id: "petfriendly",
    name: "🐾 Pet Friendly Hotels",
    description: "Hoteles que aceptan mascotas. Servicios especiales para tus compañeros peludos",
    status: "50%",
    functional: false,
    hotelCount: 6
  },
  {
    id: "weworkhub",
    name: "WeWorkHub Cuenca",
    description: "Hotel integrado con sistema de reservas. Habitaciones disponibles en tiempo real",
    status: "85%",
    functional: true,
    hotelCount: 8 // Habitaciones disponibles
  },
  {
    id: "hotelperros",
    name: "🐕 Hotel Perros (Pet Hotel)",
    description: "Hospedaje canino especializado. Servicios por tamaño: PEQUEÑO, MEDIANO, GRANDE. ¡Cuida a tu mejor amigo!",
    status: "100%",
    functional: true,
    hotelCount: 3 // Tipos de servicio por tamaño
  },
  {
    id: "hoteluio",
    name: "🏔️ Hotel UIO",
    description: "Hoteles en Ecuador con generación de facturas electrónicas (SRI). Quito, Guayaquil y más ciudades.",
    status: "100%",
    functional: true,
    hotelCount: 3
  },
  {
    id: "hotelboutique",
    name: "🗼 Hotel Boutique Paris",
    description: "Hotel boutique de lujo en París. Habitaciones con amenities premium y desayuno incluido.",
    status: "100%",
    functional: true,
    hotelCount: 5
  }
];

export function HotelCompaniesView() {
  const section = document.createElement("section");
  section.className = "py-5 bg-light";
  
  section.innerHTML = `
    <div class="container">
      <!-- Header -->
      <div class="text-center mb-5">
        <h1 class="display-4 fw-bold mb-3">🏨 Cadenas Hoteleras</h1>
        <p class="lead text-muted">
          Selecciona una cadena hotelera para buscar alojamiento
        </p>
      </div>

      <!-- Companies Grid -->
      <div class="row g-4" id="hotelCompaniesGrid">
        ${HOTEL_COMPANIES.map(company => `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm hotel-company-card ${!company.functional ? 'opacity-75' : ''}" 
                 data-company-id="${company.id}"
                 style="cursor: ${company.functional ? 'pointer' : 'not-allowed'}; transition: all 0.3s;">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h3 class="h5 mb-0">${company.name}</h3>
                  <span class="badge ${company.functional ? 'bg-success' : 'bg-warning'}">
                    ${company.status}
                  </span>
                </div>
                
                <p class="text-muted mb-3">${company.description}</p>
                
                <div class="mt-auto">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <small class="text-muted">
                      <i class="bi bi-building"></i> ${company.hotelCount} hoteles
                    </small>
                    ${company.functional 
                      ? '<small class="text-success"><i class="bi bi-check-circle-fill"></i> Disponible</small>'
                      : '<small class="text-warning"><i class="bi bi-tools"></i> En desarrollo</small>'
                    }
                  </div>
                  
                  <button class="btn btn-primary w-100 ${!company.functional ? 'disabled' : ''}"
                          ${!company.functional ? 'disabled' : ''}>
                    <i class="bi bi-search"></i> Ver Hoteles
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Info Card -->
      <div class="card mt-5 border-info">
        <div class="card-body">
          <h5 class="card-title">
            <i class="bi bi-info-circle text-info"></i> Información
          </h5>
          <p class="card-text mb-0">
            Las cadenas marcadas como "En desarrollo" están siendo integradas. 
            Solo las cadenas con estado 100% están completamente funcionales.
          </p>
        </div>
      </div>
    </div>
  `;

  // Agregar event listeners
  setTimeout(() => {
    const cards = section.querySelectorAll('.hotel-company-card');
    cards.forEach(card => {
      const companyId = card.getAttribute('data-company-id');
      const company = HOTEL_COMPANIES.find(c => c.id === companyId);
      
      if (company?.functional) {
        card.addEventListener('click', () => {
          window.location.hash = `#/hotels/${companyId}`;
        });
        
        // Hover effect
        card.addEventListener('mouseenter', () => {
          (card as HTMLElement).style.transform = 'translateY(-5px)';
          (card as HTMLElement).style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
          (card as HTMLElement).style.transform = 'translateY(0)';
          (card as HTMLElement).style.boxShadow = '';
        });
      }
    });
  }, 0);

  return section;
}
