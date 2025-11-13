/**
 * Backend Cuenca SOAP Service Adapter
 * Service 22 - Backend Cuenca (Tour Packages)
 * Endpoint: http://backend-cuenca.onrender.com/WS_Integracion.asmx
 * Namespace: urn:cuenca.integracion
 * Type: SOAP Tour Package Service
 * Operations: 7
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface FiltrosDto {
  minPrecio?: number;
  maxPrecio?: number;
}

export interface ServicioDto {
  id: string;
  name: string;
  adultPrice: number;
  childPrice: number;
  currency: string;
  durationDays: number;
  agencyName: string;
  imageUrl: string;
  description: string;
  stock: number;
}

export interface ItemCotizaDto {
  codigo: string;
  adultos: number;
  ninos: number;
}

export interface CotizacionDto {
  total: string;
  breakdown: string;
}

export interface PreReservaDto {
  preBookingId: string;
  expiraEn: string;
}

export interface ConfirmacionDto {
  bookingId: string;
  estado: string;
}

// ==================== Adapter ====================

export class BackendCuencaSoapAdapter extends SoapClient {
  constructor(endpoint: EndpointConfig) {
    super(endpoint);
  }

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
   * 1. Buscar Servicios (Tour Packages)
   */
  async buscarServicios(filtros?: FiltrosDto): Promise<ServicioDto[]> {
    // IMPORTANT: Service expects filtros element even if empty
    let filtrosContent = '';
    if (filtros) {
      if (filtros.minPrecio !== undefined) filtrosContent += `<minPrecio>${filtros.minPrecio}</minPrecio>`;
      if (filtros.maxPrecio !== undefined) filtrosContent += `<maxPrecio>${filtros.maxPrecio}</maxPrecio>`;
    }

    const soapBody = `
      <buscarServiciosRequest xmlns="urn:cuenca.integracion">
        <filtros>${filtrosContent}</filtros>
      </buscarServiciosRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/buscarServicios');
    return this.parseServicioList(response);
  }

  /**
   * 2. Obtener Detalle Servicio
   */
  async obtenerDetalleServicio(idServicio: string): Promise<ServicioDto | null> {
    const soapBody = `
      <obtenerDetalleServicioRequest xmlns="urn:cuenca.integracion">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicioRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/obtenerDetalleServicio');
    return this.parseServicio(response);
  }

  /**
   * 3. Verificar Disponibilidad
   */
  async verificarDisponibilidad(
    sku: string,
    inicio: string | undefined,
    fin: string | undefined,
    unidades: number
  ): Promise<boolean> {
    const soapBody = `
      <verificarDisponibilidadRequest xmlns="urn:cuenca.integracion">
        <sku>${sku}</sku>
        ${inicio ? `<inicio>${inicio}</inicio>` : ''}
        ${fin ? `<fin>${fin}</fin>` : ''}
        <unidades>${unidades}</unidades>
      </verificarDisponibilidadRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/verificarDisponibilidad');
    
    const ok = this.getNodeText(response, 'ok');
    return ok.toLowerCase() === 'true';
  }

  /**
   * 4. Cotizar Reserva
   */
  async cotizarReserva(items: ItemCotizaDto[]): Promise<CotizacionDto> {
    const itemsXml = items.map(item => `
      <item xmlns="urn:cuenca.integracion">
        <codigo>${item.codigo}</codigo>
        <adultos>${item.adultos}</adultos>
        <ninos>${item.ninos}</ninos>
      </item>
    `).join('');

    const soapBody = `
      <cotizarReservaRequest xmlns="urn:cuenca.integracion">
        ${itemsXml}
      </cotizarReservaRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/cotizarReserva');
    
    return {
      total: this.getNodeText(response, 'total'),
      breakdown: this.getNodeText(response, 'breakdown')
    };
  }

  /**
   * 5. Crear Pre-Reserva
   */
  async crearPreReserva(
    itinerario?: string,
    cliente?: string,
    holdMinutes?: number,
    idemKey?: string
  ): Promise<PreReservaDto> {
    const soapBody = `
      <crearPreReservaRequest xmlns="urn:cuenca.integracion">
        ${itinerario ? `<itinerario>${itinerario}</itinerario>` : ''}
        ${cliente ? `<cliente>${cliente}</cliente>` : ''}
        ${holdMinutes ? `<holdMinutes>${holdMinutes}</holdMinutes>` : ''}
        ${idemKey ? `<idemKey>${idemKey}</idemKey>` : ''}
      </crearPreReservaRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/crearPreReserva');
    
    return {
      preBookingId: this.getNodeText(response, 'preBookingId'),
      expiraEn: this.getNodeText(response, 'expiraEn')
    };
  }

  /**
   * 6. Confirmar Reserva
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago?: string,
    datosPago?: string
  ): Promise<ConfirmacionDto> {
    const soapBody = `
      <confirmarReservaRequest xmlns="urn:cuenca.integracion">
        <preBookingId>${preBookingId}</preBookingId>
        ${metodoPago ? `<metodoPago>${metodoPago}</metodoPago>` : ''}
        ${datosPago ? `<datosPago>${datosPago}</datosPago>` : ''}
      </confirmarReservaRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/confirmarReserva');
    
    return {
      bookingId: this.getNodeText(response, 'bookingId'),
      estado: this.getNodeText(response, 'estado')
    };
  }

  /**
   * 7. Cancelar Reserva
   */
  async cancelarReservaIntegracion(bookingId: string, motivo?: string): Promise<boolean> {
    const soapBody = `
      <cancelarReservaIntegracionRequest xmlns="urn:cuenca.integracion">
        <bookingId>${bookingId}</bookingId>
        ${motivo ? `<motivo>${motivo}</motivo>` : ''}
      </cancelarReservaIntegracionRequest>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'urn:cuenca.integracion/cancelarReservaIntegracion');
    
    const ok = this.getNodeText(response, 'ok');
    return ok.toLowerCase() === 'true';
  }

  // ==================== Parsers ====================

  private parseServicioList(doc: Document): ServicioDto[] {
    const servicios: ServicioDto[] = [];
    const nodes = doc.getElementsByTagName('servicio');

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const servicio = this.parseServicioNode(node);
      if (servicio) {
        servicios.push(servicio);
      }
    }

    return servicios;
  }

  private parseServicio(doc: Document): ServicioDto | null {
    const nodes = doc.getElementsByTagName('servicio');
    if (nodes.length === 0) return null;
    return this.parseServicioNode(nodes[0]);
  }

  private parseServicioNode(node: Element): ServicioDto | null {
    const id = this.getChildText(node, 'id');
    if (!id) return null;

    return {
      id,
      name: this.getChildText(node, 'name'),
      adultPrice: parseFloat(this.getChildText(node, 'adultPrice')) || 0,
      childPrice: parseFloat(this.getChildText(node, 'childPrice')) || 0,
      currency: this.getChildText(node, 'currency'),
      durationDays: parseInt(this.getChildText(node, 'durationDays')) || 0,
      agencyName: this.getChildText(node, 'agencyName'),
      imageUrl: this.getChildText(node, 'imageUrl'),
      description: this.getChildText(node, 'description'),
      stock: parseInt(this.getChildText(node, 'stock')) || 0
    };
  }

  private getChildText(parent: Element, tagName: string): string {
    const child = parent.getElementsByTagName(tagName)[0];
    return child?.textContent || '';
  }
}
