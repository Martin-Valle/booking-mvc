/**
 * Alquiler Augye SOAP Service Adapter
 * Service 15 - Car Rental Service
 * Endpoint: http://alquileraugye.runasp.net/AutosIntegracion.asmx
 * Namespace: http://tuservidor.com/booking/autos
 * Type: ASMX Car Rental Service
 * Operations: 7
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface FiltrosAutosDTO {
  serviceType?: string;
  ciudad?: string;
  categoria?: string;
  gearbox?: string;
  pickupOffice?: string;
  dropoffOffice?: string;
  pickupAt?: string;  // DateTime ISO
  dropoffAt?: string; // DateTime ISO
  driverAge?: number;
  precioMin?: number;
  precioMax?: number;
  page: number;
  pageSize: number;
}

export interface ServicioAutoResumenDTO {
  sku: number;
  marca: string;
  modelo: string;
  categoria: string;
  gearbox: string;
  precioDia: number;
  ciudad: string;
  imagen: string;
}

export interface ServicioAutoDetalleDTO {
  sku: number;
  marca: string;
  modelo: string;
  categoria: string;
  gearbox: string;
  ciudad: string;
  hotel: string;
  pickupOffice: string;
  dropoffOffice: string;
  precioDia: number;
  imagenes: string[];
  politicas: string;
  reglas: string;
}

export interface ItemCotizacionDTO {
  sku: number;
  dias: number;
  precioDia: number;
}

export interface CotizacionDTO {
  subtotal: number;
  impuestos: number;
  total: number;
  items: ItemCotizacionDTO[];
}

export interface PreReservaDTO {
  preBookingId: string;
  expiraEn: string; // DateTime ISO
}

export interface DatosPagoDTO {
  metodo: string;
  referencia: string;
  monto: number;
}

export interface ReservaAutoDTO {
  bookingId: string;
  estado: string;
  reservaId: number;
}

// ==================== Adapter ====================

export class AlquilerAugyeSoapAdapter extends SoapClient {
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
  async buscarServicios(filtros: FiltrosAutosDTO): Promise<ServicioAutoResumenDTO[]> {
    console.log('[Alquiler Augye] 🔍 Parámetros recibidos:', filtros);
    
    const soapBody = `
      <buscarServicios xmlns="http://tuservidor.com/booking/autos">
        <filtros>
          ${filtros.serviceType ? `<serviceType>${filtros.serviceType}</serviceType>` : '<serviceType xsi:nil="true" />'}
          ${filtros.ciudad ? `<ciudad>${filtros.ciudad}</ciudad>` : '<ciudad xsi:nil="true" />'}
          ${filtros.categoria ? `<categoria>${filtros.categoria}</categoria>` : '<categoria xsi:nil="true" />'}
          ${filtros.gearbox ? `<gearbox>${filtros.gearbox}</gearbox>` : '<gearbox xsi:nil="true" />'}
          ${filtros.pickupOffice ? `<pickupOffice>${filtros.pickupOffice}</pickupOffice>` : '<pickupOffice xsi:nil="true" />'}
          ${filtros.dropoffOffice ? `<dropoffOffice>${filtros.dropoffOffice}</dropoffOffice>` : '<dropoffOffice xsi:nil="true" />'}
          ${filtros.pickupAt ? `<pickupAt>${filtros.pickupAt}</pickupAt>` : '<pickupAt xsi:nil="true" />'}
          ${filtros.dropoffAt ? `<dropoffAt>${filtros.dropoffAt}</dropoffAt>` : '<dropoffAt xsi:nil="true" />'}
          ${filtros.driverAge !== undefined ? `<driverAge>${filtros.driverAge}</driverAge>` : '<driverAge xsi:nil="true" />'}
          ${filtros.precioMin !== undefined ? `<precioMin>${filtros.precioMin}</precioMin>` : '<precioMin xsi:nil="true" />'}
          ${filtros.precioMax !== undefined ? `<precioMax>${filtros.precioMax}</precioMax>` : '<precioMax xsi:nil="true" />'}
          <page>${filtros.page}</page>
          <pageSize>${filtros.pageSize}</pageSize>
        </filtros>
      </buscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    
    try {
      // Usar callRaw() para obtener XML como string
      const rawResponse = await this.callRaw(envelope, 'http://tuservidor.com/booking/autos/buscarServicios');
      console.log('[Alquiler Augye] 📄 Raw XML Response length:', rawResponse.length);
      console.log('[Alquiler Augye] 📄 Raw XML Response:', rawResponse.substring(0, 1000)); // Primeros 1000 caracteres
      
      // Contar elementos usando regex
      const matches = rawResponse.match(/<ServicioAutoResumen>/g);
      console.log('[Alquiler Augye] 🚗 ServicioAutoResumen elements found:', matches ? matches.length : 0);
      
      return this.parseServiciosResumenFromXml(rawResponse);
    } catch (error: any) {
      console.error('[Alquiler Augye] ❌ Error en buscarServicios:', error.message);
      throw error;
    }
  }

  /**
   * 2. obtenerDetalleServicio - Detalle completo del auto
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ServicioAutoDetalleDTO> {
    const soapBody = `
      <obtenerDetalleServicio xmlns="http://tuservidor.com/booking/autos">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/obtenerDetalleServicio');
    return this.parseServicioDetalle(response);
  }

  /**
   * 3. verificarDisponibilidad - Valida disponibilidad por fechas
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: string,
    fin: string,
    unidades: number
  ): Promise<boolean> {
    const soapBody = `
      <verificarDisponibilidad xmlns="http://tuservidor.com/booking/autos">
        <sku>${sku}</sku>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/verificarDisponibilidad');
    
    const result = this.getNodeText(response, 'verificarDisponibilidadResult');
    return result.toLowerCase() === 'true';
  }

  /**
   * 4. cotizarReserva - Calcula precio total (impuestos/fees)
   */
  async cotizarReserva(items: ItemCotizacionDTO[]): Promise<CotizacionDTO> {
    const itemsXml = items.map(item => `
      <ItemCotizacion>
        <sku>${item.sku}</sku>
        <dias>${item.dias}</dias>
        <precioDia>${item.precioDia}</precioDia>
      </ItemCotizacion>
    `).join('');

    const soapBody = `
      <cotizarReserva xmlns="http://tuservidor.com/booking/autos">
        <items>
          ${itemsXml}
        </items>
      </cotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/cotizarReserva');
    return this.parseCotizacion(response);
  }

  /**
   * 5. crearPreReserva - Crea pre-reserva y bloquea temporalmente
   */
  async crearPreReserva(
    itinerario: ItemCotizacionDTO[],
    clienteId: number,
    holdMinutes: number,
    idemKey: string,
    pickupAt: string,
    dropoffAt: string,
    autoId: number
  ): Promise<PreReservaDTO> {
    const itinerarioXml = itinerario.map(item => `
      <ItemCotizacion>
        <sku>${item.sku}</sku>
        <dias>${item.dias}</dias>
        <precioDia>${item.precioDia}</precioDia>
      </ItemCotizacion>
    `).join('');

    const soapBody = `
      <crearPreReserva xmlns="http://tuservidor.com/booking/autos">
        <itinerario>
          ${itinerarioXml}
        </itinerario>
        <clienteId>${clienteId}</clienteId>
        <holdMinutes>${holdMinutes}</holdMinutes>
        <idemKey>${idemKey}</idemKey>
        <pickupAt>${pickupAt}</pickupAt>
        <dropoffAt>${dropoffAt}</dropoffAt>
        <autoId>${autoId}</autoId>
      </crearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/crearPreReserva');
    return this.parsePreReserva(response);
  }

  /**
   * 6. confirmarReserva - Confirma y emite reserva
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: DatosPagoDTO
  ): Promise<ReservaAutoDTO> {
    const soapBody = `
      <confirmarReserva xmlns="http://tuservidor.com/booking/autos">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>
          <metodo>${datosPago.metodo}</metodo>
          <referencia>${datosPago.referencia}</referencia>
          <monto>${datosPago.monto}</monto>
        </datosPago>
      </confirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/confirmarReserva');
    return this.parseReservaAuto(response);
  }

  /**
   * 7. cancelarReservaIntegracion - Cancela con reglas tarifarias
   */
  async cancelarReservaIntegracion(
    bookingId: string,
    motivo: string
  ): Promise<boolean> {
    const soapBody = `
      <cancelarReservaIntegracion xmlns="http://tuservidor.com/booking/autos">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/cancelarReservaIntegracion');
    
    const result = this.getNodeText(response, 'cancelarReservaIntegracionResult');
    return result.toLowerCase() === 'true';
  }

  // ==================== Parsers ====================

  /**
   * Parsear lista de servicios desde XML crudo (raw string)
   * Usa regex para extraer elementos ServicioAutoResumen
   */
  private parseServiciosResumenFromXml(xmlString: string): ServicioAutoResumenDTO[] {
    const servicios: ServicioAutoResumenDTO[] = [];
    
    // Extraer todos los bloques <ServicioAutoResumen>...</ServicioAutoResumen>
    const servicioRegex = /<ServicioAutoResumen>([\s\S]*?)<\/ServicioAutoResumen>/g;
    const matches = xmlString.matchAll(servicioRegex);
    
    for (const match of matches) {
      const servicioXml = match[1]; // Contenido entre tags
      
      const servicio: ServicioAutoResumenDTO = {
        sku: parseInt(this.extractXmlValue(servicioXml, 'sku') || '0'),
        marca: this.extractXmlValue(servicioXml, 'marca') || '',
        modelo: this.extractXmlValue(servicioXml, 'modelo') || '',
        categoria: this.extractXmlValue(servicioXml, 'categoria') || '',
        gearbox: this.extractXmlValue(servicioXml, 'gearbox') || '',
        precioDia: parseFloat(this.extractXmlValue(servicioXml, 'precioDia') || '0'),
        ciudad: this.extractXmlValue(servicioXml, 'ciudad') || '',
        imagen: this.extractXmlValue(servicioXml, 'imagen') || ''
      };
      
      servicios.push(servicio);
    }
    
    console.log('[Alquiler Augye] ✅ Parsed servicios:', servicios.length);
    if (servicios.length > 0) {
      console.log('[Alquiler Augye] 🔍 First servicio:', servicios[0]);
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

  // ==================== Parsers (DOM-based - legacy) ====================

  private parseServiciosResumen(doc: Document): ServicioAutoResumenDTO[] {
    const servicios: ServicioAutoResumenDTO[] = [];
    const nodes = doc.getElementsByTagName('ServicioAutoResumen');

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      servicios.push({
        sku: parseInt(this.getChildText(node, 'sku')) || 0,
        marca: this.getChildText(node, 'marca'),
        modelo: this.getChildText(node, 'modelo'),
        categoria: this.getChildText(node, 'categoria'),
        gearbox: this.getChildText(node, 'gearbox'),
        precioDia: parseFloat(this.getChildText(node, 'precioDia')) || 0,
        ciudad: this.getChildText(node, 'ciudad'),
        imagen: this.getChildText(node, 'imagen')
      });
    }

    return servicios;
  }

  private parseServicioDetalle(doc: Document): ServicioAutoDetalleDTO {
    // Parse imagenes array
    const imagenes: string[] = [];
    const imagenesNodes = doc.getElementsByTagName('imagenes')[0];
    if (imagenesNodes) {
      const stringNodes = imagenesNodes.getElementsByTagName('string');
      for (let i = 0; i < stringNodes.length; i++) {
        imagenes.push(stringNodes[i].textContent || '');
      }
    }

    return {
      sku: parseInt(this.getNodeText(doc, 'sku')) || 0,
      marca: this.getNodeText(doc, 'marca'),
      modelo: this.getNodeText(doc, 'modelo'),
      categoria: this.getNodeText(doc, 'categoria'),
      gearbox: this.getNodeText(doc, 'gearbox'),
      ciudad: this.getNodeText(doc, 'ciudad'),
      hotel: this.getNodeText(doc, 'hotel'),
      pickupOffice: this.getNodeText(doc, 'pickupOffice'),
      dropoffOffice: this.getNodeText(doc, 'dropoffOffice'),
      precioDia: parseFloat(this.getNodeText(doc, 'precioDia')) || 0,
      imagenes: imagenes,
      politicas: this.getNodeText(doc, 'politicas'),
      reglas: this.getNodeText(doc, 'reglas')
    };
  }

  private parseCotizacion(doc: Document): CotizacionDTO {
    // Parse items array
    const items: ItemCotizacionDTO[] = [];
    const itemNodes = doc.getElementsByTagName('ItemCotizacion');
    for (let i = 0; i < itemNodes.length; i++) {
      const node = itemNodes[i];
      items.push({
        sku: parseInt(this.getChildText(node, 'sku')) || 0,
        dias: parseInt(this.getChildText(node, 'dias')) || 0,
        precioDia: parseFloat(this.getChildText(node, 'precioDia')) || 0
      });
    }

    return {
      subtotal: parseFloat(this.getNodeText(doc, 'subtotal')) || 0,
      impuestos: parseFloat(this.getNodeText(doc, 'impuestos')) || 0,
      total: parseFloat(this.getNodeText(doc, 'total')) || 0,
      items: items
    };
  }

  private parsePreReserva(doc: Document): PreReservaDTO {
    return {
      preBookingId: this.getNodeText(doc, 'preBookingId'),
      expiraEn: this.getNodeText(doc, 'expiraEn')
    };
  }

  private parseReservaAuto(doc: Document): ReservaAutoDTO {
    return {
      bookingId: this.getNodeText(doc, 'bookingId'),
      estado: this.getNodeText(doc, 'estado'),
      reservaId: parseInt(this.getNodeText(doc, 'reservaId')) || 0
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
