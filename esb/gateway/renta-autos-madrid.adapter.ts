/**
 * Renta Autos Madrid SOAP Service Adapter
 * Service 20 - Renta Autos Madrid (Car Rental)
 * Endpoint: http://rentaautosmadrid.runasp.net/IntegracionService.asmx
 * Namespace: http://rentaautos.es/integracion
 * Type: ASMX Car Rental Service
 * Operations: 8 (including Ping)
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface FiltroDTO {
  TipoServicio?: string;
  Ciudad?: string;
  Categoria?: string;
  Gearbox?: string;
  PrecioMin?: number;
  PrecioMax?: number;
}

export interface ServicioDTO {
  Id: number;
  Nombre: string;
  Categoria: string;
  Gearbox: string;
  Ciudad: string;
  Precio: number;
  Hotel: string;
  Disponible: boolean;
  Imagenes: string[];
}

export interface DetalleCotizacionDTO {
  Descripcion: string;
  Dias: number;
  PrecioDia: number;
}

export interface CotizacionDTO {
  Total: number;
  Impuesto: number;
  Subtotal: number;
  Dias: number;
  Detalle: DetalleCotizacionDTO[];
}

export interface PreReservaDTO {
  PreBookingId: number;
  ExpiraEn: string;
  Exito: boolean;
  Mensaje: string;
}

// ==================== Adapter ====================

export class RentaAutosMadridSoapAdapter extends SoapClient {
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
   * 0. Ping - Health check
   */
  async ping(): Promise<string> {
    const soapBody = `<Ping xmlns="http://rentaautos.es/integracion"/>`;
    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/Ping');
    return this.extractXmlValue(rawResponse, 'PingResult') || 'Pong';
  }

  /**
   * 1. Buscar Servicios (Autos)
   * Búsqueda unificada de servicios (autos disponibles)
   */
  async buscarServicios(filtro?: FiltroDTO): Promise<ServicioDTO[]> {
    let filtroXml = '';
    if (filtro) {
      filtroXml = '<filtro>';
      if (filtro.TipoServicio) filtroXml += `<TipoServicio>${filtro.TipoServicio}</TipoServicio>`;
      if (filtro.Ciudad) filtroXml += `<Ciudad>${filtro.Ciudad}</Ciudad>`;
      if (filtro.Categoria) filtroXml += `<Categoria>${filtro.Categoria}</Categoria>`;
      if (filtro.Gearbox) filtroXml += `<Gearbox>${filtro.Gearbox}</Gearbox>`;
      if (filtro.PrecioMin !== undefined) filtroXml += `<PrecioMin>${filtro.PrecioMin}</PrecioMin>`;
      if (filtro.PrecioMax !== undefined) filtroXml += `<PrecioMax>${filtro.PrecioMax}</PrecioMax>`;
      filtroXml += '</filtro>';
    }

    const soapBody = `
      <BuscarServicios xmlns="http://rentaautos.es/integracion">
        ${filtroXml}
      </BuscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/BuscarServicios');
    console.log('[Renta Autos Madrid] Raw XML Response length:', rawResponse.length);
    return this.parseServiciosFromXml(rawResponse);
  }

  /**
   * 2. Obtener Detalle Servicio
   * Obtiene el detalle completo de un servicio (auto)
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ServicioDTO> {
    const soapBody = `
      <ObtenerDetalleServicio xmlns="http://rentaautos.es/integracion">
        <idServicio>${idServicio}</idServicio>
      </ObtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/ObtenerDetalleServicio');
    const servicios = this.parseServiciosFromXml(rawResponse);
    if (servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }
    return servicios[0];
  }

  /**
   * 3. Verificar Disponibilidad
   * Verifica si un vehículo está disponible entre dos fechas
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: string,
    fin: string,
    unidades: number
  ): Promise<boolean> {
    const soapBody = `
      <VerificarDisponibilidad xmlns="http://rentaautos.es/integracion">
        <sku>${sku}</sku>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
        <unidades>${unidades}</unidades>
      </VerificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/VerificarDisponibilidad');
    
    const result = this.extractXmlValue(rawResponse, 'VerificarDisponibilidadResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 4. Cotizar Reserva
   * Calcula el precio total (subtotal, impuesto y total) para un auto y fechas dadas
   */
  async cotizarReserva(autoId: number, inicio: string, fin: string): Promise<CotizacionDTO> {
    const soapBody = `
      <CotizarReserva xmlns="http://rentaautos.es/integracion">
        <autoId>${autoId}</autoId>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
      </CotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/CotizarReserva');
    return this.parseCotizacionFromXml(rawResponse);
  }

  /**
   * 5. Crear Pre-Reserva
   * Crea una pre-reserva temporal pendiente de confirmación
   */
  async crearPreReserva(
    usuarioId: number,
    autoId: number,
    inicio: string,
    fin: string,
    holdMinutes: number
  ): Promise<PreReservaDTO> {
    const soapBody = `
      <CrearPreReserva xmlns="http://rentaautos.es/integracion">
        <usuarioId>${usuarioId}</usuarioId>
        <autoId>${autoId}</autoId>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
        <holdMinutes>${holdMinutes}</holdMinutes>
      </CrearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/CrearPreReserva');
    return this.parsePreReservaFromXml(rawResponse);
  }

  /**
   * 6. Confirmar Reserva
   * Confirma y emite reserva. Retorna true si se acepta la confirmación.
   */
  async confirmarReserva(
    preBookingId: number,
    metodoPago: string,
    datosPago: string
  ): Promise<boolean> {
    const soapBody = `
      <ConfirmarReserva xmlns="http://rentaautos.es/integracion">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago || ''}</metodoPago>
        <datosPago>${datosPago || ''}</datosPago>
      </ConfirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/ConfirmarReserva');
    
    const result = this.extractXmlValue(rawResponse, 'ConfirmarReservaResult');
    return result?.toLowerCase() === 'true';
  }

  /**
   * 7. Cancelar Reserva
   * Cancela la reserva por bookingId (int)
   */
  async cancelarReservaIntegracion(bookingId: number, motivo: string): Promise<boolean> {
    const soapBody = `
      <CancelarReservaIntegracion xmlns="http://rentaautos.es/integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo || ''}</motivo>
      </CancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://rentaautos.es/integracion/CancelarReservaIntegracion');
    
    const result = this.extractXmlValue(rawResponse, 'CancelarReservaIntegracionResult');
    return result?.toLowerCase() === 'true';
  }

  // ==================== Parsers con Regex ====================

  /**
   * Parse list of servicios (autos) from XML using regex
   */
  private parseServiciosFromXml(xmlString: string): ServicioDTO[] {
    const servicios: ServicioDTO[] = [];
    const regex = /<ServicioDTO>([\s\S]*?)<\/ServicioDTO>/g;
    const matches = xmlString.matchAll(regex);

    for (const match of matches) {
      const servicioXml = match[1];
      
      // Parse imagenes array
      const imagenes: string[] = [];
      const imagenesRegex = /<string>(.*?)<\/string>/g;
      const imagenesMatches = servicioXml.matchAll(imagenesRegex);
      for (const imgMatch of imagenesMatches) {
        imagenes.push(imgMatch[1]);
      }

      servicios.push({
        Id: parseInt(this.extractXmlValue(servicioXml, 'Id') || '0') || 0,
        Nombre: this.extractXmlValue(servicioXml, 'Nombre') || '',
        Categoria: this.extractXmlValue(servicioXml, 'Categoria') || '',
        Gearbox: this.extractXmlValue(servicioXml, 'Gearbox') || '',
        Ciudad: this.extractXmlValue(servicioXml, 'Ciudad') || '',
        Precio: parseFloat(this.extractXmlValue(servicioXml, 'Precio') || '0') || 0,
        Hotel: this.extractXmlValue(servicioXml, 'Hotel') || '',
        Disponible: this.extractXmlValue(servicioXml, 'Disponible')?.toLowerCase() === 'true',
        Imagenes: imagenes
      });
    }

    console.log(`[Renta Autos Madrid] Parsed ${servicios.length} servicios from XML`);
    return servicios;
  }

  /**
   * Parse cotización from XML using regex
   */
  private parseCotizacionFromXml(xmlString: string): CotizacionDTO {
    const detalles: DetalleCotizacionDTO[] = [];
    const detalleRegex = /<DetalleCotizacionDTO>([\s\S]*?)<\/DetalleCotizacionDTO>/g;
    const detalleMatches = xmlString.matchAll(detalleRegex);

    for (const match of detalleMatches) {
      const detalleXml = match[1];
      detalles.push({
        Descripcion: this.extractXmlValue(detalleXml, 'Descripcion') || '',
        Dias: parseInt(this.extractXmlValue(detalleXml, 'Dias') || '0') || 0,
        PrecioDia: parseFloat(this.extractXmlValue(detalleXml, 'PrecioDia') || '0') || 0
      });
    }

    return {
      Total: parseFloat(this.extractXmlValue(xmlString, 'Total') || '0') || 0,
      Impuesto: parseFloat(this.extractXmlValue(xmlString, 'Impuesto') || '0') || 0,
      Subtotal: parseFloat(this.extractXmlValue(xmlString, 'Subtotal') || '0') || 0,
      Dias: parseInt(this.extractXmlValue(xmlString, 'Dias') || '0') || 0,
      Detalle: detalles
    };
  }

  /**
   * Parse pre-reserva from XML using regex
   */
  private parsePreReservaFromXml(xmlString: string): PreReservaDTO {
    return {
      PreBookingId: parseInt(this.extractXmlValue(xmlString, 'PreBookingId') || '0') || 0,
      ExpiraEn: this.extractXmlValue(xmlString, 'ExpiraEn') || '',
      Exito: this.extractXmlValue(xmlString, 'Exito')?.toLowerCase() === 'true',
      Mensaje: this.extractXmlValue(xmlString, 'Mensaje') || ''
    };
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
