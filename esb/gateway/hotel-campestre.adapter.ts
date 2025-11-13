// Hotel Campestre SOAP Adapter
// Servicio 13 - Hotel
// Endpoint: https://hotelcampestre-erdgb0cvedd7asb9.canadacentral-01.azurewebsites.net/WS_Integracion.asmx
// WSDL: https://hotelcampestre-erdgb0cvedd7asb9.canadacentral-01.azurewebsites.net/WS_Integracion.asmx?wsdl

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Servicio DTO
 */
export interface ServicioDTO {
  Id: number;
  Tipo: string;
  Nombre: string;
  Ciudad: string;
  Precio: number;
  Descripcion: string;
  Disponible: boolean;
}

// ============================================================================
// SOAP Adapter
// ============================================================================

export class HotelCampestreSoapAdapter extends SoapClient {
  constructor(endpoint: EndpointConfig) {
    super(endpoint);
  }

  /**
   * Construir sobre SOAP (ASMX style)
   */
  private buildSoapEnvelope(body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * 1. BUSCAR SERVICIOS
   */
  async buscarServicios(tipo: string, precioMin: number, precioMax: number): Promise<ServicioDTO[]> {
    const soapBody = `
      <BuscarServicios xmlns="http://hotelcampestre.com/integracion">
        <tipo>${tipo}</tipo>
        <precioMin>${precioMin}</precioMin>
        <precioMax>${precioMax}</precioMax>
      </BuscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://hotelcampestre.com/integracion/BuscarServicios'
    );

    return this.parseServiciosList(response);
  }

  /**
   * 2. VERIFICAR DISPONIBILIDAD
   */
  async verificarDisponibilidad(servicioId: number, inicio: string, fin: string): Promise<boolean> {
    const soapBody = `
      <VerificarDisponibilidad xmlns="http://hotelcampestre.com/integracion">
        <servicioId>${servicioId}</servicioId>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
      </VerificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://hotelcampestre.com/integracion/VerificarDisponibilidad'
    );

    const result = this.getTextContent(response.documentElement, 'VerificarDisponibilidadResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 3. COTIZAR RESERVA
   */
  async cotizarReserva(precioNoche: number, noches: number, impuesto: number): Promise<number> {
    const soapBody = `
      <CotizarReserva xmlns="http://hotelcampestre.com/integracion">
        <precioNoche>${precioNoche}</precioNoche>
        <noches>${noches}</noches>
        <impuesto>${impuesto}</impuesto>
      </CotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://hotelcampestre.com/integracion/CotizarReserva'
    );

    const result = this.getTextContent(response.documentElement, 'CotizarReservaResult');
    return parseFloat(result || '0');
  }

  /**
   * 4. CREAR PRE-RESERVA
   */
  async crearPreReserva(
    cliente: string,
    servicioId: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<string> {
    const soapBody = `
      <CrearPreReserva xmlns="http://hotelcampestre.com/integracion">
        <cliente>${cliente}</cliente>
        <servicioId>${servicioId}</servicioId>
        <fechaInicio>${fechaInicio}</fechaInicio>
        <fechaFin>${fechaFin}</fechaFin>
      </CrearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://hotelcampestre.com/integracion/CrearPreReserva'
    );

    return this.getTextContent(response.documentElement, 'CrearPreReservaResult') || '';
  }

  /**
   * 5. CONFIRMAR RESERVA
   */
  async confirmarReserva(preReservaId: number, metodoPago: string, monto: number): Promise<string> {
    const soapBody = `
      <ConfirmarReserva xmlns="http://hotelcampestre.com/integracion">
        <preReservaId>${preReservaId}</preReservaId>
        <metodoPago>${metodoPago}</metodoPago>
        <monto>${monto}</monto>
      </ConfirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://hotelcampestre.com/integracion/ConfirmarReserva'
    );

    return this.getTextContent(response.documentElement, 'ConfirmarReservaResult') || '';
  }

  /**
   * 6. CANCELAR RESERVA
   */
  async cancelarReservaIntegracion(bookingId: number, motivo: string): Promise<string> {
    const soapBody = `
      <CancelarReservaIntegracion xmlns="http://hotelcampestre.com/integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </CancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://hotelcampestre.com/integracion/CancelarReservaIntegracion'
    );

    return this.getTextContent(response.documentElement, 'CancelarReservaIntegracionResult') || '';
  }

  // ============================================================================
  // Parser Methods
  // ============================================================================

  /**
   * Parsear lista de servicios
   */
  private parseServiciosList(doc: Document): ServicioDTO[] {
    const servicios: ServicioDTO[] = [];
    const servicioElements = doc.getElementsByTagName('ServicioDTO');

    for (let i = 0; i < servicioElements.length; i++) {
      const element = servicioElements[i];
      servicios.push({
        Id: parseInt(this.getTextContent(element, 'Id') || '0'),
        Tipo: this.getTextContent(element, 'Tipo') || '',
        Nombre: this.getTextContent(element, 'Nombre') || '',
        Ciudad: this.getTextContent(element, 'Ciudad') || '',
        Precio: parseFloat(this.getTextContent(element, 'Precio') || '0'),
        Descripcion: this.getTextContent(element, 'Descripcion') || '',
        Disponible: this.getTextContent(element, 'Disponible')?.toLowerCase() === 'true'
      });
    }

    return servicios;
  }

  /**
   * Obtener contenido de texto de un elemento hijo
   */
  private getTextContent(parent: Element, tagName: string): string | undefined {
    const elements = parent.getElementsByTagName(tagName);
    if (elements.length > 0) {
      const text = elements[0].textContent;
      return text && text.trim() !== '' ? text : undefined;
    }
    return undefined;
  }
}
