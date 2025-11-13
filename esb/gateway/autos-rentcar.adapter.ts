/**
 * 🚗 Adaptador SOAP para Autos RentCar
 * Endpoint: http://autos.runasp.net/WS_IntegracionAutos.asmx
 * Namespace: http://tuservidor.com/booking/autos
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';

// ==================== DTOs ====================

export interface FiltrosAutos {
  serviceType?: string;
  ciudad?: string;
  categoria?: string;
  gearbox?: string;
  pickupOffice?: string;
  dropoffOffice?: string;
  pickupAt?: Date;
  dropoffAt?: Date;
  driverAge?: number;
  precioMin?: number;
  precioMax?: number;
  page?: number;
  pageSize?: number;
}

export interface ServicioAutoResumen {
  sku: number;
  marca: string;
  modelo: string;
  categoria: string;
  gearbox: string;
  precioDia: number;
  ciudad: string;
  imagen: string;
}

export interface ServicioAutoDetalle {
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

export interface ItemCotizacion {
  sku: number;
  dias: number;
  precioDia: number;
}

export interface Cotizacion {
  subtotal: number;
  impuestos: number;
  total: number;
  items: ItemCotizacion[];
}

export interface PreReserva {
  preBookingId: string;
  expiraEn: Date;
}

export interface DatosPago {
  metodo: string;
  referencia: string;
  monto: number;
}

export interface ReservaAuto {
  bookingId: string;
  estado: string;
  reservaId: number;
}

// ==================== Adaptador SOAP ====================

export class AutosRentCarSoapAdapter extends SoapClient {
  
  /**
   * 1️⃣ Búsqueda unificada por filtros
   */
  async buscarServicios(filtros?: FiltrosAutos): Promise<ServicioAutoResumen[]> {
    const f = filtros || {};
    
    // Solo incluir fechas si están presentes
    const pickupXml = f.pickupAt ? `<pickupAt>${f.pickupAt.toISOString()}</pickupAt>` : '';
    const dropoffXml = f.dropoffAt ? `<dropoffAt>${f.dropoffAt.toISOString()}</dropoffAt>` : '';
    
    const body = `
      <BuscarServicios xmlns="http://tuservidor.com/booking/autos">
        <filtros>
          <serviceType>${f.serviceType || ''}</serviceType>
          <ciudad>${f.ciudad || ''}</ciudad>
          <categoria>${f.categoria || ''}</categoria>
          <gearbox>${f.gearbox || ''}</gearbox>
          <pickupOffice>${f.pickupOffice || ''}</pickupOffice>
          <dropoffOffice>${f.dropoffOffice || ''}</dropoffOffice>
          ${pickupXml}
          ${dropoffXml}
          <driverAge>${f.driverAge || 25}</driverAge>
          <precioMin>${f.precioMin || 0}</precioMin>
          <precioMax>${f.precioMax || 9999}</precioMax>
          <page>${f.page || 1}</page>
          <pageSize>${f.pageSize || 20}</pageSize>
        </filtros>
      </BuscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/BuscarServicios"');
    
    const autos: ServicioAutoResumen[] = [];
    const items = xml.getElementsByTagName('ServicioAutoResumen');
    
    for (let i = 0; i < items.length; i++) {
      autos.push(this.parseAutoResumenFromElement(items[i]));
    }
    
    return autos;
  }

  /**
   * 2️⃣ Detalle completo del auto
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ServicioAutoDetalle> {
    const body = `
      <ObtenerDetalleServicio xmlns="http://tuservidor.com/booking/autos">
        <idServicio>${idServicio}</idServicio>
      </ObtenerDetalleServicio>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/ObtenerDetalleServicio"');
    
    const resultElement = xml.getElementsByTagName('ObtenerDetalleServicioResult')[0];
    if (!resultElement) throw new Error('No se encontró el detalle del auto');
    
    return this.parseAutoDetalleFromElement(resultElement);
  }

  /**
   * 3️⃣ Valida disponibilidad por fechas
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<boolean> {
    const body = `
      <VerificarDisponibilidad xmlns="http://tuservidor.com/booking/autos">
        <sku>${sku}</sku>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </VerificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/VerificarDisponibilidad"');
    
    const result = this.getTagValue(xml, 'VerificarDisponibilidadResult');
    return result.toLowerCase() === 'true';
  }

  /**
   * 4️⃣ Calcula precio total (impuestos/fees)
   */
  async cotizarReserva(items: ItemCotizacion[]): Promise<Cotizacion> {
    const itemsXml = items.map(item => `
      <ItemCotizacion>
        <sku>${item.sku}</sku>
        <dias>${item.dias}</dias>
        <precioDia>${item.precioDia}</precioDia>
      </ItemCotizacion>
    `).join('');

    const body = `
      <CotizarReserva xmlns="http://tuservidor.com/booking/autos">
        <items>
          ${itemsXml}
        </items>
      </CotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/CotizarReserva"');
    
    const cotizacionItems: ItemCotizacion[] = [];
    const itemElements = xml.getElementsByTagName('ItemCotizacion');
    
    for (let i = 0; i < itemElements.length; i++) {
      const item = itemElements[i];
      cotizacionItems.push({
        sku: parseInt(this.getTagValue(item, 'sku') || '0'),
        dias: parseInt(this.getTagValue(item, 'dias') || '0'),
        precioDia: parseFloat(this.getTagValue(item, 'precioDia') || '0')
      });
    }
    
    return {
      subtotal: parseFloat(this.getTagValue(xml, 'subtotal') || '0'),
      impuestos: parseFloat(this.getTagValue(xml, 'impuestos') || '0'),
      total: parseFloat(this.getTagValue(xml, 'total') || '0'),
      items: cotizacionItems
    };
  }

  /**
   * 5️⃣ Crea pre-reserva y bloquea temporalmente
   */
  async crearPreReserva(
    itinerario: ItemCotizacion[],
    clienteId: number,
    holdMinutes: number,
    idemKey: string,
    pickupAt: Date,
    dropoffAt: Date,
    autoId: number
  ): Promise<PreReserva> {
    const itinerarioXml = itinerario.map(item => `
      <ItemCotizacion>
        <sku>${item.sku}</sku>
        <dias>${item.dias}</dias>
        <precioDia>${item.precioDia}</precioDia>
      </ItemCotizacion>
    `).join('');

    const body = `
      <CrearPreReserva xmlns="http://tuservidor.com/booking/autos">
        <itinerario>
          ${itinerarioXml}
        </itinerario>
        <clienteId>${clienteId}</clienteId>
        <holdMinutes>${holdMinutes}</holdMinutes>
        <idemKey>${idemKey}</idemKey>
        <pickupAt>${pickupAt.toISOString()}</pickupAt>
        <dropoffAt>${dropoffAt.toISOString()}</dropoffAt>
        <autoId>${autoId}</autoId>
      </CrearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/CrearPreReserva"');
    
    return {
      preBookingId: this.getTagValue(xml, 'preBookingId') || '',
      expiraEn: new Date(this.getTagValue(xml, 'expiraEn') || '')
    };
  }

  /**
   * 6️⃣ Confirma y emite reserva
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: DatosPago
  ): Promise<ReservaAuto> {
    const body = `
      <ConfirmarReserva xmlns="http://tuservidor.com/booking/autos">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>
          <metodo>${datosPago.metodo}</metodo>
          <referencia>${datosPago.referencia}</referencia>
          <monto>${datosPago.monto}</monto>
        </datosPago>
      </ConfirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/ConfirmarReserva"');
    
    return {
      bookingId: this.getTagValue(xml, 'bookingId') || '',
      estado: this.getTagValue(xml, 'estado') || '',
      reservaId: parseInt(this.getTagValue(xml, 'reservaId') || '0')
    };
  }

  /**
   * 7️⃣ Cancela con reglas tarifarias
   */
  async cancelarReserva(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <CancelarReservaIntegracion xmlns="http://tuservidor.com/booking/autos">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </CancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://tuservidor.com/booking/autos/CancelarReservaIntegracion"');
    
    const result = this.getTagValue(xml, 'CancelarReservaIntegracionResult');
    return result.toLowerCase() === 'true';
  }

  // ==================== Helpers de Parseo ====================

  private parseAutoResumenFromElement(element: Element | Document): ServicioAutoResumen {
    return {
      sku: parseInt(this.getTagValue(element, 'sku') || '0'),
      marca: this.getTagValue(element, 'marca') || '',
      modelo: this.getTagValue(element, 'modelo') || '',
      categoria: this.getTagValue(element, 'categoria') || '',
      gearbox: this.getTagValue(element, 'gearbox') || '',
      precioDia: parseFloat(this.getTagValue(element, 'precioDia') || '0'),
      ciudad: this.getTagValue(element, 'ciudad') || '',
      imagen: this.getTagValue(element, 'imagen') || ''
    };
  }

  private parseAutoDetalleFromElement(element: Element | Document): ServicioAutoDetalle {
    const imagenes: string[] = [];
    const imageElements = element.getElementsByTagName('string');
    for (let i = 0; i < imageElements.length; i++) {
      const url = imageElements[i].textContent || '';
      if (url) imagenes.push(url);
    }

    return {
      sku: parseInt(this.getTagValue(element, 'sku') || '0'),
      marca: this.getTagValue(element, 'marca') || '',
      modelo: this.getTagValue(element, 'modelo') || '',
      categoria: this.getTagValue(element, 'categoria') || '',
      gearbox: this.getTagValue(element, 'gearbox') || '',
      ciudad: this.getTagValue(element, 'ciudad') || '',
      hotel: this.getTagValue(element, 'hotel') || '',
      pickupOffice: this.getTagValue(element, 'pickupOffice') || '',
      dropoffOffice: this.getTagValue(element, 'dropoffOffice') || '',
      precioDia: parseFloat(this.getTagValue(element, 'precioDia') || '0'),
      imagenes: imagenes,
      politicas: this.getTagValue(element, 'politicas') || '',
      reglas: this.getTagValue(element, 'reglas') || ''
    };
  }

  private getTagValue(parent: Element | Document, tagName: string): string {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length > 0 ? (elements[0].textContent || '') : '';
  }
}
