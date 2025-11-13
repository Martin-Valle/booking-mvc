/**
 * ✈️ Adaptador SOAP para SkyAndes - Servicio de Vuelos
 * Endpoint: http://skyandesintegracion.runasp.net/WS_Integracion.asmx
 * Namespace: http://skyandes.com/integracion/
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';

// ==================== DTOs ====================

export interface DTO_Flight {
  FlightId: number;
  OriginId: number;
  DestinationId: number;
  Airline: string;
  FlightNumber: string;
  DepartureTime: Date;
  ArrivalTime: Date;
  Duration: string;
  CancellationPolicy: string;
  CabinClass: string;
  AircraftId: number;
}

export interface DTO_PreReserva {
  PreBookingId: number;
  ExpiraEn: Date;
}

export interface DTO_Reserva {
  BookingId: number;
  Estado: string;
}

export interface DTO_Cotizacion {
  Total: number;
  Impuestos: number;
  BasePrice: number;
  PromoDiscount: number;
}

// ==================== Adaptador SOAP ====================

export class SkyAndesFlightSoapAdapter extends SoapClient {
  
  /**
   * 1️⃣ Busca vuelos disponibles por origen, destino, fecha y cabina
   */
  async buscarServicios(
    originId: number,
    destinationId: number,
    fecha: Date,
    cabinClass: string
  ): Promise<DTO_Flight[]> {
    const body = `
      <buscarServicios xmlns="http://skyandes.com/integracion/">
        <OriginId>${originId}</OriginId>
        <DestinationId>${destinationId}</DestinationId>
        <Fecha>${fecha.toISOString()}</Fecha>
        <CabinClass>${cabinClass}</CabinClass>
      </buscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/buscarServicios"');
    
    console.log('[SkyAndes] Raw XML Response length:', rawResponse.length);
    return this.parseFlightListFromXml(rawResponse);
  }

  /**
   * 2️⃣ Obtiene el detalle completo de un vuelo
   */
  async obtenerDetalleServicio(idServicio: number): Promise<DTO_Flight> {
    const body = `
      <obtenerDetalleServicio xmlns="http://skyandes.com/integracion/">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/obtenerDetalleServicio"');
    
    console.log('[SkyAndes] Raw XML Response length:', rawResponse.length);
    const flights = this.parseFlightListFromXml(rawResponse);
    if (flights.length === 0) throw new Error('No se encontró el resultado del servicio');
    
    return flights[0];
  }

  /**
   * 3️⃣ Valida la disponibilidad de asientos para un vuelo
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<boolean> {
    const body = `
      <verificarDisponibilidad xmlns="http://skyandes.com/integracion/">
        <sku>${sku}</sku>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/verificarDisponibilidad"');
    
    const result = this.extractXmlValue(rawResponse, 'verificarDisponibilidadResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 4️⃣ Calcula el total estimado (impuestos y promo) para una reserva
   */
  async cotizarReserva(flightId: number, passengers: number): Promise<DTO_Cotizacion> {
    const body = `
      <cotizarReserva xmlns="http://skyandes.com/integracion/">
        <flightId>${flightId}</flightId>
        <passengers>${passengers}</passengers>
      </cotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/cotizarReserva"');
    
    return {
      Total: parseFloat(this.extractXmlValue(rawResponse, 'Total') || '0'),
      Impuestos: parseFloat(this.extractXmlValue(rawResponse, 'Impuestos') || '0'),
      BasePrice: parseFloat(this.extractXmlValue(rawResponse, 'BasePrice') || '0'),
      PromoDiscount: parseFloat(this.extractXmlValue(rawResponse, 'PromoDiscount') || '0')
    };
  }

  /**
   * 5️⃣ Crea una pre-reserva temporal (estado Pending)
   */
  async crearPreReserva(
    userId: number,
    flightId: number,
    holdMinutes: number,
    idemKey: string
  ): Promise<DTO_PreReserva> {
    const body = `
      <crearPreReserva xmlns="http://skyandes.com/integracion/">
        <userId>${userId}</userId>
        <flightId>${flightId}</flightId>
        <holdMinutes>${holdMinutes}</holdMinutes>
        <idemKey>${idemKey}</idemKey>
      </crearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/crearPreReserva"');
    
    return {
      PreBookingId: parseInt(this.extractXmlValue(rawResponse, 'PreBookingId') || '0'),
      ExpiraEn: new Date(this.extractXmlValue(rawResponse, 'ExpiraEn') || '')
    };
  }

  /**
   * 6️⃣ Confirma y emite la reserva (registra pago y cambia estado)
   */
  async confirmarReserva(
    preBookingId: number,
    metodoPago: string,
    monto: number,
    datosPago: string
  ): Promise<DTO_Reserva> {
    const body = `
      <confirmarReserva xmlns="http://skyandes.com/integracion/">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <monto>${monto}</monto>
        <datosPago>${datosPago}</datosPago>
      </confirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/confirmarReserva"');
    
    return {
      BookingId: parseInt(this.extractXmlValue(rawResponse, 'BookingId') || '0'),
      Estado: this.extractXmlValue(rawResponse, 'Estado') || ''
    };
  }

  /**
   * 7️⃣ Cancela la reserva y marca el pago como Refunded
   */
  async cancelarReserva(bookingId: number, motivo: string): Promise<boolean> {
    const body = `
      <cancelarReservaIntegracion xmlns="http://skyandes.com/integracion/">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://skyandes.com/integracion/cancelarReservaIntegracion"');
    
    const result = this.extractXmlValue(rawResponse, 'cancelarReservaIntegracionResult');
    return result?.toLowerCase() === 'true';
  }

  // ==================== Helpers de Parseo ====================

  /**
   * Parsea lista de vuelos desde XML usando regex
   */
  private parseFlightListFromXml(xmlString: string): DTO_Flight[] {
    const flights: DTO_Flight[] = [];
    const regex = /<DTOFlight>([\s\S]*?)<\/DTOFlight>/g;
    const matches = xmlString.matchAll(regex);

    for (const match of matches) {
      const flightXml = match[1];
      
      const flight: DTO_Flight = {
        FlightId: parseInt(this.extractXmlValue(flightXml, 'FlightId') || '0'),
        OriginId: parseInt(this.extractXmlValue(flightXml, 'OriginId') || '0'),
        DestinationId: parseInt(this.extractXmlValue(flightXml, 'DestinationId') || '0'),
        Airline: this.extractXmlValue(flightXml, 'Airline') || '',
        FlightNumber: this.extractXmlValue(flightXml, 'FlightNumber') || '',
        DepartureTime: new Date(this.extractXmlValue(flightXml, 'DepartureTime') || ''),
        ArrivalTime: new Date(this.extractXmlValue(flightXml, 'ArrivalTime') || ''),
        Duration: this.extractXmlValue(flightXml, 'Duration') || '',
        CancellationPolicy: this.extractXmlValue(flightXml, 'CancellationPolicy') || '',
        CabinClass: this.extractXmlValue(flightXml, 'CabinClass') || '',
        AircraftId: parseInt(this.extractXmlValue(flightXml, 'AircraftId') || '0')
      };

      flights.push(flight);
    }

    console.log(`[SkyAndes] Parsed ${flights.length} flights from XML`);
    return flights;
  }

  /**
   * Extrae el valor de un tag XML usando regex
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }
}
