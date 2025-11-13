import { RestaurantCompaniesView } from "../views/RestaurantCompaniesView";

export class RestaurantCompaniesController {
  private view = RestaurantCompaniesView();
  mount(container: HTMLElement) {
    container.innerHTML = '';
    container.appendChild(this.view);
  }
}
