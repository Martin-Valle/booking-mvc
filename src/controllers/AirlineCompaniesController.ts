import { AirlineCompaniesView } from "../views/AirlineCompaniesView";

export class AirlineCompaniesController {
  private view = AirlineCompaniesView();
  mount(container: HTMLElement) {
    container.innerHTML = '';
    container.appendChild(this.view);
  }
}
