/**
 * 🏨 Adaptador SOAP para Hotel Boutique Paris
 * Endpoint: http://hotelboutique.runasp.net/WS_Integracion.asmx
 * Namespace: http://hotelparis.com/integracion
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';

// ==================== DTOs ====================

export interface DTO_Room {
  RoomId: number;
  HotelId: number;
  RoomType: string;
  NumberBeds: number;
  OccupancyAdults: number;
  OccupancyChildren: number;
  Board: string;
  Amenities: string;
  BreakfastIncluded: boolean;
  PricePerNight: number;
  Currency: string;
  IsReserved: boolean;
  CreatedAt: Date;
  HotelName: string;
  City: string;
}

export interface DTO_Cotizacion {
  Subtotal: number;
  Impuestos: number;
  Total: number;
  Desglose: string;
}

export interface DTO_PreReserva {
  PreBookingId: string;
  RoomId: number;
  UserId: number;
  ExpiraEn: Date;
}

export interface DTO_Reserva {
  BookingId: string;
  Estado: string;
  MetodoPago: string;
  FechaConfirmacion: Date;
}

// ==================== Adaptador SOAP ====================

export class HotelBoutiqueSoapAdapter extends SoapClient {
  
  /**
   * 1️⃣ Búsqueda unificada por ciudad, fechas, precio, amenities, clasificación
   */
  async buscarServicios(
    ciudad?: string,
    inicio?: Date,
    fin?: Date,
    precioMin?: number,
    precioMax?: number,
    amenities?: string
  ): Promise<DTO_Room[]> {
    const body = `
      <buscarServicios xmlns="http://hotelparis.com/integracion">
        <ciudad>${ciudad || ''}</ciudad>
        <inicio>${inicio ? inicio.toISOString() : ''}</inicio>
        <fin>${fin ? fin.toISOString() : ''}</fin>
        <precioMin>${precioMin || 0}</precioMin>
        <precioMax>${precioMax || 9999}</precioMax>
        <amenities>${amenities || ''}</amenities>
      </buscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/buscarServicios"');
    console.log('[Hotel Boutique] Raw XML Response length:', rawResponse.length);
    
    return this.parseRoomsFromXml(rawResponse);
  }

  /**
   * 2️⃣ Devuelve el detalle completo de un servicio/habitación
   */
  async obtenerDetalleServicio(idServicio: number): Promise<DTO_Room> {
    const body = `
      <obtenerDetalleServicio xmlns="http://hotelparis.com/integracion">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/obtenerDetalleServicio"');
    
    const rooms = this.parseRoomsFromXml(rawResponse);
    if (rooms.length === 0) {
      throw new Error('No se encontró el detalle de la habitación');
    }
    
    return rooms[0];
  }

  /**
   * 3️⃣ Verifica la disponibilidad de una habitación por fechas
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<boolean> {
    const body = `
      <verificarDisponibilidad xmlns="http://hotelparis.com/integracion">
        <sku>${sku}</sku>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/verificarDisponibilidad"');
    
    const result = this.extractXmlValue(rawResponse, 'verificarDisponibilidadResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 4️⃣ Calcula el total de una reserva (precio + impuestos)
   */
  async cotizarReserva(roomIds: number[]): Promise<DTO_Cotizacion> {
    const roomIdsXml = roomIds.map(id => `<int>${id}</int>`).join('');
    
    const body = `
      <cotizarReserva xmlns="http://hotelparis.com/integracion">
        <roomIds>
          ${roomIdsXml}
        </roomIds>
      </cotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/cotizarReserva"');
    
    return {
      Subtotal: parseFloat(this.extractXmlValue(rawResponse, 'Subtotal') || '0'),
      Impuestos: parseFloat(this.extractXmlValue(rawResponse, 'Impuestos') || '0'),
      Total: parseFloat(this.extractXmlValue(rawResponse, 'Total') || '0'),
      Desglose: this.extractXmlValue(rawResponse, 'Desglose') || ''
    };
  }

  /**
   * 5️⃣ Crea una pre-reserva temporal que expira automáticamente
   */
  async crearPreReserva(
    roomId: number,
    userId: number,
    holdMinutes: number
  ): Promise<DTO_PreReserva> {
    const body = `
      <crearPreReserva xmlns="http://hotelparis.com/integracion">
        <roomId>${roomId}</roomId>
        <userId>${userId}</userId>
        <holdMinutes>${holdMinutes}</holdMinutes>
      </crearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/crearPreReserva"');
    
    return {
      PreBookingId: this.extractXmlValue(rawResponse, 'PreBookingId') || '',
      RoomId: parseInt(this.extractXmlValue(rawResponse, 'RoomId') || '0'),
      UserId: parseInt(this.extractXmlValue(rawResponse, 'UserId') || '0'),
      ExpiraEn: new Date(this.extractXmlValue(rawResponse, 'ExpiraEn') || '')
    };
  }

  /**
   * 6️⃣ Confirma una pre-reserva y la convierte en reserva final
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: string
  ): Promise<DTO_Reserva> {
    const body = `
      <confirmarReserva xmlns="http://hotelparis.com/integracion">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>${datosPago}</datosPago>
      </confirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/confirmarReserva"');
    
    return {
      BookingId: this.extractXmlValue(rawResponse, 'BookingId') || '',
      Estado: this.extractXmlValue(rawResponse, 'Estado') || '',
      MetodoPago: this.extractXmlValue(rawResponse, 'MetodoPago') || '',
      FechaConfirmacion: new Date(this.extractXmlValue(rawResponse, 'FechaConfirmacion') || '')
    };
  }

  /**
   * 7️⃣ Cancela una reserva confirmada con reglas tarifarias
   */
  async cancelarReserva(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <cancelarReservaIntegracion xmlns="http://hotelparis.com/integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const rawResponse = await this.callRaw(soapEnvelope, '"http://hotelparis.com/integracion/cancelarReservaIntegracion"');
    
    const result = this.extractXmlValue(rawResponse, 'cancelarReservaIntegracionResult');
    return result?.toLowerCase() === 'true';
  }

  // ==================== Parsers con Regex ====================

  /**
   * Parse list of rooms from XML using regex
   */
  private parseRoomsFromXml(xmlString: string): DTO_Room[] {
    const rooms: DTO_Room[] = [];
    const regex = /<DTO_Room>([\s\S]*?)<\/DTO_Room>/g;
    const matches = xmlString.matchAll(regex);

    for (const match of matches) {
      const roomXml = match[1];
      
      rooms.push({
        RoomId: parseInt(this.extractXmlValue(roomXml, 'RoomId') || '0'),
        HotelId: parseInt(this.extractXmlValue(roomXml, 'HotelId') || '0'),
        RoomType: this.extractXmlValue(roomXml, 'RoomType') || '',
        NumberBeds: parseInt(this.extractXmlValue(roomXml, 'NumberBeds') || '0'),
        OccupancyAdults: parseInt(this.extractXmlValue(roomXml, 'OccupancyAdults') || '0'),
        OccupancyChildren: parseInt(this.extractXmlValue(roomXml, 'OccupancyChildren') || '0'),
        Board: this.extractXmlValue(roomXml, 'Board') || '',
        Amenities: this.extractXmlValue(roomXml, 'Amenities') || '',
        BreakfastIncluded: this.extractXmlValue(roomXml, 'BreakfastIncluded')?.toLowerCase() === 'true',
        PricePerNight: parseFloat(this.extractXmlValue(roomXml, 'PricePerNight') || '0'),
        Currency: this.extractXmlValue(roomXml, 'Currency') || 'USD',
        IsReserved: this.extractXmlValue(roomXml, 'IsReserved')?.toLowerCase() === 'true',
        CreatedAt: new Date(this.extractXmlValue(roomXml, 'CreatedAt') || ''),
        HotelName: this.extractXmlValue(roomXml, 'HotelName') || '',
        City: this.extractXmlValue(roomXml, 'City') || ''
      });
    }

    console.log(`[Hotel Boutique] Parsed ${rooms.length} rooms from XML`);
    return rooms;
  }

  /**
   * Extract value from XML tag using regex
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }
}
