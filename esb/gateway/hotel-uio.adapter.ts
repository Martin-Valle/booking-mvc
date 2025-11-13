/**
 * Hotel UIO SOAP Service Adapter
 * Service 16 - Hotel Service with Invoicing
 * Endpoint: http://hoteluio.runasp.net/Services/HotelService.asmx
 * Namespace: http://mio.hotel/booking
 * Type: ASMX Hotel Service
 * Operations: 8 (includes obtenerFactura)
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface HotelDTO {
  IdHotel: number;
  Nombre: string;
  Ciudad: string;
  Direccion: string;
  Estrellas: number;
  Telefono: string;
  Correo: string;
  Descripcion: string;
  Imagen: string;
}

export interface FacturaDTO {
  IdFactura: number;
  NumeroFactura: string;
  FechaEmision: string; // DateTime ISO
  Subtotal: number;
  Impuestos: number;
  Total: number;
  XmlSRI: string; // XML para SRI (Servicio de Rentas Internas Ecuador)
}

// ==================== Adapter ====================

export class HotelUIOSoapAdapter extends SoapClient {
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
   * 1. buscarServicios - Busca hoteles por nombre/ciudad, precio o fecha
   */
  async buscarServicios(
    filtro?: string,
    precio?: number,
    fecha?: string
  ): Promise<HotelDTO[]> {
    const soapBody = `
      <buscarServicios xmlns="http://mio.hotel/booking">
        ${filtro ? `<filtro>${filtro}</filtro>` : '<filtro xsi:nil="true" />'}
        ${precio !== undefined ? `<precio>${precio}</precio>` : '<precio xsi:nil="true" />'}
        ${fecha ? `<fecha>${fecha}</fecha>` : '<fecha xsi:nil="true" />'}
      </buscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/buscarServicios');
    
    console.log('[Hotel UIO] Raw XML Response length:', rawResponse.length);
    return this.parseHotelesFromXml(rawResponse);
  }

  /**
   * 2. obtenerDetalleServicio - Obtiene el detalle completo de un hotel
   */
  async obtenerDetalleServicio(idHotel: number): Promise<HotelDTO> {
    const soapBody = `
      <obtenerDetalleServicio xmlns="http://mio.hotel/booking">
        <idHotel>${idHotel}</idHotel>
      </obtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/obtenerDetalleServicio');
    
    const hoteles = this.parseHotelesFromXml(rawResponse);
    if (hoteles.length === 0) throw new Error('Hotel no encontrado');
    return hoteles[0];
  }

  /**
   * 3. verificarDisponibilidad - Verifica disponibilidad real de una habitación
   */
  async verificarDisponibilidad(
    idHabitacion: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<boolean> {
    const soapBody = `
      <verificarDisponibilidad xmlns="http://mio.hotel/booking">
        <idHabitacion>${idHabitacion}</idHabitacion>
        <fechaInicio>${fechaInicio}</fechaInicio>
        <fechaFin>${fechaFin}</fechaFin>
      </verificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/verificarDisponibilidad');
    
    const result = this.extractXmlValue(rawResponse, 'verificarDisponibilidadResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 4. cotizarReserva - Calcula el costo total de la estancia con impuestos
   */
  async cotizarReserva(
    idHabitacion: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<number> {
    const soapBody = `
      <cotizarReserva xmlns="http://mio.hotel/booking">
        <idHabitacion>${idHabitacion}</idHabitacion>
        <fechaInicio>${fechaInicio}</fechaInicio>
        <fechaFin>${fechaFin}</fechaFin>
      </cotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/cotizarReserva');
    
    const result = this.extractXmlValue(rawResponse, 'cotizarReservaResult');
    return parseFloat(result || '0');
  }

  /**
   * 5. crearPreReserva - Crea una pre-reserva (estado PENDIENTE) y bloquea disponibilidad
   */
  async crearPreReserva(
    idCliente: number,
    idHabitacion: number,
    fechaCheckin: string,
    fechaCheckout: string
  ): Promise<number> {
    const soapBody = `
      <crearPreReserva xmlns="http://mio.hotel/booking">
        <idCliente>${idCliente}</idCliente>
        <idHabitacion>${idHabitacion}</idHabitacion>
        <fechaCheckin>${fechaCheckin}</fechaCheckin>
        <fechaCheckout>${fechaCheckout}</fechaCheckout>
      </crearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/crearPreReserva');
    
    const result = this.extractXmlValue(rawResponse, 'crearPreReservaResult');
    return parseInt(result || '0') || 0;
  }

  /**
   * 6. confirmarReserva - Confirma una reserva y registra el pago y factura
   */
  async confirmarReserva(
    idReserva: number,
    idMetodoPago: number
  ): Promise<boolean> {
    const soapBody = `
      <confirmarReserva xmlns="http://mio.hotel/booking">
        <idReserva>${idReserva}</idReserva>
        <idMetodoPago>${idMetodoPago}</idMetodoPago>
      </confirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/confirmarReserva');
    
    const result = this.extractXmlValue(rawResponse, 'confirmarReservaResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 7. obtenerFactura - Obtiene la factura asociada a una reserva (UNIQUE FEATURE!)
   */
  async obtenerFactura(idReserva: number): Promise<FacturaDTO> {
    const soapBody = `
      <obtenerFactura xmlns="http://mio.hotel/booking">
        <idReserva>${idReserva}</idReserva>
      </obtenerFactura>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/obtenerFactura');
    return this.parseFacturaFromXml(rawResponse);
  }

  /**
   * 8. cancelarReservaIntegracion - Cancela una reserva y libera las fechas
   */
  async cancelarReservaIntegracion(
    bookingId: number,
    motivo: string
  ): Promise<boolean> {
    const soapBody = `
      <cancelarReservaIntegracion xmlns="http://mio.hotel/booking">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo || ''}</motivo>
      </cancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://mio.hotel/booking/cancelarReservaIntegracion');
    
    const result = this.extractXmlValue(rawResponse, 'cancelarReservaIntegracionResult');
    return result?.toLowerCase() === 'true';
  }

  // ==================== Parsers con Regex ====================

  /**
   * Parse list of hotels from XML using regex
   */
  private parseHotelesFromXml(xmlString: string): HotelDTO[] {
    const hoteles: HotelDTO[] = [];
    const regex = /<Hotel>([\s\S]*?)<\/Hotel>/g;
    const matches = xmlString.matchAll(regex);

    for (const match of matches) {
      const hotelXml = match[1];
      
      const hotel: HotelDTO = {
        IdHotel: parseInt(this.extractXmlValue(hotelXml, 'IdHotel') || '0'),
        Nombre: this.extractXmlValue(hotelXml, 'Nombre') || '',
        Ciudad: this.extractXmlValue(hotelXml, 'Ciudad') || '',
        Direccion: this.extractXmlValue(hotelXml, 'Direccion') || '',
        Estrellas: parseInt(this.extractXmlValue(hotelXml, 'Estrellas') || '0'),
        Telefono: this.extractXmlValue(hotelXml, 'Telefono') || '',
        Correo: this.extractXmlValue(hotelXml, 'Correo') || '',
        Descripcion: this.extractXmlValue(hotelXml, 'Descripcion') || '',
        Imagen: this.extractXmlValue(hotelXml, 'Imagen') || ''
      };

      hoteles.push(hotel);
    }

    console.log(`[Hotel UIO] Parsed ${hoteles.length} hotels from XML`);
    return hoteles;
  }

  /**
   * Parse single invoice/factura from XML
   */
  private parseFacturaFromXml(xmlString: string): FacturaDTO {
    return {
      IdFactura: parseInt(this.extractXmlValue(xmlString, 'IdFactura') || '0'),
      NumeroFactura: this.extractXmlValue(xmlString, 'NumeroFactura') || '',
      FechaEmision: this.extractXmlValue(xmlString, 'FechaEmision') || '',
      Subtotal: parseFloat(this.extractXmlValue(xmlString, 'Subtotal') || '0'),
      Impuestos: parseFloat(this.extractXmlValue(xmlString, 'Impuestos') || '0'),
      Total: parseFloat(this.extractXmlValue(xmlString, 'Total') || '0'),
      XmlSRI: this.extractXmlValue(xmlString, 'XmlSRI') || ''
    };
  }

  /**
   * Extract XML value using regex
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }
}
