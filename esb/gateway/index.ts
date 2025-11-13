/**
 * ESB - Gateway - Índice de Adaptadores SOAP
 */

export { SoapClient } from './soap-client';
export { HotelSoapAdapter, hotelSoapAdapter } from './hotel.adapter';
export { FlightSoapAdapter, flightSoapAdapter } from './flight.adapter';
export { CarSoapAdapter, carSoapAdapter } from './car.adapter';
export { RestaurantSoapAdapter, restaurantSoapAdapter } from './restaurant.adapter';

// Exportar tipos específicos del restaurante (sin conflictos)
export type {
  ServicioDTO,
  ItemDetalle
} from './restaurant.adapter';
