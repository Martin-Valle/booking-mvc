import type { Restaurant } from "../models/types";

export function RestaurantDetailView(r: Restaurant) {
  const el = document.createElement("section");
  el.className = "container py-4";
  el.innerHTML = `
    <h2 class="mb-3">${r.name}</h2>
    <div class="row g-4">
      <div class="col-md-6">
        <div class="bg-light d-flex align-items-center justify-content-center" style="height:300px;overflow:hidden">
          ${r.photo ? `<img src="${r.photo}" alt="${r.name}" style="max-height:100%">` : "Sin imagen"}
        </div>
      </div>
      <div class="col-md-6">
        <div class="mb-2 text-muted">${r.city}</div>
        <div class="mb-2">
          <span class="badge text-bg-success me-2">${r.rating.toFixed(1)}</span>
          ${(r.cuisineTags ?? []).map(t=>`<span class="badge text-bg-secondary me-1">${t}</span>`).join("")}
        </div>
        <div class="fs-5 fw-semibold mb-3">$${r.pricePerPerson} por persona</div>
        <p class="text-muted">Haz tu reserva con un solo clic. Ideal para tu viaje con UniBooking.</p>
        <button id="add" class="btn btn-primary">Agregar al carrito</button>
      </div>
    </div>
  `;
  return el;
}
