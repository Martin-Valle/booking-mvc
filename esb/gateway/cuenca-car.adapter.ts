/**
 * 🚗 Cuenca Car Rental SOAP Adapter
 * Servicio SOAP para búsqueda y reserva de autos de arriendo
 * Endpoint: http://wscuencaarriendoautos.runasp.net/WS_IntegracionServicioAUTOS.asmx
 * Namespace: http://arriendoautos.com/integracion
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';
import type { EndpointConfig } from '../utils/config';

// =====================================================
// DTOs de Arriendo de Autos Cuenca
// =====================================================

export interface DTO_ServicioIntegracion {
  IdVehiculo: number;
  AgencyId: number;
  Ciudad: string;
  Categoria: string;
  Transmision: string;
  Marca: string;
  Modelo: string;
  PrecioDia: number;
  Disponible: boolean;
}

export interface DTO_DetalleServicio {
  IdVehiculo: number;
  Marca: string;
  Modelo: string;
  Categoria: string;
  Transmision: string;
  PrecioDia: number;
  Agencia: string;
  Ciudad: string;
  Direccion: string;
  Imagenes: string[];
  Politicas: string;
  Reglas: string;
}

export interface DTO_ItemCotizacion {
  Concepto: string;
  Valor: number;
}

export interface DTO_Cotizacion {
  Total: number;
  IVA: number;
  Neto: number;
  Detalle: DTO_ItemCotizacion[];
}

export interface DTO_PreReserva {
  PreBookingId: string;
  ExpiraEn: string; // dateTime
}

export interface DTO_ReservaIntegracion {
  BookingId: string;
  Estado: string;
}

// =====================================================
// Cuenca Car Rental SOAP Adapter
// =====================================================

export class CuencaCarRentalSoapAdapter extends SoapClient {
  private namespace: string;

  constructor(endpoint: EndpointConfig) {
    super(endpoint);
    this.namespace = endpoint.namespace;
  }

  /**
   * Helper para extraer valor de un tag XML
   */
  private getTagValue(parent: Element | Document, tagName: string): string {
    const elements = parent.getElementsByTagName(tagName);
    if (elements.length > 0 && elements[0].firstChild) {
      return elements[0].firstChild.nodeValue || '';
    }
    return '';
  }

  /**
   * Helper para extraer array de strings
   */
  private getStringArray(parent: Element, arrayTagName: string): string[] {
    const arrayElement = parent.getElementsByTagName(arrayTagName)[0];
    if (!arrayElement) return [];
    
    const stringElements = arrayElement.getElementsByTagName('string');
    const result: string[] = [];
    for (let i = 0; i < stringElements.length; i++) {
      const value = stringElements[i].textContent || '';
      if (value) result.push(value);
    }
    return result;
  }

  /**
   * 1️⃣ buscarServicios - Búsqueda unificada de autos
   */
  async buscarServicios(ciudad?: string, categoria?: string): Promise<DTO_ServicioIntegracion[]> {
    const body = `
      <buscarServicios xmlns="${this.namespace}">
        ${ciudad ? `<ciudad>${ciudad}</ciudad>` : '<ciudad/>'}
        ${categoria ? `<categoria>${categoria}</categoria>` : '<categoria/>'}
      </buscarServicios>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const rawResponse = await this.callRaw(envelope, `"${this.namespace}/buscarServicios"`);
    console.log('[Cuenca Car] Raw XML Response length:', rawResponse.length);
    
    // Count elements for debugging
    const matches = rawResponse.match(/<DTO_ServicioIntegracion>/g);
    console.log('[Cuenca Car] DTO_ServicioIntegracion elements found:', matches ? matches.length : 0);
    
    return this.parseServiciosListFromXml(rawResponse);
  }

  // Regex-based XML parsing
  private parseServiciosListFromXml(xmlString: string): DTO_ServicioIntegracion[] {
    const servicios: DTO_ServicioIntegracion[] = [];
    
    // Extract all DTO_ServicioIntegracion elements using regex
    const regex = /<DTO_ServicioIntegracion>([\s\S]*?)<\/DTO_ServicioIntegracion>/g;
    const matches = xmlString.matchAll(regex);
    
    for (const match of matches) {
      const servicioXml = match[1];
      
      const servicio: DTO_ServicioIntegracion = {
        IdVehiculo: parseInt(this.extractXmlValue(servicioXml, 'IdVehiculo') || '0') || 0,
        AgencyId: parseInt(this.extractXmlValue(servicioXml, 'AgencyId') || '0') || 0,
        Ciudad: this.extractXmlValue(servicioXml, 'Ciudad') || '',
        Categoria: this.extractXmlValue(servicioXml, 'Categoria') || '',
        Transmision: this.extractXmlValue(servicioXml, 'Transmision') || '',
        Marca: this.extractXmlValue(servicioXml, 'Marca') || '',
        Modelo: this.extractXmlValue(servicioXml, 'Modelo') || '',
        PrecioDia: parseFloat(this.extractXmlValue(servicioXml, 'PrecioDia') || '0') || 0,
        Disponible: this.extractXmlValue(servicioXml, 'Disponible') === 'true'
      };
      
      servicios.push(servicio);
    }
    
    console.log('[Cuenca Car] Parsed vehicles:', servicios.length);
    return servicios;
  }

  // Helper method to extract XML tag values using regex
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * 2️⃣ obtenerDetalleServicio - Obtiene detalle completo del servicio
   */
  async obtenerDetalleServicio(idServicio: number): Promise<DTO_DetalleServicio> {
    const body = `
      <obtenerDetalleServicio xmlns="${this.namespace}">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/obtenerDetalleServicio"`);
    const result = xml.getElementsByTagName('obtenerDetalleServicioResult')[0];
    
    return {
      IdVehiculo: parseInt(this.getTagValue(result, 'IdVehiculo')),
      Marca: this.getTagValue(result, 'Marca'),
      Modelo: this.getTagValue(result, 'Modelo'),
      Categoria: this.getTagValue(result, 'Categoria'),
      Transmision: this.getTagValue(result, 'Transmision'),
      PrecioDia: parseFloat(this.getTagValue(result, 'PrecioDia')),
      Agencia: this.getTagValue(result, 'Agencia'),
      Ciudad: this.getTagValue(result, 'Ciudad'),
      Direccion: this.getTagValue(result, 'Direccion'),
      Imagenes: this.getStringArray(result, 'Imagenes'),
      Politicas: this.getTagValue(result, 'Politicas'),
      Reglas: this.getTagValue(result, 'Reglas')
    };
  }

  /**
   * 3️⃣ verificarDisponibilidad - Verifica disponibilidad de vehículo
   */
  async verificarDisponibilidad(
    idVehiculo: number,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<boolean> {
    const body = `
      <verificarDisponibilidad xmlns="${this.namespace}">
        <idVehiculo>${idVehiculo}</idVehiculo>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/verificarDisponibilidad"`);
    const resultado = this.getTagValue(xml, 'verificarDisponibilidadResult');
    
    return resultado === 'true';
  }

  /**
   * 4️⃣ cotizarReserva - Calcula total de reserva
   */
  async cotizarReserva(idVehiculo: number, inicio: Date, fin: Date): Promise<DTO_Cotizacion> {
    const body = `
      <cotizarReserva xmlns="${this.namespace}">
        <idVehiculo>${idVehiculo}</idVehiculo>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
      </cotizarReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/cotizarReserva"`);
    const result = xml.getElementsByTagName('cotizarReservaResult')[0];
    
    // Parsear items de cotización
    const detalleItems = result.getElementsByTagName('DTO_ItemCotizacion');
    const detalle: DTO_ItemCotizacion[] = [];
    for (let i = 0; i < detalleItems.length; i++) {
      const item = detalleItems[i];
      detalle.push({
        Concepto: this.getTagValue(item, 'Concepto'),
        Valor: parseFloat(this.getTagValue(item, 'Valor'))
      });
    }
    
    return {
      Total: parseFloat(this.getTagValue(result, 'Total')),
      IVA: parseFloat(this.getTagValue(result, 'IVA')),
      Neto: parseFloat(this.getTagValue(result, 'Neto')),
      Detalle: detalle
    };
  }

  /**
   * 5️⃣ crearPreReserva - Crea pre-reserva temporal
   */
  async crearPreReserva(idVehiculo: number, idUsuario: number): Promise<DTO_PreReserva> {
    const body = `
      <crearPreReserva xmlns="${this.namespace}">
        <idVehiculo>${idVehiculo}</idVehiculo>
        <idUsuario>${idUsuario}</idUsuario>
      </crearPreReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/crearPreReserva"`);
    const result = xml.getElementsByTagName('crearPreReservaResult')[0];
    
    return {
      PreBookingId: this.getTagValue(result, 'PreBookingId'),
      ExpiraEn: this.getTagValue(result, 'ExpiraEn')
    };
  }

  /**
   * 6️⃣ confirmarReserva - Confirma reserva y genera comprobante
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    monto: number
  ): Promise<DTO_ReservaIntegracion> {
    const body = `
      <confirmarReserva xmlns="${this.namespace}">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <monto>${monto}</monto>
      </confirmarReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/confirmarReserva"`);
    const result = xml.getElementsByTagName('confirmarReservaResult')[0];
    
    return {
      BookingId: this.getTagValue(result, 'BookingId'),
      Estado: this.getTagValue(result, 'Estado')
    };
  }

  /**
   * 7️⃣ cancelarReservaIntegracion - Cancela reserva existente
   */
  async cancelarReservaIntegracion(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <cancelarReservaIntegracion xmlns="${this.namespace}">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/cancelarReservaIntegracion"`);
    const resultado = this.getTagValue(xml, 'cancelarReservaIntegracionResult');
    
    return resultado === 'true';
  }
}
