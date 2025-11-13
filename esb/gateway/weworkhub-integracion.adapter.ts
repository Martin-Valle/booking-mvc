// WeWorkHub Integración SOAP Adapter
// Servicio 11 - Hub de Integración Multi-Servicio
// Endpoint: http://inegracion.runasp.net/WS_Integracion.asmx
// WSDL: http://inegracion.runasp.net/WS_Integracion.asmx?wsdl

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Filtros para búsqueda de servicios
 */
export interface FiltrosBusquedaSoapDto {
  serviceType?: string;        // 'HOTEL', 'FLIGHT', 'CAR', 'RESTAURANT', etc.
  ciudad?: string;
  fechaInicio?: string;         // ISO format
  fechaFin?: string;            // ISO format
  precioMin?: number;
  precioMax?: number;
  amenities?: string[];
  clasificacionMin?: number;
  adultos?: number;
  ninos?: number;
}

/**
 * Servicio genérico (puede ser hotel, vuelo, auto, etc.)
 */
export interface ServicioSoapDto {
  idServicio: string;           // SKU o ID único
  serviceType: string;          // Tipo de servicio
  nombre: string;
  ciudad: string;
  precioDesde: number;
  moneda: string;
  clasificacion: number;        // Estrellas/rating
  amenities: string[];
  disponible: boolean;
}

/**
 * Item del itinerario para cotización/reserva
 */
export interface ItemItinerarioSoapDto {
  sku: string;
  serviceType: string;
  fechaInicio: string;          // ISO format
  fechaFin: string;             // ISO format
  unidades: number;             // Cantidad (habitaciones, pasajeros, etc.)
  precioUnitario: number;
}

/**
 * Cotización de reserva
 */
export interface CotizacionSoapDto {
  total: number;
  subtotal: number;
  impuestos: number;
  fees: number;
  moneda: string;
  breakdown: string[];          // Detalles línea por línea
}

/**
 * Datos del usuario/cliente
 */
export interface UsuarioSoapDto {
  IdUsuario?: number;
  UuidUsuario?: string;
  NumeroIdentificacion: string;
  TipoIdentificacion: string;   // 'CEDULA', 'PASAPORTE', etc.
  Email: string;
  Nombres: string;
  Apellidos: string;
  Telefono: string;
  TelefonoSecundario?: string;
  FechaNacimiento?: string;     // ISO format
  Genero?: string;
  Nacionalidad?: string;
  EstadoCivil?: string;
  DireccionPrincipal?: string;
  EmailVerificado?: boolean;
  CuentaBloqueada?: boolean;
  Active?: boolean;
  Password?: string;
}

/**
 * Pre-reserva (hold temporal)
 */
export interface PreReservaSoapDto {
  preBookingId: string;
  expiraEn: string;             // ISO DateTime
  montoBloqueo: number;
  estado: string;               // 'ACTIVE', 'EXPIRED', 'CONFIRMED', etc.
}

/**
 * Reserva confirmada
 */
export interface ReservaSoapDto {
  IdReserva: number;
  UuidReserva: string;
  CodigoReserva: string;
  IdUsuario: number;
  IdHabitacion?: number;
  IdEstadoReserva: number;
  EstadoReserva: string;
  IdRegimenAlimenticio?: number;
  RegimenAlimenticio?: string;
  FechaCheckin: string;
  FechaCheckout: string;
  HoraCheckin?: string;
  HoraCheckout?: string;
  NumeroAdultos: number;
  NumeroNinos: number;
  PrecioNoche: number;
  NumeroNoches?: number;
  Subtotal: number;
  Impuestos?: number;
  Descuentos?: number;
  TotalReserva?: number;
  Moneda: string;
  SolicitudesEspeciales?: string;
  ObservacionesInternas?: string;
  CanalReserva?: string;
  IdReservaExterna?: string;
  SistemaOrigen?: string;
  PrebookingId?: string;
  FechaExpiracionPrereserva?: string;
  IdempotencyKey?: string;
  Sincronizada?: boolean;
  Active?: boolean;
}

// ============================================================================
// SOAP Adapter
// ============================================================================

export class WeWorkHubIntegracionSoapAdapter extends SoapClient {
  constructor(endpoint: EndpointConfig) {
    super(endpoint);
  }

  /**
   * Construir sobre SOAP (ASMX style)
   */
  private buildSoapEnvelope(body: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:tns="http://weworkhub/integracion">
   <soap:Body>
${body}
   </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Helper para encontrar elemento en el documento
   */
  private findElement(doc: Document, tagName: string): Element | null {
    const elements = doc.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Buscar servicios con filtros
   */
  async buscarServicios(filtros: FiltrosBusquedaSoapDto): Promise<ServicioSoapDto[]> {
    const soapBody = `      <tns:buscarServicios>
         <tns:filtros>
            ${filtros.serviceType ? `<serviceType>${filtros.serviceType}</serviceType>` : ''}
            ${filtros.fechaInicio ? `<fechaInicio>${filtros.fechaInicio}</fechaInicio>` : ''}
            ${filtros.fechaFin ? `<fechaFin>${filtros.fechaFin}</fechaFin>` : ''}
            ${filtros.precioMin !== undefined ? `<precioMin>${filtros.precioMin}</precioMin>` : ''}
            ${filtros.precioMax !== undefined ? `<precioMax>${filtros.precioMax}</precioMax>` : ''}
            ${filtros.adultos !== undefined ? `<adultos>${filtros.adultos}</adultos>` : ''}
            ${filtros.ninos !== undefined ? `<ninos>${filtros.ninos}</ninos>` : ''}
         </tns:filtros>
      </tns:buscarServicios>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/buscarServicios'
    );

    return this.parseServiciosList(response);
  }

  /**
   * Obtener detalle de un servicio específico
   */
  async obtenerDetalleServicio(idServicio: string): Promise<ServicioSoapDto> {
    const soapBody = `      <tns:obtenerDetalleServicio>
         <tns:idServicio>${idServicio}</tns:idServicio>
      </tns:obtenerDetalleServicio>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/obtenerDetalleServicio'
    );

    return this.parseServicio(response, 'obtenerDetalleServicioResult');
  }

  /**
   * Verificar disponibilidad de un servicio
   */
  async verificarDisponibilidad(
    sku: string,
    inicio: string,
    fin: string,
    unidades: number
  ): Promise<boolean> {
    const soapBody = `      <tns:verificarDisponibilidad>
         <tns:sku>${sku}</tns:sku>
         <tns:inicio>${inicio}</tns:inicio>
         <tns:fin>${fin}</tns:fin>
         <tns:unidades>${unidades}</tns:unidades>
      </tns:verificarDisponibilidad>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/verificarDisponibilidad'
    );

    const resultElement = this.findElement(response, 'verificarDisponibilidadResult');
    return resultElement?.textContent?.toLowerCase() === 'true';
  }

  /**
   * Cotizar reserva (calcular precio total)
   */
  async cotizarReserva(items: ItemItinerarioSoapDto[]): Promise<CotizacionSoapDto> {
    const itemsXml = items.map(item => `            <ItemItinerarioSoapDto>
               <sku>${item.sku}</sku>
               <serviceType>${item.serviceType}</serviceType>
               <fechaInicio>${item.fechaInicio}</fechaInicio>
               <fechaFin>${item.fechaFin}</fechaFin>
               <unidades>${item.unidades}</unidades>
               <precioUnitario>${item.precioUnitario}</precioUnitario>
            </ItemItinerarioSoapDto>`).join('\n');

    const soapBody = `      <tns:cotizarReserva>
         <tns:items>
${itemsXml}
         </tns:items>
      </tns:cotizarReserva>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/cotizarReserva'
    );

    return this.parseCotizacion(response);
  }

  /**
   * Crear pre-reserva (hold temporal con minutos de expiración)
   */
  async crearPreReserva(
    itinerario: ItemItinerarioSoapDto[],
    cliente: UsuarioSoapDto,
    holdMinutes: number,
    idemKey: string
  ): Promise<PreReservaSoapDto> {
    const itemsXml = itinerario.map(item => `            <ItemItinerarioSoapDto>
               <sku>${item.sku}</sku>
               <serviceType>${item.serviceType}</serviceType>
               <fechaInicio>${item.fechaInicio}</fechaInicio>
               <fechaFin>${item.fechaFin}</fechaFin>
               <unidades>${item.unidades}</unidades>
               <precioUnitario>${item.precioUnitario}</precioUnitario>
            </ItemItinerarioSoapDto>`).join('\n');

    const soapBody = `      <tns:crearPreReserva>
         <tns:itinerario>
${itemsXml}
         </tns:itinerario>
         <tns:cliente>
            <NumeroIdentificacion>${cliente.NumeroIdentificacion}</NumeroIdentificacion>
            <TipoIdentificacion>${cliente.TipoIdentificacion}</TipoIdentificacion>
            <Email>${cliente.Email}</Email>
            <Nombres>${cliente.Nombres}</Nombres>
            <Apellidos>${cliente.Apellidos}</Apellidos>
            <Telefono>${cliente.Telefono}</Telefono>
            <Nacionalidad>${cliente.Nacionalidad || ''}</Nacionalidad>
         </tns:cliente>
         <tns:holdMinutes>${holdMinutes}</tns:holdMinutes>
         <tns:idemKey>${idemKey}</tns:idemKey>
      </tns:crearPreReserva>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/crearPreReserva'
    );

    return this.parsePreReserva(response);
  }

  /**
   * Confirmar reserva (convertir pre-reserva en reserva definitiva)
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: string
  ): Promise<ReservaSoapDto> {
    const soapBody = `      <tns:confirmarReserva>
         <tns:preBookingId>${preBookingId}</tns:preBookingId>
         <tns:metodoPago>${metodoPago}</tns:metodoPago>
         <tns:datosPago>${datosPago}</tns:datosPago>
      </tns:confirmarReserva>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/confirmarReserva'
    );

    return this.parseReserva(response);
  }

  /**
   * Cancelar reserva
   */
  async cancelarReservaIntegracion(bookingId: string, motivo: string): Promise<boolean> {
    const soapBody = `      <tns:cancelarReservaIntegracion>
         <tns:bookingId>${bookingId}</tns:bookingId>
         <tns:motivo>${motivo}</tns:motivo>
      </tns:cancelarReservaIntegracion>`;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(
      envelope,
      'http://weworkhub/integracion/IIntegracionService/cancelarReservaIntegracion'
    );

    const resultElement = this.findElement(response, 'cancelarReservaIntegracionResult');
    return resultElement?.textContent?.toLowerCase() === 'true';
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Parsear lista de servicios
   */
  private parseServiciosList(doc: Document): ServicioSoapDto[] {
    const servicios: ServicioSoapDto[] = [];
    const servicioElements = doc.getElementsByTagName('ServicioSoapDto');

    for (let i = 0; i < servicioElements.length; i++) {
      const element = servicioElements[i];
      servicios.push(this.parseServicioElement(element));
    }

    return servicios;
  }

  /**
   * Parsear un servicio individual
   */
  private parseServicio(doc: Document, resultTag: string): ServicioSoapDto {
    const resultElement = this.findElement(doc, resultTag);
    if (!resultElement) {
      throw new Error(`No se encontró el elemento ${resultTag} en la respuesta`);
    }
    return this.parseServicioElement(resultElement);
  }

  /**
   * Parsear elemento de servicio
   */
  private parseServicioElement(element: Element): ServicioSoapDto {
    const amenities: string[] = [];
    const amenitiesElement = element.getElementsByTagName('amenities')[0];
    if (amenitiesElement) {
      const stringElements = amenitiesElement.getElementsByTagName('string');
      for (let i = 0; i < stringElements.length; i++) {
        const text = stringElements[i].textContent;
        if (text) amenities.push(text);
      }
    }

    return {
      idServicio: this.getTextContent(element, 'idServicio') || '',
      serviceType: this.getTextContent(element, 'serviceType') || '',
      nombre: this.getTextContent(element, 'nombre') || '',
      ciudad: this.getTextContent(element, 'ciudad') || '',
      precioDesde: parseFloat(this.getTextContent(element, 'precioDesde') || '0'),
      moneda: this.getTextContent(element, 'moneda') || 'USD',
      clasificacion: parseInt(this.getTextContent(element, 'clasificacion') || '0'),
      amenities,
      disponible: this.getTextContent(element, 'disponible')?.toLowerCase() === 'true'
    };
  }

  /**
   * Parsear cotización
   */
  private parseCotizacion(doc: Document): CotizacionSoapDto {
    const resultElement = this.findElement(doc, 'cotizarReservaResult');
    if (!resultElement) {
      throw new Error('No se encontró cotizarReservaResult en la respuesta');
    }

    const breakdown: string[] = [];
    const breakdownElement = resultElement.getElementsByTagName('breakdown')[0];
    if (breakdownElement) {
      const stringElements = breakdownElement.getElementsByTagName('string');
      for (let i = 0; i < stringElements.length; i++) {
        const text = stringElements[i].textContent;
        if (text) breakdown.push(text);
      }
    }

    return {
      total: parseFloat(this.getTextContent(resultElement, 'total') || '0'),
      subtotal: parseFloat(this.getTextContent(resultElement, 'subtotal') || '0'),
      impuestos: parseFloat(this.getTextContent(resultElement, 'impuestos') || '0'),
      fees: parseFloat(this.getTextContent(resultElement, 'fees') || '0'),
      moneda: this.getTextContent(resultElement, 'moneda') || 'USD',
      breakdown
    };
  }

  /**
   * Parsear pre-reserva
   */
  private parsePreReserva(doc: Document): PreReservaSoapDto {
    const resultElement = this.findElement(doc, 'crearPreReservaResult');
    if (!resultElement) {
      throw new Error('No se encontró crearPreReservaResult en la respuesta');
    }

    return {
      preBookingId: this.getTextContent(resultElement, 'preBookingId') || '',
      expiraEn: this.getTextContent(resultElement, 'expiraEn') || '',
      montoBloqueo: parseFloat(this.getTextContent(resultElement, 'montoBloqueo') || '0'),
      estado: this.getTextContent(resultElement, 'estado') || ''
    };
  }

  /**
   * Parsear reserva
   */
  private parseReserva(doc: Document): ReservaSoapDto {
    const resultElement = this.findElement(doc, 'confirmarReservaResult');
    if (!resultElement) {
      throw new Error('No se encontró confirmarReservaResult en la respuesta');
    }

    return {
      IdReserva: parseInt(this.getTextContent(resultElement, 'IdReserva') || '0'),
      UuidReserva: this.getTextContent(resultElement, 'UuidReserva') || '',
      CodigoReserva: this.getTextContent(resultElement, 'CodigoReserva') || '',
      IdUsuario: parseInt(this.getTextContent(resultElement, 'IdUsuario') || '0'),
      IdHabitacion: parseInt(this.getTextContent(resultElement, 'IdHabitacion') || '0') || undefined,
      IdEstadoReserva: parseInt(this.getTextContent(resultElement, 'IdEstadoReserva') || '0'),
      EstadoReserva: this.getTextContent(resultElement, 'EstadoReserva') || '',
      IdRegimenAlimenticio: parseInt(this.getTextContent(resultElement, 'IdRegimenAlimenticio') || '0') || undefined,
      RegimenAlimenticio: this.getTextContent(resultElement, 'RegimenAlimenticio') || undefined,
      FechaCheckin: this.getTextContent(resultElement, 'FechaCheckin') || '',
      FechaCheckout: this.getTextContent(resultElement, 'FechaCheckout') || '',
      HoraCheckin: this.getTextContent(resultElement, 'HoraCheckin') || undefined,
      HoraCheckout: this.getTextContent(resultElement, 'HoraCheckout') || undefined,
      NumeroAdultos: parseInt(this.getTextContent(resultElement, 'NumeroAdultos') || '0'),
      NumeroNinos: parseInt(this.getTextContent(resultElement, 'NumeroNinos') || '0'),
      PrecioNoche: parseFloat(this.getTextContent(resultElement, 'PrecioNoche') || '0'),
      NumeroNoches: parseInt(this.getTextContent(resultElement, 'NumeroNoches') || '0') || undefined,
      Subtotal: parseFloat(this.getTextContent(resultElement, 'Subtotal') || '0'),
      Impuestos: parseFloat(this.getTextContent(resultElement, 'Impuestos') || '0') || undefined,
      Descuentos: parseFloat(this.getTextContent(resultElement, 'Descuentos') || '0') || undefined,
      TotalReserva: parseFloat(this.getTextContent(resultElement, 'TotalReserva') || '0') || undefined,
      Moneda: this.getTextContent(resultElement, 'Moneda') || 'USD',
      SolicitudesEspeciales: this.getTextContent(resultElement, 'SolicitudesEspeciales') || undefined,
      ObservacionesInternas: this.getTextContent(resultElement, 'ObservacionesInternas') || undefined,
      CanalReserva: this.getTextContent(resultElement, 'CanalReserva') || undefined,
      IdReservaExterna: this.getTextContent(resultElement, 'IdReservaExterna') || undefined,
      SistemaOrigen: this.getTextContent(resultElement, 'SistemaOrigen') || undefined,
      PrebookingId: this.getTextContent(resultElement, 'PrebookingId') || undefined,
      FechaExpiracionPrereserva: this.getTextContent(resultElement, 'FechaExpiracionPrereserva') || undefined,
      IdempotencyKey: this.getTextContent(resultElement, 'IdempotencyKey') || undefined,
      Sincronizada: this.getTextContent(resultElement, 'Sincronizada')?.toLowerCase() === 'true' || undefined,
      Active: this.getTextContent(resultElement, 'Active')?.toLowerCase() === 'true' || undefined
    };
  }

  /**
   * Obtener contenido de texto de un elemento hijo
   */
  private getTextContent(parent: Element, tagName: string): string | undefined {
    const elements = parent.getElementsByTagName(tagName);
    if (elements.length > 0) {
      const text = elements[0].textContent;
      return text && text.trim() !== '' ? text : undefined;
    }
    return undefined;
  }
}
