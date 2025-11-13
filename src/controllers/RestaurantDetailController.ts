import { RestaurantDetailView } from "../views/RestaurantDetailView";
import { showToast } from "../core/toast";
import { add } from "../services/cart.service";
import { getRestaurantById } from "../services/adapters/restaurant.adapter";

export async function RestaurantDetailController() {
  const mount = document.getElementById("view")!;
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = params.get("id") || "1";

  // Loader
  mount.innerHTML = `
    <div class="container py-5 text-center">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3 text-muted">Cargando información del restaurante...</p>
    </div>`;

  try {
    const restaurant = await getRestaurantById(id);
    
    if (!restaurant) {
      mount.innerHTML = `
        <div class="container py-5 text-center">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle fs-1"></i>
            <h4 class="mt-3">Restaurante no encontrado</h4>
            <p>El restaurante solicitado no existe o no está disponible.</p>
            <a href="#/results" class="btn btn-warning">
              <i class="bi bi-arrow-left"></i> Volver a resultados
            </a>
          </div>
        </div>`;
      return;
    }

    mount.innerHTML = "";
    
    const view = RestaurantDetailView(restaurant, () => {
      add({
        kind: "restaurant",
        id: restaurant.id,
        title: restaurant.name,
        subtitle: `${restaurant.cuisine} • ${restaurant.city}`,
        qty: 1,
        price: restaurant.price,
        photo: restaurant.photo
      });
      showToast();
    });
    
    mount.appendChild(view);
  } catch (error) {
    console.error("Error al cargar restaurante:", error);
    mount.innerHTML = `
      <div class="container py-5 text-center">
        <div class="alert alert-danger">
          <i class="bi bi-x-circle fs-1"></i>
          <h4 class="mt-3">Error al cargar</h4>
          <p>No se pudo cargar la información del restaurante. Por favor, intenta nuevamente.</p>
          <button onclick="location.reload()" class="btn btn-danger">
            <i class="bi bi-arrow-clockwise"></i> Reintentar
          </button>
        </div>
      </div>`;
  }
}
