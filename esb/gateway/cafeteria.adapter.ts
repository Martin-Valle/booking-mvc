/**
 * ☕ Cafeteria Paris SOAP Adapter
 * Servicio SOAP para búsqueda y reserva de servicios de cafetería
 * Endpoint: https://cafeteriaparis-c4d5ghhbfqe2fkfs.canadacentral-01.azurewebsites.net/integracion.asmx
 * Namespace: http://cafeteria.com/integracion
 */

import { SoapClient } from './soap-client';
import { buildSoapEnvelope } from '../utils/soap-utils';
import type { EndpointConfig } from '../utils/config';

// =====================================================
// DTOs de Cafetería París
// =====================================================

export interface TipoServicioDTO {
  Id: number;
  Nombre: string;
  Descripcion: string;
  SubTipo: string;
  Activo: boolean;
  CreadoEn: string; // dateTime
}

// =====================================================
// Cafeteria SOAP Adapter
// =====================================================

export class CafeteriaSoapAdapter extends SoapClient {
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
   * 1️⃣ BuscarServicios - Búsqueda unificada de servicios
   */
  async buscarServicios(): Promise<TipoServicioDTO[]> {
    const body = `<BuscarServicios xmlns="${this.namespace}" />`;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/BuscarServicios"`);
    const items = xml.getElementsByTagName('TipoServicio');
    
    const result: TipoServicioDTO[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      result.push({
        Id: parseInt(this.getTagValue(item, 'Id')),
        Nombre: this.getTagValue(item, 'Nombre'),
        Descripcion: this.getTagValue(item, 'Descripcion'),
        SubTipo: this.getTagValue(item, 'SubTipo'),
        Activo: this.getTagValue(item, 'Activo') === 'true',
        CreadoEn: this.getTagValue(item, 'CreadoEn')
      });
    }
    
    return result;
  }

  /**
   * 2️⃣ ObtenerDetalleServicio - Obtiene detalle por ID
   */
  async obtenerDetalleServicio(id: number): Promise<TipoServicioDTO> {
    const body = `
      <ObtenerDetalleServicio xmlns="${this.namespace}">
        <id>${id}</id>
      </ObtenerDetalleServicio>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/ObtenerDetalleServicio"`);
    const result = xml.getElementsByTagName('ObtenerDetalleServicioResult')[0];
    
    return {
      Id: parseInt(this.getTagValue(result, 'Id')),
      Nombre: this.getTagValue(result, 'Nombre'),
      Descripcion: this.getTagValue(result, 'Descripcion'),
      SubTipo: this.getTagValue(result, 'SubTipo'),
      Activo: this.getTagValue(result, 'Activo') === 'true',
      CreadoEn: this.getTagValue(result, 'CreadoEn')
    };
  }

  /**
   * 3️⃣ VerificarDisponibilidad - Verifica disponibilidad de producto
   */
  async verificarDisponibilidad(idServicio: number, unidades: number): Promise<boolean> {
    const body = `
      <VerificarDisponibilidad xmlns="${this.namespace}">
        <idServicio>${idServicio}</idServicio>
        <unidades>${unidades}</unidades>
      </VerificarDisponibilidad>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/VerificarDisponibilidad"`);
    const resultado = this.getTagValue(xml, 'VerificarDisponibilidadResult');
    
    return resultado === 'true';
  }

  /**
   * 4️⃣ CotizarReserva - Calcula total aproximado
   */
  async cotizarReserva(precioUnitario: number, cantidad: number): Promise<string> {
    const body = `
      <CotizarReserva xmlns="${this.namespace}">
        <precioUnitario>${precioUnitario}</precioUnitario>
        <cantidad>${cantidad}</cantidad>
      </CotizarReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/CotizarReserva"`);
    return this.getTagValue(xml, 'CotizarReservaResult');
  }

  /**
   * 5️⃣ CrearPreReserva - Crea pre-reserva temporal
   */
  async crearPreReserva(cliente: string, producto: string, minutos: number): Promise<string> {
    const body = `
      <CrearPreReserva xmlns="${this.namespace}">
        <cliente>${cliente}</cliente>
        <producto>${producto}</producto>
        <minutos>${minutos}</minutos>
      </CrearPreReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/CrearPreReserva"`);
    return this.getTagValue(xml, 'CrearPreReservaResult');
  }

  /**
   * 6️⃣ ConfirmarReserva - Confirma reserva y genera comprobante
   */
  async confirmarReserva(preBookingId: string, metodoPago: string, monto: number): Promise<string> {
    const body = `
      <ConfirmarReserva xmlns="${this.namespace}">
        <preBookingId>${preBookingId}</preBookingId>
        <metodoPago>${metodoPago}</metodoPago>
        <monto>${monto}</monto>
      </ConfirmarReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/ConfirmarReserva"`);
    return this.getTagValue(xml, 'ConfirmarReservaResult');
  }

  /**
   * 7️⃣ CancelarReserva - Cancela reserva existente
   */
  async cancelarReserva(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <CancelarReserva xmlns="${this.namespace}">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo}</motivo>
      </CancelarReserva>
    `;
    const envelope = buildSoapEnvelope(body);
    
    const xml = await this.call(envelope, `"${this.namespace}/CancelarReserva"`);
    const resultado = this.getTagValue(xml, 'CancelarReservaResult');
    
    return resultado === 'true';
  }
}
