/**
 * Controlador de Selección de Cadenas Hoteleras
 */

import { HotelCompaniesView } from "../views/HotelCompaniesView";

export class HotelCompaniesController {
  private view = HotelCompaniesView();

  mount(container: HTMLElement) {
    container.innerHTML = '';
    container.appendChild(this.view);
  }
}
