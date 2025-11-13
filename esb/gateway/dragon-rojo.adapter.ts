/**
 * Dragon Rojo SOAP Service Adapter
 * Service 17 - Restaurant Service
 * Endpoint: http://dragonrojo.runasp.net/WS_IntegracionRestaurante.asmx
 * Namespace: http://dragonrojo.ec/Integracion
 * Type: ASMX Restaurant Service
 * Operations: 7
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface ServicioDTO {
  IdServicio: number;
  Nombre: string;
  Tipo: string;
  Ciudad: string;
  Precio: string;
  Clasificacion: string;
  Descripcion: string;
  Politicas: string;
  Reglas: string;
  ImagenURL: string;
}

export interface ItemDetalleDTO {
  Nombre: string;
  Cantidad: number;
  PrecioUnitario: number;
  PrecioTotal: number;
}

export interface CotizacionDTO {
  Total: number;
  Breakdown: ItemDetalleDTO[];
}

export interface PreReservaDTO {
  PreBookingId: string;
  ExpiraEn: string; // DateTime ISO format
}

export interface ConfirmacionDTO {
  BookingId: string;
  Estado: string;
}

export interface CancelacionDTO {
  Cancelacion: boolean;
}

export interface DisponibilidadDTO {
  Disponible: boolean;
  Mensaje: string;
}

// ==================== Adapter ====================

export class DragonRojoSoapAdapter extends SoapClient {
  constructor(endpoint: EndpointConfig) {
    super(endpoint);
  }

  /**
   * Build SOAP 1.1 Envelope (ASMX style)
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
   * 1. buscarServicios - Búsqueda unificada por filtros
   */
  async buscarServicios(filtros: string): Promise<ServicioDTO[]> {
    const soapBody = `
      <buscarServicios xmlns="http://dragonrojo.ec/Integracion">
        <filtros>${filtros}</filtros>
      </buscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/buscarServicios');
    return this.parseServiciosList(response);
  }

  /**
   * 2. obtenerDetalleServicio - Detalle completo del servicio
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ServicioDTO> {
    const soapBody = `
      <obtenerDetalleServicio xmlns="http://dragonrojo.ec/Integracion">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/obtenerDetalleServicio');
    return this.parseServicio(response);
  }

  /**
   * 3. verificarDisponibilidad - Valida cupo/stock por fechas
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<DisponibilidadDTO> {
    const soapBody = `
      <verificarDisponibilidad xmlns="http://dragonrojo.ec/Integracion">
        <sku>${sku}</sku>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/verificarDisponibilidad');
    return this.parseDisponibilidad(response);
  }

  /**
   * 4. cotizarReserva - Calcula precio total con impuestos
   */
  async cotizarReserva(items: ItemDetalleDTO[]): Promise<CotizacionDTO> {
    const itemsXml = items.map(item => `
      <ItemDetalle>
        <Nombre>${item.Nombre}</Nombre>
        <Cantidad>${item.Cantidad}</Cantidad>
        <PrecioUnitario>${item.PrecioUnitario}</PrecioUnitario>
        <PrecioTotal>${item.PrecioTotal}</PrecioTotal>
      </ItemDetalle>
    `).join('');

    const soapBody = `
      <cotizarReserva xmlns="http://dragonrojo.ec/Integracion">
        <items>
          ${itemsXml}
        </items>
      </cotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/cotizarReserva');
    return this.parseCotizacion(response);
  }

  /**
   * 5. crearPreReserva - Bloquea disponibilidad temporalmente
   */
  async crearPreReserva(
    itinerario: string,
    cliente: string,
    holdMinutes: number,
    idemKey: string
  ): Promise<PreReservaDTO> {
    const soapBody = `
      <crearPreReserva xmlns="http://dragonrojo.ec/Integracion">
        <itinerario>${itinerario}</itinerario>
        <cliente>${cliente}</cliente>
        <holdMinutes>${holdMinutes}</holdMinutes>
        <idemKey>${idemKey}</idemKey>
      </crearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/crearPreReserva');
    return this.parsePreReserva(response);
  }

  /**
   * 6. confirmarReserva - Confirma y emite la reserva
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: string
  ): Promise<ConfirmacionDTO> {
    const soapBody = `
      <confirmarReserva xmlns="http://dragonrojo.ec/Integracion">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>${datosPago}</datosPago>
      </confirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/confirmarReserva');
    return this.parseConfirmacion(response);
  }

  /**
   * 7. cancelarReservaIntegracion - Cancela con reglas tarifarias
   */
  async cancelarReservaIntegracion(
    bookingId: string,
    motivo: string
  ): Promise<CancelacionDTO> {
    const soapBody = `
      <cancelarReservaIntegracion xmlns="http://dragonrojo.ec/Integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://dragonrojo.ec/Integracion/cancelarReservaIntegracion');
    return this.parseCancelacion(response);
  }

  // ==================== Parsers ====================

  private parseServiciosList(doc: Document): ServicioDTO[] {
    const servicios: ServicioDTO[] = [];
    const nodes = doc.getElementsByTagName('ServicioDTO');

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      servicios.push(this.parseServicioNode(node));
    }

    return servicios;
  }

  private parseServicio(doc: Document): ServicioDTO {
    const node = doc.getElementsByTagName('obtenerDetalleServicioResult')[0];
    return this.parseServicioNode(node);
  }

  private parseServicioNode(node: Element): ServicioDTO {
    return {
      IdServicio: parseInt(this.getChildText(node, 'IdServicio')) || 0,
      Nombre: this.getChildText(node, 'Nombre'),
      Tipo: this.getChildText(node, 'Tipo'),
      Ciudad: this.getChildText(node, 'Ciudad'),
      Precio: this.getChildText(node, 'Precio'),
      Clasificacion: this.getChildText(node, 'Clasificacion'),
      Descripcion: this.getChildText(node, 'Descripcion'),
      Politicas: this.getChildText(node, 'Politicas'),
      Reglas: this.getChildText(node, 'Reglas'),
      ImagenURL: this.getChildText(node, 'ImagenURL')
    };
  }

  private parseDisponibilidad(doc: Document): DisponibilidadDTO {
    return {
      Disponible: this.getNodeText(doc, 'Disponible').toLowerCase() === 'true',
      Mensaje: this.getNodeText(doc, 'Mensaje')
    };
  }

  private parseCotizacion(doc: Document): CotizacionDTO {
    const items: ItemDetalleDTO[] = [];
    const itemNodes = doc.getElementsByTagName('ItemDetalle');

    for (let i = 0; i < itemNodes.length; i++) {
      const node = itemNodes[i];
      items.push({
        Nombre: this.getChildText(node, 'Nombre'),
        Cantidad: parseInt(this.getChildText(node, 'Cantidad')) || 0,
        PrecioUnitario: parseFloat(this.getChildText(node, 'PrecioUnitario')) || 0,
        PrecioTotal: parseFloat(this.getChildText(node, 'PrecioTotal')) || 0
      });
    }

    return {
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0,
      Breakdown: items
    };
  }

  private parsePreReserva(doc: Document): PreReservaDTO {
    return {
      PreBookingId: this.getNodeText(doc, 'PreBookingId'),
      ExpiraEn: this.getNodeText(doc, 'ExpiraEn')
    };
  }

  private parseConfirmacion(doc: Document): ConfirmacionDTO {
    return {
      BookingId: this.getNodeText(doc, 'BookingId'),
      Estado: this.getNodeText(doc, 'Estado')
    };
  }

  private parseCancelacion(doc: Document): CancelacionDTO {
    return {
      Cancelacion: this.getNodeText(doc, 'Cancelacion').toLowerCase() === 'true'
    };
  }

  /**
   * Helper: Get text content from child node
   */
  private getChildText(parent: Element, tagName: string): string {
    const child = parent.getElementsByTagName(tagName)[0];
    return child?.textContent || '';
  }
}
