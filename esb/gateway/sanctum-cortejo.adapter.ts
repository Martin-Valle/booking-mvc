/**
 * 🏛️ Adaptador SOAP para Sanctum Cortejo - Restaurante
 * Endpoint: https://sanctumcortejo.runasp.net/Ws_IntegracionRestaurante.asmx
 * Namespace: http://sanctumcortejo.ec/Integracion
 * Ciudad: Madrid
 * Mesas: 25 (2, 4, 6 personas) | Precios: €50 - €150
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';
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
  ImagenURL?: string;
}

export interface DisponibilidadDTO {
  Disponible: boolean;
  Mensaje?: string;
}

export interface ItemDetalle {
  Nombre: string;
  Cantidad: number;
  PrecioUnitario: number;
  PrecioTotal: number;
}

export interface CotizacionDTO {
  Total: number;
  Breakdown: ItemDetalle[];
}

export interface PreReservaDTO {
  PreBookingId: string;
  ExpiraEn: Date;
}

export interface ReservaDTO {
  BookingId: string;
  Estado: string;
}

export interface CancelacionDTO {
  Cancelacion: boolean;
}

// ==================== Adaptador SOAP ====================

export class SanctumCortejoSoapAdapter extends SoapClient {
  
  constructor(endpoint: EndpointConfig) {
    super(endpoint);
  }

  /**
   * 1️⃣ Búsqueda unificada por tipo, ciudad, fechas, precio, amenities, clasificación
   */
  async buscarServicios(filtros?: string): Promise<ServicioDTO[]> {
    const body = `
      <buscarServicios xmlns="http://sanctumcortejo.ec/Integracion">
        <filtros>${filtros || ''}</filtros>
      </buscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    
    // Get raw XML response instead of Document
    const rawResponse = await this.callRaw(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/buscarServicios'
    );

    console.log('[Sanctum Cortejo] 📄 Raw XML Response length:', rawResponse.length);
    
    // Count ServicioDTO elements with regex
    const matches = rawResponse.match(/<ServicioDTO>/g);
    const count = matches ? matches.length : 0;
    console.log('[Sanctum Cortejo] 📊 ServicioDTO elements found:', count);

    return this.parseServiciosListFromXml(rawResponse);
  }

  /**
   * 2️⃣ Detalle completo del servicio (fotos, políticas, reglas)
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ServicioDTO> {
    const body = `
      <obtenerDetalleServicio xmlns="http://sanctumcortejo.ec/Integracion">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/obtenerDetalleServicio'
    );
    
    const resultElement = xml.getElementsByTagName('obtenerDetalleServicioResult')[0];
    if (!resultElement) throw new Error('No se encontró el resultado del servicio');
    
    return this.parseServicioFromElement(resultElement);
  }

  /**
   * 3️⃣ Valida cupo/stock por fechas
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<DisponibilidadDTO> {
    const body = `
      <verificarDisponibilidad xmlns="http://sanctumcortejo.ec/Integracion">
        <sku>${sku}</sku>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/verificarDisponibilidad'
    );
    
    const resultElement = xml.getElementsByTagName('verificarDisponibilidadResult')[0];
    if (!resultElement) throw new Error('No se encontró resultado de disponibilidad');
    
    return {
      Disponible: this.getTagValue(resultElement, 'Disponible') === 'true',
      Mensaje: this.getTagValue(resultElement, 'Mensaje') || undefined
    };
  }

  /**
   * 4️⃣ Calcula precio total (impuestos/fees) para un itinerario
   */
  async cotizarReserva(items: ItemDetalle[]): Promise<CotizacionDTO> {
    // Construir XML de items
    const itemsXml = items.map(item => `
      <ItemDetalle>
        <Nombre>${item.Nombre}</Nombre>
        <Cantidad>${item.Cantidad}</Cantidad>
        <PrecioUnitario>${item.PrecioUnitario}</PrecioUnitario>
        <PrecioTotal>${item.PrecioTotal}</PrecioTotal>
      </ItemDetalle>
    `).join('');

    const body = `
      <cotizarReserva xmlns="http://sanctumcortejo.ec/Integracion">
        <items>
          ${itemsXml}
        </items>
      </cotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/cotizarReserva'
    );
    
    const resultElement = xml.getElementsByTagName('cotizarReservaResult')[0];
    if (!resultElement) throw new Error('No se encontró resultado de cotización');
    
    const total = parseFloat(this.getTagValue(resultElement, 'Total') || '0');
    const breakdownElements = resultElement.getElementsByTagName('ItemDetalle');
    const breakdown: ItemDetalle[] = [];
    
    for (let i = 0; i < breakdownElements.length; i++) {
      const elem = breakdownElements[i];
      breakdown.push({
        Nombre: this.getTagValue(elem, 'Nombre') || '',
        Cantidad: parseInt(this.getTagValue(elem, 'Cantidad') || '0'),
        PrecioUnitario: parseFloat(this.getTagValue(elem, 'PrecioUnitario') || '0'),
        PrecioTotal: parseFloat(this.getTagValue(elem, 'PrecioTotal') || '0')
      });
    }
    
    return { Total: total, Breakdown: breakdown };
  }

  /**
   * 5️⃣ Bloquea disponibilidad temporalmente
   */
  async crearPreReserva(
    itinerario: string,
    cliente: string,
    holdMinutes: number,
    idemKey: string
  ): Promise<PreReservaDTO> {
    const body = `
      <crearPreReserva xmlns="http://sanctumcortejo.ec/Integracion">
        <itinerario>${itinerario}</itinerario>
        <cliente>${cliente}</cliente>
        <holdMinutes>${holdMinutes}</holdMinutes>
        <idemKey>${idemKey}</idemKey>
      </crearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/crearPreReserva'
    );
    
    const resultElement = xml.getElementsByTagName('crearPreReservaResult')[0];
    if (!resultElement) throw new Error('No se encontró resultado de pre-reserva');
    
    return {
      PreBookingId: this.getTagValue(resultElement, 'PreBookingId') || '',
      ExpiraEn: new Date(this.getTagValue(resultElement, 'ExpiraEn') || '')
    };
  }

  /**
   * 6️⃣ Confirma y emite la reserva
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: string
  ): Promise<ReservaDTO> {
    const body = `
      <confirmarReserva xmlns="http://sanctumcortejo.ec/Integracion">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>${datosPago}</datosPago>
      </confirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/confirmarReserva'
    );
    
    const resultElement = xml.getElementsByTagName('confirmarReservaResult')[0];
    if (!resultElement) throw new Error('No se encontró resultado de confirmación');
    
    return {
      BookingId: this.getTagValue(resultElement, 'BookingId') || '',
      Estado: this.getTagValue(resultElement, 'Estado') || ''
    };
  }

  /**
   * 7️⃣ Cancela con reglas tarifarias
   */
  async cancelarReservaIntegracion(
    bookingId: string,
    motivo: string
  ): Promise<CancelacionDTO> {
    const body = `
      <cancelarReservaIntegracion xmlns="http://sanctumcortejo.ec/Integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(
      soapEnvelope, 
      'http://sanctumcortejo.ec/Integracion/cancelarReservaIntegracion'
    );
    
    const resultElement = xml.getElementsByTagName('cancelarReservaIntegracionResult')[0];
    if (!resultElement) throw new Error('No se encontró resultado de cancelación');
    
    return {
      Cancelacion: this.getTagValue(resultElement, 'Cancelacion') === 'true'
    };
  }

  // ==================== Parser Helpers ====================

  /**
   * Parsear lista de servicios desde XML crudo (raw string)
   * Usa regex para extraer elementos ServicioDTO
   */
  private parseServiciosListFromXml(xmlString: string): ServicioDTO[] {
    const servicios: ServicioDTO[] = [];
    
    // Extraer todos los bloques <ServicioDTO>...</ServicioDTO>
    const servicioRegex = /<ServicioDTO>([\s\S]*?)<\/ServicioDTO>/g;
    const matches = xmlString.matchAll(servicioRegex);
    
    for (const match of matches) {
      const servicioXml = match[1]; // Contenido entre <ServicioDTO> y </ServicioDTO>
      
      const servicio: ServicioDTO = {
        IdServicio: parseInt(this.extractXmlValue(servicioXml, 'IdServicio') || '0'),
        Nombre: this.extractXmlValue(servicioXml, 'Nombre') || '',
        Tipo: this.extractXmlValue(servicioXml, 'Tipo') || '',
        Ciudad: this.extractXmlValue(servicioXml, 'Ciudad') || '',
        Precio: this.extractXmlValue(servicioXml, 'Precio') || '0',
        Clasificacion: this.extractXmlValue(servicioXml, 'Clasificacion') || '',
        Descripcion: this.extractXmlValue(servicioXml, 'Descripcion') || '',
        Politicas: this.extractXmlValue(servicioXml, 'Politicas') || '',
        Reglas: this.extractXmlValue(servicioXml, 'Reglas') || '',
        ImagenURL: this.extractXmlValue(servicioXml, 'ImagenURL') || undefined
      };
      
      servicios.push(servicio);
    }
    
    console.log('[Sanctum Cortejo] ✅ Parsed servicios:', servicios.length);
    if (servicios.length > 0) {
      console.log('[Sanctum Cortejo] 🔍 First servicio:', servicios[0]);
    }
    return servicios;
  }

  /**
   * Extrae el valor de un elemento XML usando regex
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  // ==================== Parser Helpers (DOM-based - legacy) ====================

  private parseServicioFromElement(element: Element): ServicioDTO {
    return {
      IdServicio: parseInt(this.getTagValue(element, 'IdServicio') || '0'),
      Nombre: this.getTagValue(element, 'Nombre') || '',
      Tipo: this.getTagValue(element, 'Tipo') || '',
      Ciudad: this.getTagValue(element, 'Ciudad') || '',
      Precio: this.getTagValue(element, 'Precio') || '',
      Clasificacion: this.getTagValue(element, 'Clasificacion') || '',
      Descripcion: this.getTagValue(element, 'Descripcion') || '',
      Politicas: this.getTagValue(element, 'Politicas') || '',
      Reglas: this.getTagValue(element, 'Reglas') || '',
      ImagenURL: this.getTagValue(element, 'ImagenURL') || undefined
    };
  }

  private getTagValue(element: Element | Document, tagName: string): string | null {
    const tags = element.getElementsByTagName(tagName);
    return tags.length > 0 && tags[0].textContent ? tags[0].textContent : null;
  }
}
