/**
 * ESB - Adapter SOAP para Servicio de Restaurante
 * Implementación específica para el WS de sanctumcortejo.ec
 */

import { SoapClient } from './soap-client';
import { defaultConfig } from '../utils/config';

/**
 * DTO para ServicioDTO del WS de restaurante
 */
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

/**
 * DTO para crear pre-reserva
 */
export interface PreReservaRequest {
  itinerario: string;
  cliente: string;
  holdMinutes: number;
  idemKey: string;
}

export interface PreReservaResponse {
  PreBookingId: string;
  ExpiraEn: string; // dateTime
}

/**
 * DTO para confirmar reserva
 */
export interface ConfirmarReservaRequest {
  preBookingId: string;
  metodoPago: string;
  datosPago: string;
}

export interface ConfirmarReservaResponse {
  BookingId: string;
  Estado: string;
}

/**
 * DTO para verificar disponibilidad
 */
export interface VerificarDisponibilidadRequest {
  sku: number;
  inicio: string; // dateTime
  fin: string; // dateTime
  unidades: number;
}

export interface DisponibilidadResponse {
  Disponible: boolean;
  Mensaje: string;
}

/**
 * DTO para cotizar reserva
 */
export interface ItemDetalle {
  Nombre: string;
  Cantidad: number;
  PrecioUnitario: number;
  PrecioTotal: number;
}

export interface CotizacionResponse {
  Total: number;
  Breakdown: ItemDetalle[];
}

/**
 * DTO para cancelar reserva
 */
export interface CancelarReservaRequest {
  bookingId: string;
  motivo: string;
}

export interface CancelarReservaResponse {
  Cancelacion: boolean;
}

/**
 * Adapter SOAP para el servicio de restaurante
 */
export class RestaurantSoapAdapter extends SoapClient {
  private namespace: string;

  constructor() {
    const config = defaultConfig.endpoints.restaurant;
    super(config);
    this.namespace = config.namespace;
  }

  /**
   * Busca servicios según filtros (búsqueda unificada)
   */
  async buscarServicios(filtros: string): Promise<ServicioDTO[]> {
    const soapAction = `${this.namespace}/buscarServicios`;
    
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <buscarServicios xmlns="${this.namespace}">
      <filtros>${this.escapeXml(filtros)}</filtros>
    </buscarServicios>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parseServiciosResponse(doc);
  }

  /**
   * Obtiene el detalle completo de un servicio
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ServicioDTO> {
    const soapAction = `${this.namespace}/obtenerDetalleServicio`;
    
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <obtenerDetalleServicio xmlns="${this.namespace}">
      <idServicio>${idServicio}</idServicio>
    </obtenerDetalleServicio>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parseDetalleServicioResponse(doc);
  }

  /**
   * Verifica disponibilidad de un servicio
   */
  async verificarDisponibilidad(request: VerificarDisponibilidadRequest): Promise<DisponibilidadResponse> {
    const soapAction = `${this.namespace}/verificarDisponibilidad`;
    
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <verificarDisponibilidad xmlns="${this.namespace}">
      <sku>${request.sku}</sku>
      <inicio>${request.inicio}</inicio>
      <fin>${request.fin}</fin>
      <unidades>${request.unidades}</unidades>
    </verificarDisponibilidad>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parseDisponibilidadResponse(doc);
  }

  /**
   * Cotiza una reserva (calcula precio total con impuestos/fees)
   */
  async cotizarReserva(items: ItemDetalle[]): Promise<CotizacionResponse> {
    const soapAction = `${this.namespace}/cotizarReserva`;
    
    const itemsXml = items.map(item => `
        <ItemDetalle>
          <Nombre>${this.escapeXml(item.Nombre)}</Nombre>
          <Cantidad>${item.Cantidad}</Cantidad>
          <PrecioUnitario>${item.PrecioUnitario}</PrecioUnitario>
          <PrecioTotal>${item.PrecioTotal}</PrecioTotal>
        </ItemDetalle>`).join('');

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <cotizarReserva xmlns="${this.namespace}">
      <items>${itemsXml}
      </items>
    </cotizarReserva>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parseCotizacionResponse(doc);
  }

  /**
   * Crea una pre-reserva (bloquea disponibilidad temporalmente)
   */
  async crearPreReserva(request: PreReservaRequest): Promise<PreReservaResponse> {
    const soapAction = `${this.namespace}/crearPreReserva`;
    
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <crearPreReserva xmlns="${this.namespace}">
      <itinerario>${this.escapeXml(request.itinerario)}</itinerario>
      <cliente>${this.escapeXml(request.cliente)}</cliente>
      <holdMinutes>${request.holdMinutes}</holdMinutes>
      <idemKey>${this.escapeXml(request.idemKey)}</idemKey>
    </crearPreReserva>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parsePreReservaResponse(doc);
  }

  /**
   * Confirma y emite la reserva
   */
  async confirmarReserva(request: ConfirmarReservaRequest): Promise<ConfirmarReservaResponse> {
    const soapAction = `${this.namespace}/confirmarReserva`;
    
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <confirmarReserva xmlns="${this.namespace}">
      <preBookingId>${this.escapeXml(request.preBookingId)}</preBookingId>
      <metodoPago>${this.escapeXml(request.metodoPago)}</metodoPago>
      <datosPago>${this.escapeXml(request.datosPago)}</datosPago>
    </confirmarReserva>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parseConfirmarReservaResponse(doc);
  }

  /**
   * Cancela una reserva con reglas tarifarias
   */
  async cancelarReservaIntegracion(request: CancelarReservaRequest): Promise<CancelarReservaResponse> {
    const soapAction = `${this.namespace}/cancelarReservaIntegracion`;
    
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <cancelarReservaIntegracion xmlns="${this.namespace}">
      <bookingId>${this.escapeXml(request.bookingId)}</bookingId>
      <motivo>${this.escapeXml(request.motivo)}</motivo>
    </cancelarReservaIntegracion>
  </soap:Body>
</soap:Envelope>`;

    const doc = await this.call(soapEnvelope, soapAction);
    return this.parseCancelarReservaResponse(doc);
  }

  // ========== Métodos de Parseo ==========

  private parseServiciosResponse(doc: Document): ServicioDTO[] {
    const servicios: ServicioDTO[] = [];
    const servicioNodes = doc.getElementsByTagName('ServicioDTO');

    for (let i = 0; i < servicioNodes.length; i++) {
      const node = servicioNodes[i];
      servicios.push({
        IdServicio: this.getNumberFromNode(node, 'IdServicio'),
        Nombre: this.getTextFromNode(node, 'Nombre'),
        Tipo: this.getTextFromNode(node, 'Tipo'),
        Ciudad: this.getTextFromNode(node, 'Ciudad'),
        Precio: this.getTextFromNode(node, 'Precio'),
        Clasificacion: this.getTextFromNode(node, 'Clasificacion'),
        Descripcion: this.getTextFromNode(node, 'Descripcion'),
        Politicas: this.getTextFromNode(node, 'Politicas'),
        Reglas: this.getTextFromNode(node, 'Reglas'),
        ImagenURL: this.getTextFromNode(node, 'ImagenURL')
      });
    }

    return servicios;
  }

  private parseDetalleServicioResponse(doc: Document): ServicioDTO {
    const result = doc.getElementsByTagName('obtenerDetalleServicioResult')[0];
    
    return {
      IdServicio: this.getNumberFromNode(result, 'IdServicio'),
      Nombre: this.getTextFromNode(result, 'Nombre'),
      Tipo: this.getTextFromNode(result, 'Tipo'),
      Ciudad: this.getTextFromNode(result, 'Ciudad'),
      Precio: this.getTextFromNode(result, 'Precio'),
      Clasificacion: this.getTextFromNode(result, 'Clasificacion'),
      Descripcion: this.getTextFromNode(result, 'Descripcion'),
      Politicas: this.getTextFromNode(result, 'Politicas'),
      Reglas: this.getTextFromNode(result, 'Reglas'),
      ImagenURL: this.getTextFromNode(result, 'ImagenURL')
    };
  }

  private parseDisponibilidadResponse(doc: Document): DisponibilidadResponse {
    const result = doc.getElementsByTagName('verificarDisponibilidadResult')[0];
    
    return {
      Disponible: this.getTextFromNode(result, 'Disponible').toLowerCase() === 'true',
      Mensaje: this.getTextFromNode(result, 'Mensaje')
    };
  }

  private parseCotizacionResponse(doc: Document): CotizacionResponse {
    const result = doc.getElementsByTagName('cotizarReservaResult')[0];
    const breakdown: ItemDetalle[] = [];
    const itemNodes = result.getElementsByTagName('ItemDetalle');

    for (let i = 0; i < itemNodes.length; i++) {
      const node = itemNodes[i];
      breakdown.push({
        Nombre: this.getTextFromNode(node, 'Nombre'),
        Cantidad: this.getNumberFromNode(node, 'Cantidad'),
        PrecioUnitario: this.getNumberFromNode(node, 'PrecioUnitario'),
        PrecioTotal: this.getNumberFromNode(node, 'PrecioTotal')
      });
    }

    return {
      Total: this.getNumberFromNode(result, 'Total'),
      Breakdown: breakdown
    };
  }

  private parsePreReservaResponse(doc: Document): PreReservaResponse {
    const result = doc.getElementsByTagName('crearPreReservaResult')[0];
    
    return {
      PreBookingId: this.getTextFromNode(result, 'PreBookingId'),
      ExpiraEn: this.getTextFromNode(result, 'ExpiraEn')
    };
  }

  private parseConfirmarReservaResponse(doc: Document): ConfirmarReservaResponse {
    const result = doc.getElementsByTagName('confirmarReservaResult')[0];
    
    return {
      BookingId: this.getTextFromNode(result, 'BookingId'),
      Estado: this.getTextFromNode(result, 'Estado')
    };
  }

  private parseCancelarReservaResponse(doc: Document): CancelarReservaResponse {
    const result = doc.getElementsByTagName('cancelarReservaIntegracionResult')[0];
    
    return {
      Cancelacion: this.getTextFromNode(result, 'Cancelacion').toLowerCase() === 'true'
    };
  }

  // ========== Utilidades ==========

  private getTextFromNode(parentNode: Element, tagName: string): string {
    const nodes = parentNode.getElementsByTagName(tagName);
    return nodes.length > 0 && nodes[0].textContent ? nodes[0].textContent.trim() : '';
  }

  private getNumberFromNode(parentNode: Element, tagName: string): number {
    const text = this.getTextFromNode(parentNode, tagName);
    return text ? parseFloat(text) : 0;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Instancia singleton del adapter de restaurante
 */
export const restaurantSoapAdapter = new RestaurantSoapAdapter();
