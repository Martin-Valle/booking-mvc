import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';

// ========================================
// DTOs y Tipos
// ========================================

export interface EspacioDetallado {
  id: number;
  nombre: string;
  nombreHotel: string;
  nombreTipoServicio: string;
  nombreTipoAlimentacion: string;
  moneda: string;
  costoDiario: number;
  ubicacion: string;
  descripcionDelLugar: string;
  capacidad: string;
  puntuacion: number;
  amenidades: string[];
  politicas: string[];
  imagenes: string[];
  esActivo: boolean;
}

export interface ReservaDetalle {
  espacioId: number;
  hotelId: number;
  roomType: string;
  numberBeds: number;
  occupancyAdultos: number;
  occupancyNinos: number;
  board: string;
  amenities: string[];
  breakfastIncluded: boolean;
  checkIn: Date;
  checkOut: Date;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  preBookingId: string;
  bookingId: string;
  estado: string;
  expiraEn: Date;
}

export interface ResultadoPaginado {
  paginaActual: number;
  tamanoPagina: number;
  totalRegistros: number;
  datos: EspacioDetallado[];
}

// ========================================
// Real de Cuenca Hotel SOAP Adapter
// ========================================

export class RealCuencaHotelSoapAdapter extends SoapClient {
  
  /**
   * Helper: Convierte Date a formato SQL Server datetime (sin 'Z')
   * SQL Server datetime no soporta 'Z' ni milisegundos: yyyy-MM-ddTHH:mm:ss
   */
  private formatDateForSoap(date: Date): string {
    return date.toISOString().substring(0, 19); // Elimina '.000Z'
  }
  
  /**
   * 1. Busca espacios disponibles según ubicación, nombre del hotel y rango de fechas
   */
  async buscarServicios(ubicacion?: string, hotel?: string, fechaInicio?: Date, fechaFin?: Date): Promise<EspacioDetallado[]> {
    // Omitir fechas si no están presentes para evitar FormatException
    const fechaInicioXml = fechaInicio ? `<fechaInicio>${this.formatDateForSoap(fechaInicio)}</fechaInicio>` : '';
    const fechaFinXml = fechaFin ? `<fechaFin>${this.formatDateForSoap(fechaFin)}</fechaFin>` : '';
    
    const body = `
      <buscarServicios xmlns="http://tempuri.org/">
        <ubicacion>${ubicacion || ''}</ubicacion>
        <hotel>${hotel || ''}</hotel>
        ${fechaInicioXml}
        ${fechaFinXml}
      </buscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/buscarServicios"');
    
    const espacios: EspacioDetallado[] = [];
    const items = xml.getElementsByTagName('DTO_WS_IntegracionDetalleEspacio');
    
    for (let i = 0; i < items.length; i++) {
      espacios.push(this.parseEspacioFromElement(items[i]));
    }
    
    return espacios;
  }

  /**
   * 2. Obtiene un espacio detallado por su ID
   */
  async seleccionarEspacioDetalladoPorId(id: number): Promise<EspacioDetallado> {
    const body = `
      <seleccionarEspacioDetalladoPorId xmlns="http://tempuri.org/">
        <id>${id}</id>
      </seleccionarEspacioDetalladoPorId>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/seleccionarEspacioDetalladoPorId"');
    
    const resultEl = xml.getElementsByTagName('seleccionarEspacioDetalladoPorIdResult')[0];
    if (!resultEl) {
      throw new Error(`Espacio con id ${id} no encontrado`);
    }
    
    return this.parseEspacioFromElement(resultEl);
  }

  /**
   * 3. Verifica si un espacio está disponible entre las fechas indicadas
   */
  async verificarDisponibilidad(espacioId: number, fechaInicio: Date, fechaFin: Date): Promise<boolean> {
    const body = `
      <verificarDisponibilidad xmlns="http://tempuri.org/">
        <espacioId>${espacioId}</espacioId>
        <fechaInicio>${this.formatDateForSoap(fechaInicio)}</fechaInicio>
        <fechaFin>${this.formatDateForSoap(fechaFin)}</fechaFin>
      </verificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/verificarDisponibilidad"');
    
    const resultEl = xml.getElementsByTagName('verificarDisponibilidadResult')[0];
    return resultEl?.textContent?.toLowerCase() === 'true';
  }

  /**
   * 4. Calcula el costo total estimado de una reserva
   */
  async cotizarReserva(espacioId: number, checkIn: Date, checkOut: Date): Promise<ReservaDetalle> {
    const body = `
      <cotizarReserva xmlns="http://tempuri.org/">
        <espacioId>${espacioId}</espacioId>
        <checkIn>${this.formatDateForSoap(checkIn)}</checkIn>
        <checkOut>${this.formatDateForSoap(checkOut)}</checkOut>
      </cotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/cotizarReserva"');
    
    const resultEl = xml.getElementsByTagName('cotizarReservaResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo obtener la cotización');
    }
    
    return this.parseReservaFromElement(resultEl);
  }

  /**
   * 5. Bloquea disponibilidad temporalmente (pre-reserva)
   */
  async crearPreReserva(espacioId: number, usuarioId: number, checkIn: Date, checkOut: Date, holdMinutes: number): Promise<ReservaDetalle> {
    const body = `
      <crearPreReserva xmlns="http://tempuri.org/">
        <espacioId>${espacioId}</espacioId>
        <usuarioId>${usuarioId}</usuarioId>
        <checkIn>${this.formatDateForSoap(checkIn)}</checkIn>
        <checkOut>${this.formatDateForSoap(checkOut)}</checkOut>
        <holdMinutes>${holdMinutes}</holdMinutes>
      </crearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/crearPreReserva"');
    
    const resultEl = xml.getElementsByTagName('crearPreReservaResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo crear la pre-reserva');
    }
    
    return this.parseReservaFromElement(resultEl);
  }

  /**
   * 6. Confirma y emite reserva
   */
  async confirmarReserva(preBookingId: string, metodoPago: string, datosPago: string): Promise<ReservaDetalle> {
    const body = `
      <confirmarReserva xmlns="http://tempuri.org/">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>${datosPago}</datosPago>
      </confirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/confirmarReserva"');
    
    const resultEl = xml.getElementsByTagName('confirmarReservaResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo confirmar la reserva');
    }
    
    return this.parseReservaFromElement(resultEl);
  }

  /**
   * 7. Cancela reserva con reglas tarifarias
   */
  async cancelarReservaIntegracion(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <cancelarReservaIntegracion xmlns="http://tempuri.org/">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/cancelarReservaIntegracion"');
    
    const resultEl = xml.getElementsByTagName('cancelarReservaIntegracionResult')[0];
    return resultEl?.textContent?.toLowerCase() === 'true';
  }

  /**
   * 8. Obtiene catálogo con los nombres de hoteles activos
   */
  async obtenerHoteles(): Promise<string[]> {
    const body = `
      <obtenerHoteles xmlns="http://tempuri.org/" />
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/obtenerHoteles"');
    
    const hoteles: string[] = [];
    const items = xml.getElementsByTagName('string');
    
    for (let i = 0; i < items.length; i++) {
      const texto = items[i].textContent;
      if (texto) hoteles.push(texto);
    }
    
    return hoteles;
  }

  /**
   * 9. Obtiene catálogo con las ubicaciones únicas de los espacios activos
   */
  async obtenerUbicaciones(): Promise<string[]> {
    const body = `
      <obtenerUbicaciones xmlns="http://tempuri.org/" />
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/obtenerUbicaciones"');
    
    const ubicaciones: string[] = [];
    const items = xml.getElementsByTagName('string');
    
    for (let i = 0; i < items.length; i++) {
      const texto = items[i].textContent;
      if (texto) ubicaciones.push(texto);
    }
    
    return ubicaciones;
  }

  /**
   * 10. Obtiene espacios activos paginados
   */
  async seleccionarEspaciosDetalladosPorPaginas(pagina: number, tamanoPagina: number): Promise<ResultadoPaginado> {
    const body = `
      <seleccionarEspaciosDetalladosPorPaginas xmlns="http://tempuri.org/">
        <pagina>${pagina}</pagina>
        <tamanoPagina>${tamanoPagina}</tamanoPagina>
      </seleccionarEspaciosDetalladosPorPaginas>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/seleccionarEspaciosDetalladosPorPaginas"');
    
    const resultEl = xml.getElementsByTagName('seleccionarEspaciosDetalladosPorPaginasResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo obtener los espacios paginados');
    }
    
    return this.parseResultadoPaginadoFromElement(resultEl);
  }

  /**
   * 11. Obtiene espacios detallados con filtros y paginación
   */
  async seleccionarEspaciosDetalladosConFiltro(
    ubicacion: string,
    hotel: string,
    fechaInicio: Date,
    fechaFin: Date,
    pagina: number,
    tamanoPagina: number
  ): Promise<ResultadoPaginado> {
    const body = `
      <seleccionarEspaciosDetalladosConFiltro xmlns="http://tempuri.org/">
        <ubicacion>${ubicacion}</ubicacion>
        <hotel>${hotel}</hotel>
        <fechaInicio>${this.formatDateForSoap(fechaInicio)}</fechaInicio>
        <fechaFin>${this.formatDateForSoap(fechaFin)}</fechaFin>
        <pagina>${pagina}</pagina>
        <tamanoPagina>${tamanoPagina}</tamanoPagina>
      </seleccionarEspaciosDetalladosConFiltro>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tempuri.org/seleccionarEspaciosDetalladosConFiltro"');
    
    const resultEl = xml.getElementsByTagName('seleccionarEspaciosDetalladosConFiltroResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo obtener los espacios filtrados');
    }
    
    return this.parseResultadoPaginadoFromElement(resultEl);
  }

  // ========================================
  // Helpers de Parseo
  // ========================================

  private parseEspacioFromElement(el: Element): EspacioDetallado {
    return {
      id: parseInt(this.getElementText(el, 'Id') || '0'),
      nombre: this.getElementText(el, 'Nombre') || '',
      nombreHotel: this.getElementText(el, 'NombreHotel') || '',
      nombreTipoServicio: this.getElementText(el, 'NombreTipoServicio') || '',
      nombreTipoAlimentacion: this.getElementText(el, 'NombreTipoAlimentacion') || '',
      moneda: this.getElementText(el, 'Moneda') || '',
      costoDiario: parseFloat(this.getElementText(el, 'CostoDiario') || '0'),
      ubicacion: this.getElementText(el, 'Ubicacion') || '',
      descripcionDelLugar: this.getElementText(el, 'DescripcionDelLugar') || '',
      capacidad: this.getElementText(el, 'Capacidad') || '',
      puntuacion: parseInt(this.getElementText(el, 'Puntuacion') || '0'),
      amenidades: this.parseStringArray(el, 'Amenidades'),
      politicas: this.parseStringArray(el, 'Politicas'),
      imagenes: this.parseStringArray(el, 'Imagenes'),
      esActivo: this.getElementText(el, 'EsActivo')?.toLowerCase() === 'true'
    };
  }

  private parseReservaFromElement(el: Element): ReservaDetalle {
    return {
      espacioId: parseInt(this.getElementText(el, 'EspacioId') || '0'),
      hotelId: parseInt(this.getElementText(el, 'HotelId') || '0'),
      roomType: this.getElementText(el, 'RoomType') || '',
      numberBeds: parseInt(this.getElementText(el, 'NumberBeds') || '0'),
      occupancyAdultos: parseInt(this.getElementText(el, 'OccupancyAdultos') || '0'),
      occupancyNinos: parseInt(this.getElementText(el, 'OccupancyNinos') || '0'),
      board: this.getElementText(el, 'Board') || '',
      amenities: this.parseStringArray(el, 'Amenities'),
      breakfastIncluded: this.getElementText(el, 'BreakfastIncluded')?.toLowerCase() === 'true',
      checkIn: new Date(this.getElementText(el, 'CheckIn') || ''),
      checkOut: new Date(this.getElementText(el, 'CheckOut') || ''),
      pricePerNight: parseFloat(this.getElementText(el, 'PricePerNight') || '0'),
      totalPrice: parseFloat(this.getElementText(el, 'TotalPrice') || '0'),
      currency: this.getElementText(el, 'Currency') || '',
      preBookingId: this.getElementText(el, 'PreBookingId') || '',
      bookingId: this.getElementText(el, 'BookingId') || '',
      estado: this.getElementText(el, 'Estado') || '',
      expiraEn: new Date(this.getElementText(el, 'ExpiraEn') || '')
    };
  }

  private parseResultadoPaginadoFromElement(el: Element): ResultadoPaginado {
    const datosEl = el.getElementsByTagName('Datos')[0];
    const espacios: EspacioDetallado[] = [];
    
    if (datosEl) {
      const items = datosEl.getElementsByTagName('DTO_WS_IntegracionDetalleEspacio');
      for (let i = 0; i < items.length; i++) {
        espacios.push(this.parseEspacioFromElement(items[i]));
      }
    }
    
    return {
      paginaActual: parseInt(this.getElementText(el, 'PaginaActual') || '1'),
      tamanoPagina: parseInt(this.getElementText(el, 'TamanoPagina') || '10'),
      totalRegistros: parseInt(this.getElementText(el, 'TotalRegistros') || '0'),
      datos: espacios
    };
  }

  private parseStringArray(parent: Element, tagName: string): string[] {
    const arrayEl = parent.getElementsByTagName(tagName)[0];
    if (!arrayEl) return [];
    
    const items: string[] = [];
    const strings = arrayEl.getElementsByTagName('string');
    
    for (let i = 0; i < strings.length; i++) {
      const texto = strings[i].textContent;
      if (texto) items.push(texto);
    }
    
    return items;
  }

  private getElementText(parent: Element, tagName: string): string | null {
    const el = parent.getElementsByTagName(tagName)[0];
    return el?.textContent || null;
  }
}
