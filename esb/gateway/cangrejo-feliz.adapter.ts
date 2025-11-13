/**
 * 🦀 Adaptador SOAP para El Cangrejo Feliz - Restaurante
 * Endpoint: https://elcangrejofeliz.runasp.net/WS_IntegracionRestaurante.asmx
 * Namespace: http://elcangrejofeliz.ec/Integracion
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';

// ==================== DTOs ====================

export interface DTO_Servicio {
  IdServicio: number;
  Nombre: string;
  Tipo: string;
  Ciudad: string;
  Precio: string;
  Clasificacion: string;
  Descripcion: string;
  Politicas: string;
  Reglas: string;
  ImagenURL: string;
}

export interface DTO_ItemDetalle {
  Nombre: string;
  Cantidad: number;
  PrecioUnitario: number;
  PrecioTotal: number;
}

export interface DTO_Cotizacion {
  Total: number;
  Breakdown: DTO_ItemDetalle[];
}

export interface DTO_PreReserva {
  PreBookingId: string;
  ExpiraEn: Date;
}

export interface DTO_Reserva {
  BookingId: string;
  Estado: string;
}

export interface DTO_Cancelacion {
  Cancelacion: boolean;
}

// ==================== Adaptador SOAP ====================

export class ElCangrejoFelizSoapAdapter extends SoapClient {
  
  /**
   * 1️⃣ Búsqueda unificada por tipo, ciudad, fechas, precio, amenities, clasificación
   */
  async buscarServicios(filtros?: string): Promise<DTO_Servicio[]> {
    const body = `
      <buscarServicios xmlns="http://elcangrejofeliz.ec/Integracion">
        <filtros>${filtros || ''}</filtros>
      </buscarServicios>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/buscarServicios"');
    
    const servicios: DTO_Servicio[] = [];
    const items = xml.getElementsByTagName('ServicioDTO');
    
    for (let i = 0; i < items.length; i++) {
      servicios.push(this.parseServicioFromElement(items[i]));
    }
    
    return servicios;
  }

  /**
   * 2️⃣ Detalle completo del servicio (fotos, políticas, reglas)
   */
  async obtenerDetalleServicio(idServicio: number): Promise<DTO_Servicio> {
    const body = `
      <obtenerDetalleServicio xmlns="http://elcangrejofeliz.ec/Integracion">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/obtenerDetalleServicio"');
    
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
  ): Promise<boolean> {
    const body = `
      <verificarDisponibilidad xmlns="http://elcangrejofeliz.ec/Integracion">
        <sku>${sku}</sku>
        <inicio>${inicio.toISOString()}</inicio>
        <fin>${fin.toISOString()}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/verificarDisponibilidad"');
    
    const result = this.getTagValue(xml, 'Disponible');
    return result.toLowerCase() === 'true';
  }

  /**
   * 4️⃣ Calcula precio total (impuestos/fees) para un itinerario
   */
  async cotizarReserva(items: DTO_ItemDetalle[]): Promise<DTO_Cotizacion> {
    const itemsXml = items.map(item => `
      <ItemDetalle>
        <Nombre>${item.Nombre}</Nombre>
        <Cantidad>${item.Cantidad}</Cantidad>
        <PrecioUnitario>${item.PrecioUnitario}</PrecioUnitario>
        <PrecioTotal>${item.PrecioTotal}</PrecioTotal>
      </ItemDetalle>
    `).join('');

    const body = `
      <cotizarReserva xmlns="http://elcangrejofeliz.ec/Integracion">
        <items>
          ${itemsXml}
        </items>
      </cotizarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/cotizarReserva"');
    
    const total = parseFloat(this.getTagValue(xml, 'Total') || '0');
    
    const breakdown: DTO_ItemDetalle[] = [];
    const breakdownItems = xml.getElementsByTagName('ItemDetalle');
    
    for (let i = 0; i < breakdownItems.length; i++) {
      const item = breakdownItems[i];
      breakdown.push({
        Nombre: this.getTagValue(item, 'Nombre') || '',
        Cantidad: parseInt(this.getTagValue(item, 'Cantidad') || '0'),
        PrecioUnitario: parseFloat(this.getTagValue(item, 'PrecioUnitario') || '0'),
        PrecioTotal: parseFloat(this.getTagValue(item, 'PrecioTotal') || '0')
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
  ): Promise<DTO_PreReserva> {
    const body = `
      <crearPreReserva xmlns="http://elcangrejofeliz.ec/Integracion">
        <itinerario>${itinerario}</itinerario>
        <cliente>${cliente}</cliente>
        <holdMinutes>${holdMinutes}</holdMinutes>
        <idemKey>${idemKey}</idemKey>
      </crearPreReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/crearPreReserva"');
    
    return {
      PreBookingId: this.getTagValue(xml, 'PreBookingId') || '',
      ExpiraEn: new Date(this.getTagValue(xml, 'ExpiraEn') || '')
    };
  }

  /**
   * 6️⃣ Confirma y emite la reserva
   */
  async confirmarReserva(
    preBookingId: string,
    metodoPago: string,
    datosPago: string
  ): Promise<DTO_Reserva> {
    const body = `
      <confirmarReserva xmlns="http://elcangrejofeliz.ec/Integracion">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <datosPago>${datosPago}</datosPago>
      </confirmarReserva>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/confirmarReserva"');
    
    return {
      BookingId: this.getTagValue(xml, 'BookingId') || '',
      Estado: this.getTagValue(xml, 'Estado') || ''
    };
  }

  /**
   * 7️⃣ Cancela con reglas tarifarias
   */
  async cancelarReserva(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <cancelarReservaIntegracion xmlns="http://elcangrejofeliz.ec/Integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </cancelarReservaIntegracion>
    `;

    const soapEnvelope = buildSoapEnvelope(body);
    const xml = await this.call(soapEnvelope, '"http://elcangrejofeliz.ec/Integracion/cancelarReservaIntegracion"');
    
    const result = this.getTagValue(xml, 'Cancelacion');
    return result.toLowerCase() === 'true';
  }

  // ==================== Helpers de Parseo ====================

  private parseServicioFromElement(element: Element | Document): DTO_Servicio {
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
      ImagenURL: this.getTagValue(element, 'ImagenURL') || ''
    };
  }

  private getTagValue(parent: Element | Document, tagName: string): string {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length > 0 ? (elements[0].textContent || '') : '';
  }
}
