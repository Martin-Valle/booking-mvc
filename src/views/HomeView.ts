import { SearchBar } from "../components/SearchBar";

export function HomeView(onSearch: (q: string) => void) {
  const el = document.createElement("section");
  el.innerHTML = `
    <section class="hero">
      <div class="container">
        <h1 class="display-5 fw-bold">Reserva hoteles, autos y vuelos en un solo pago</h1>
        <p class="lead">Mejores precios, una experiencia unificada.</p>
        <div id="search-mount" class="mt-3"></div>
      </div>
    </section>

    <section class="py-4">
      <div class="container">
        <h3 class="mb-3">Recomendado para ti</h3>
        <div id="home-grid" class="row g-3"></div>
      </div>
    </section>
  `;

  // Monta el buscador en el hero
  el.querySelector("#search-mount")!.appendChild(SearchBar(onSearch));

  // Devolvemos el root y el mount del grid
  return {
    el,
    gridMount: el.querySelector("#home-grid") as HTMLElement,
  };
}
