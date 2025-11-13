import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';

// ========================================
// DTOs y Tipos
// ========================================

export interface FiltrosHotel {
  filtro?: string;        // Nombre/Ciudad del hotel
  precio?: number;        // Precio máximo
  fecha?: Date;           // Fecha de búsqueda
}

export interface Hotel {
  idHotel: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  estrellas: number;
  telefono: string;
  correo: string;
  descripcion: string;
  imagen: string;
}

export interface DisponibilidadParams {
  idHabitacion: number;
  fechaInicio: Date;
  fechaFin: Date;
}

export interface CotizacionParams {
  idHabitacion: number;
  fechaInicio: Date;
  fechaFin: Date;
}

export interface PreReservaParams {
  idCliente: number;
  idHabitacion: number;
  fechaCheckin: Date;
  fechaCheckout: Date;
}

export interface ConfirmacionParams {
  idReserva: number;
  idMetodoPago: number;
}

export interface CancelacionParams {
  bookingId: number;
  motivo?: string;
}

export interface Factura {
  idFactura: number;
  numeroFactura: string;
  fechaEmision: Date;
  subtotal: number;
  impuestos: number;
  total: number;
  xmlSRI: string;
}

// ========================================
// KM25Madrid Hotel SOAP Adapter
// ========================================

export class KM25MadridHotelSoapAdapter extends SoapClient {
  
  /**
   * Busca hoteles por nombre/ciudad, precio o fecha
   */
  async buscarServicios(filtros?: FiltrosHotel): Promise<Hotel[]> {
    console.log('[KM25 Madrid] 🔍 Parámetros recibidos:', filtros);
    
    const f = filtros || {};
    
    // Manejar campos opcionales - omitir si no están presentes
    const precioXml = f.precio !== undefined ? `<precio>${f.precio}</precio>` : '<precio xsi:nil="true"/>';
    const fechaXml = f.fecha ? `<fecha>${f.fecha.toISOString()}</fecha>` : '<fecha xsi:nil="true"/>';
    
    const body = `
      <buscarServicios xmlns="http://mio.hotel/booking">
        <filtro>${f.filtro || ''}</filtro>
        ${precioXml}
        ${fechaXml}
      </buscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    
    try {
      // Usar callRaw() para obtener XML como string
      const rawResponse = await this.callRaw(soapEnvelope, '"http://mio.hotel/booking/buscarServicios"');
      console.log('[KM25 Madrid] 📄 Raw XML Response length:', rawResponse.length);
      
      // Contar elementos usando regex
      const matches = rawResponse.match(/<Hotel>/g);
      console.log('[KM25 Madrid] 🏨 Hotel elements found:', matches ? matches.length : 0);
      
      return this.parseHotelesListFromXml(rawResponse);
    } catch (error: any) {
      console.error('[KM25 Madrid] ❌ Error en buscarServicios:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el detalle completo de un hotel
   */
  async obtenerDetalleServicio(idHotel: number): Promise<Hotel> {
    const body = `
      <obtenerDetalleServicio xmlns="http://mio.hotel/booking">
        <idHotel>${idHotel}</idHotel>
      </obtenerDetalleServicio>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/obtenerDetalleServicio"');
    
    // El resultado viene en <obtenerDetalleServicioResult>
    const resultEl = xml.getElementsByTagName('obtenerDetalleServicioResult')[0];
    if (!resultEl) {
      throw new Error(`Hotel con id ${idHotel} no encontrado`);
    }
    
    return this.parseHotelFromElement(resultEl);
  }

  /**
   * Verifica disponibilidad real de una habitación considerando reservas y fechas
   */
  async verificarDisponibilidad(params: DisponibilidadParams): Promise<boolean> {
    const body = `
      <verificarDisponibilidad xmlns="http://mio.hotel/booking">
        <idHabitacion>${params.idHabitacion}</idHabitacion>
        <fechaInicio>${params.fechaInicio.toISOString()}</fechaInicio>
        <fechaFin>${params.fechaFin.toISOString()}</fechaFin>
      </verificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/verificarDisponibilidad"');
    
    const resultEl = xml.getElementsByTagName('verificarDisponibilidadResult')[0];
    return resultEl?.textContent?.toLowerCase() === 'true';
  }

  /**
   * Calcula el costo total de la estancia con impuestos
   */
  async cotizarReserva(params: CotizacionParams): Promise<number> {
    const body = `
      <cotizarReserva xmlns="http://mio.hotel/booking">
        <idHabitacion>${params.idHabitacion}</idHabitacion>
        <fechaInicio>${params.fechaInicio.toISOString()}</fechaInicio>
        <fechaFin>${params.fechaFin.toISOString()}</fechaFin>
      </cotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/cotizarReserva"');
    
    const resultEl = xml.getElementsByTagName('cotizarReservaResult')[0];
    return parseFloat(resultEl?.textContent || '0');
  }

  /**
   * Crea una pre-reserva (estado PENDIENTE) y bloquea disponibilidad
   */
  async crearPreReserva(params: PreReservaParams): Promise<number> {
    const body = `
      <crearPreReserva xmlns="http://mio.hotel/booking">
        <idCliente>${params.idCliente}</idCliente>
        <idHabitacion>${params.idHabitacion}</idHabitacion>
        <fechaCheckin>${params.fechaCheckin.toISOString()}</fechaCheckin>
        <fechaCheckout>${params.fechaCheckout.toISOString()}</fechaCheckout>
      </crearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/crearPreReserva"');
    
    const resultEl = xml.getElementsByTagName('crearPreReservaResult')[0];
    return parseInt(resultEl?.textContent || '0');
  }

  /**
   * Confirma una reserva y registra el pago y factura correspondientes
   */
  async confirmarReserva(params: ConfirmacionParams): Promise<boolean> {
    const body = `
      <confirmarReserva xmlns="http://mio.hotel/booking">
        <idReserva>${params.idReserva}</idReserva>
        <idMetodoPago>${params.idMetodoPago}</idMetodoPago>
      </confirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/confirmarReserva"');
    
    const resultEl = xml.getElementsByTagName('confirmarReservaResult')[0];
    return resultEl?.textContent?.toLowerCase() === 'true';
  }

  /**
   * Cancela una reserva existente y libera las fechas de disponibilidad
   */
  async cancelarReservaIntegracion(params: CancelacionParams): Promise<boolean> {
    const body = `
      <cancelarReservaIntegracion xmlns="http://mio.hotel/booking">
        <bookingId>${params.bookingId}</bookingId>
        <motivo>${params.motivo || ''}</motivo>
      </cancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/cancelarReservaIntegracion"');
    
    const resultEl = xml.getElementsByTagName('cancelarReservaIntegracionResult')[0];
    return resultEl?.textContent?.toLowerCase() === 'true';
  }

  /**
   * Obtiene la factura asociada a una reserva
   */
  async obtenerFactura(idReserva: number): Promise<Factura> {
    const body = `
      <obtenerFactura xmlns="http://mio.hotel/booking">
        <idReserva>${idReserva}</idReserva>
      </obtenerFactura>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://mio.hotel/booking/obtenerFactura"');
    
    // El resultado viene en <obtenerFacturaResult>
    const resultEl = xml.getElementsByTagName('obtenerFacturaResult')[0];
    if (!resultEl) {
      throw new Error(`Factura para reserva ${idReserva} no encontrada`);
    }
    
    return {
      idFactura: parseInt(this.getElementText(resultEl, 'IdFactura') || '0'),
      numeroFactura: this.getElementText(resultEl, 'NumeroFactura') || '',
      fechaEmision: new Date(this.getElementText(resultEl, 'FechaEmision') || ''),
      subtotal: parseFloat(this.getElementText(resultEl, 'Subtotal') || '0'),
      impuestos: parseFloat(this.getElementText(resultEl, 'Impuestos') || '0'),
      total: parseFloat(this.getElementText(resultEl, 'Total') || '0'),
      xmlSRI: this.getElementText(resultEl, 'XmlSRI') || ''
    };
  }

  // ========================================
  // Helpers de Parseo
  // ========================================
  // Parser Helpers (Regex-based)
  // ========================================

  /**
   * Parsear lista de hoteles desde XML crudo (raw string)
   * Usa regex para extraer elementos Hotel
   */
  private parseHotelesListFromXml(xmlString: string): Hotel[] {
    const hoteles: Hotel[] = [];
    
    // Extraer todos los bloques <Hotel>...</Hotel>
    const hotelRegex = /<Hotel>([\s\S]*?)<\/Hotel>/g;
    const matches = xmlString.matchAll(hotelRegex);
    
    for (const match of matches) {
      const hotelXml = match[1]; // Contenido entre <Hotel> y </Hotel>
      
      const hotel: Hotel = {
        idHotel: parseInt(this.extractXmlValue(hotelXml, 'IdHotel') || '0'),
        nombre: this.extractXmlValue(hotelXml, 'Nombre') || '',
        ciudad: this.extractXmlValue(hotelXml, 'Ciudad') || '',
        direccion: this.extractXmlValue(hotelXml, 'Direccion') || '',
        estrellas: parseInt(this.extractXmlValue(hotelXml, 'Estrellas') || '0'),
        telefono: this.extractXmlValue(hotelXml, 'Telefono') || '',
        correo: this.extractXmlValue(hotelXml, 'Correo') || '',
        descripcion: this.extractXmlValue(hotelXml, 'Descripcion') || '',
        imagen: this.extractXmlValue(hotelXml, 'Imagen') || ''
      };
      
      hoteles.push(hotel);
    }
    
    console.log('[KM25 Madrid] ✅ Parsed hoteles:', hoteles.length);
    if (hoteles.length > 0) {
      console.log('[KM25 Madrid] 🔍 First hotel:', hoteles[0]);
    }
    return hoteles;
  }

  /**
   * Extrae el valor de un elemento XML usando regex
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  // ========================================
  // Parser Helpers (DOM-based - legacy)
  // ========================================

  private parseHotelFromElement(el: Element): Hotel {
    return {
      idHotel: parseInt(this.getElementText(el, 'IdHotel') || '0'),
      nombre: this.getElementText(el, 'Nombre') || '',
      ciudad: this.getElementText(el, 'Ciudad') || '',
      direccion: this.getElementText(el, 'Direccion') || '',
      estrellas: parseInt(this.getElementText(el, 'Estrellas') || '0'),
      telefono: this.getElementText(el, 'Telefono') || '',
      correo: this.getElementText(el, 'Correo') || '',
      descripcion: this.getElementText(el, 'Descripcion') || '',
      imagen: this.getElementText(el, 'Imagen') || ''
    };
  }

  private getElementText(parent: Element, tagName: string): string | null {
    const el = parent.getElementsByTagName(tagName)[0];
    return el?.textContent || null;
  }
}
