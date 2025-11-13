/**
 * Hotel Perros SOAP Service Adapter
 * Service 21 - Hotel Perros (Pet/Dog Hotel)
 * Endpoint: https://wsintegracionhotel20251024134454-gxaqacbthwcdgzer.canadacentral-01.azurewebsites.net/WS_Integracion_Hotel.asmx
 * Namespace: http://hotelperros.com/integracion
 * Type: ASMX Pet Hotel Service (Hospedaje Canino)
 * Operations: 8
 * 
 * NOTE: All responses use ResultadoDto wrapper pattern with Ok, Mensaje, Codigo, Data
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface BusquedaServicioFiltroDto {
  ServiceType?: string;
  Ciudad?: string;
  Inicio: string;
  Fin: string;
  Unidades: number;
  Tamano?: string; // PEQUEÑO, MEDIANO, GRANDE
  PrecioMax?: number;
  Clasificacion?: number; // Rating (1-5)
}

export interface ServicioResumenDto {
  Sku: string;
  Nombre: string;
  TarifaBaseNoche: number;
  Disponible: boolean;
  Moneda: string;
}

export interface ServicioDetalleDto {
  Sku: string;
  Nombre: string;
  Descripcion: string;
  TarifaBaseNoche: number;
  Politicas: string[];
  Fotos: string[];
}

export interface ItemCotizacionDto {
  Sku: string;
  Cantidad: number;
  Noches: number;
  PrecioUnitarioNoche: number;
}

export interface CotizacionDto {
  Subtotal: number;
  PorcentajeIva: number;
  MontoIva: number;
  Total: number;
  Items: ItemCotizacionDto[];
  Moneda: string;
}

export interface PreReservaSolicitudDto {
  IdCliente: number;
  Inicio: string;
  Fin: string;
  IdsPerros: number[]; // Array of dog IDs
  Tamano?: string;
  Comentarios?: string;
  HoldMinutes: number;
  IdemKey?: string; // Idempotency key
}

export interface PreReservaDto {
  PreBookingId: string;
  ExpiraEn: string;
  Estado: string;
}

export interface ConfirmarReservaSolicitudDto {
  PreBookingId: string;
  MetodoPago: string;
  DatosPago: string;
  Monto?: number;
}

export interface ReservaConfirmadaDto {
  BookingId: string;
  Estado: string;
  Total: number;
  Moneda: string;
  ConfirmadaEn: string;
}

export interface FacturaEmitidaDto {
  IdFactura: number;
  Numero: string;
  Subtotal: number;
  PorcentajeIva: number;
  MontoIva: number;
  Total: number;
}

export interface PagoRegistradoDto {
  IdPago: number;
  Metodo: string;
  Monto: number;
  Referencia: string;
}

export interface ConfirmacionConFacturaDto {
  Reserva: ReservaConfirmadaDto;
  Factura: FacturaEmitidaDto;
  Pago: PagoRegistradoDto;
}

export interface ResultadoDto<T> {
  Ok: boolean;
  Mensaje: string;
  Codigo: string;
  Data: T;
}

// ==================== Adapter ====================

export class HotelPerrosSoapAdapter extends SoapClient {
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
   * 1. Buscar Servicios
   * Búsqueda unificada de servicios de hospedaje canino por tamaño y fechas
   */
  async buscarServicios(filtros: BusquedaServicioFiltroDto): Promise<ResultadoDto<ServicioResumenDto[]>> {
    const soapBody = `
      <buscarServicios xmlns="http://hotelperros.com/integracion">
        <filtros>
          ${filtros.ServiceType ? `<ServiceType>${filtros.ServiceType}</ServiceType>` : ''}
          ${filtros.Ciudad ? `<Ciudad>${filtros.Ciudad}</Ciudad>` : ''}
          <Inicio>${filtros.Inicio}</Inicio>
          <Fin>${filtros.Fin}</Fin>
          <Unidades>${filtros.Unidades}</Unidades>
          ${filtros.Tamano ? `<Tamano>${filtros.Tamano}</Tamano>` : ''}
          ${filtros.PrecioMax ? `<PrecioMax>${filtros.PrecioMax}</PrecioMax>` : ''}
          ${filtros.Clasificacion ? `<Clasificacion>${filtros.Clasificacion}</Clasificacion>` : ''}
        </filtros>
      </buscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const rawResponse = await this.callRaw(envelope, 'http://hotelperros.com/integracion/buscarServicios');
    console.log('[Hotel Perros] Raw XML Response length:', rawResponse.length);
    
    // Count elements for debugging
    const matches = rawResponse.match(/<ServicioResumenDto>/g);
    console.log('[Hotel Perros] ServicioResumenDto elements found:', matches ? matches.length : 0);
    
    return this.parseBusquedaResultFromXml(rawResponse);
  }

  // Regex-based XML parsing for buscarServicios
  private parseBusquedaResultFromXml(xmlString: string): ResultadoDto<ServicioResumenDto[]> {
    // Extract Ok, Mensaje, Codigo
    const ok = this.extractXmlValue(xmlString, 'Ok') === 'true';
    const mensaje = this.extractXmlValue(xmlString, 'Mensaje') || '';
    const codigo = this.extractXmlValue(xmlString, 'Codigo') || '';
    
    const servicios: ServicioResumenDto[] = [];
    
    // Extract all ServicioResumenDto elements
    const regex = /<ServicioResumenDto>([\s\S]*?)<\/ServicioResumenDto>/g;
    const matches = xmlString.matchAll(regex);
    
    for (const match of matches) {
      const servicioXml = match[1];
      
      const servicio: ServicioResumenDto = {
        Sku: this.extractXmlValue(servicioXml, 'Sku') || '',
        Nombre: this.extractXmlValue(servicioXml, 'Nombre') || '',
        TarifaBaseNoche: parseFloat(this.extractXmlValue(servicioXml, 'TarifaBaseNoche') || '0') || 0,
        Disponible: this.extractXmlValue(servicioXml, 'Disponible') === 'true',
        Moneda: this.extractXmlValue(servicioXml, 'Moneda') || 'USD'
      };
      
      servicios.push(servicio);
    }
    
    console.log('[Hotel Perros] Parsed services:', servicios.length);
    
    return {
      Ok: ok,
      Mensaje: mensaje,
      Codigo: codigo,
      Data: servicios
    };
  }

  // Helper method to extract XML tag values using regex
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * 2. Obtener Detalle Servicio
   * Devuelve el detalle del servicio por id_tamano (idServicio)
   */
  async obtenerDetalleServicio(idServicio: number): Promise<ResultadoDto<ServicioDetalleDto>> {
    const soapBody = `
      <obtenerDetalleServicio xmlns="http://hotelperros.com/integracion">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/obtenerDetalleServicio');
    return this.parseDetalleResult(response);
  }

  /**
   * 3. Verificar Disponibilidad
   * Valida cupo/stock por fechas para un SKU (tamaño)
   */
  async verificarDisponibilidad(
    sku: string,
    inicio: string,
    fin: string,
    unidades: number
  ): Promise<ResultadoDto<boolean>> {
    const soapBody = `
      <verificarDisponibilidad xmlns="http://hotelperros.com/integracion">
        <sku>${sku}</sku>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/verificarDisponibilidad');
    return this.parseBooleanResult(response);
  }

  /**
   * 4. Cotizar Reserva
   * Calcula precio total (impuestos/fees) para un itinerario simple
   */
  async cotizarReserva(
    items: ItemCotizacionDto[],
    inicio: string,
    fin: string
  ): Promise<ResultadoDto<CotizacionDto>> {
    const itemsXml = items.map(item => `
      <ItemCotizacionDto>
        <Sku>${item.Sku}</Sku>
        <Cantidad>${item.Cantidad}</Cantidad>
        <Noches>${item.Noches}</Noches>
        <PrecioUnitarioNoche>${item.PrecioUnitarioNoche}</PrecioUnitarioNoche>
      </ItemCotizacionDto>
    `).join('');

    const soapBody = `
      <cotizarReserva xmlns="http://hotelperros.com/integracion">
        <items>
          ${itemsXml}
        </items>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
      </cotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/cotizarReserva');
    return this.parseCotizacionResult(response);
  }

  /**
   * 5. Crear Pre-Reserva
   * Crea una pre-reserva (HOLD) bloqueando disponibilidad temporalmente
   */
  async crearPreReserva(req: PreReservaSolicitudDto): Promise<ResultadoDto<PreReservaDto>> {
    const idsPerrosXml = req.IdsPerros.map(id => `<long>${id}</long>`).join('');

    const soapBody = `
      <crearPreReserva xmlns="http://hotelperros.com/integracion">
        <req>
          <IdCliente>${req.IdCliente}</IdCliente>
          <Inicio>${req.Inicio}</Inicio>
          <Fin>${req.Fin}</Fin>
          <IdsPerros>
            ${idsPerrosXml}
          </IdsPerros>
          ${req.Tamano ? `<Tamano>${req.Tamano}</Tamano>` : ''}
          ${req.Comentarios ? `<Comentarios>${req.Comentarios}</Comentarios>` : ''}
          <HoldMinutes>${req.HoldMinutes}</HoldMinutes>
          ${req.IdemKey ? `<IdemKey>${req.IdemKey}</IdemKey>` : ''}
        </req>
      </crearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/crearPreReserva');
    return this.parsePreReservaResult(response);
  }

  /**
   * 6. Confirmar Reserva (simple)
   * Confirma una pre-reserva y devuelve los datos de la reserva emitida
   */
  async confirmarReservaSimple(req: ConfirmarReservaSolicitudDto): Promise<ResultadoDto<ReservaConfirmadaDto>> {
    const soapBody = `
      <ConfirmarReserva xmlns="http://hotelperros.com/integracion">
        <req>
          <PreBookingId>${req.PreBookingId}</PreBookingId>
          <MetodoPago>${req.MetodoPago || ''}</MetodoPago>
          <DatosPago>${req.DatosPago || ''}</DatosPago>
          ${req.Monto ? `<Monto>${req.Monto}</Monto>` : ''}
        </req>
      </ConfirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/ConfirmarReserva');
    return this.parseConfirmacionSimpleResult(response);
  }

  /**
   * 7. Confirmar Reserva (con factura)
   * Confirma una pre-reserva, emite factura y (opcional) registra pago
   */
  async confirmarReserva(req: ConfirmarReservaSolicitudDto): Promise<ResultadoDto<ConfirmacionConFacturaDto>> {
    const soapBody = `
      <confirmarReserva xmlns="http://hotelperros.com/integracion">
        <req>
          <PreBookingId>${req.PreBookingId}</PreBookingId>
          <MetodoPago>${req.MetodoPago || ''}</MetodoPago>
          <DatosPago>${req.DatosPago || ''}</DatosPago>
          ${req.Monto ? `<Monto>${req.Monto}</Monto>` : ''}
        </req>
      </confirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/confirmarReserva');
    return this.parseConfirmacionConFacturaResult(response);
  }

  /**
   * 8. Cancelar Reserva
   * Cancela una reserva confirmada o pendiente con reglas tarifarias básicas
   */
  async cancelarReservaIntegracion(bookingId: string, motivo: string): Promise<ResultadoDto<boolean>> {
    const soapBody = `
      <cancelarReservaIntegracion xmlns="http://hotelperros.com/integracion">
        <bookingId>${bookingId}</bookingId>
        <motivo>${motivo || ''}</motivo>
      </cancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://hotelperros.com/integracion/cancelarReservaIntegracion');
    return this.parseBooleanResult(response);
  }

  // ==================== Parsers ====================

  private parseBusquedaResult(doc: Document): ResultadoDto<ServicioResumenDto[]> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');

    const servicios: ServicioResumenDto[] = [];
    const nodes = doc.getElementsByTagName('ServicioResumenDto');
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      servicios.push({
        Sku: this.getChildText(node, 'Sku'),
        Nombre: this.getChildText(node, 'Nombre'),
        TarifaBaseNoche: parseFloat(this.getChildText(node, 'TarifaBaseNoche')) || 0,
        Disponible: this.getChildText(node, 'Disponible').toLowerCase() === 'true',
        Moneda: this.getChildText(node, 'Moneda')
      });
    }

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: servicios };
  }

  private parseDetalleResult(doc: Document): ResultadoDto<ServicioDetalleDto> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');

    const politicas: string[] = [];
    const politicasNode = doc.getElementsByTagName('Politicas')[0];
    if (politicasNode) {
      const stringNodes = politicasNode.getElementsByTagName('string');
      for (let i = 0; i < stringNodes.length; i++) {
        politicas.push(stringNodes[i].textContent || '');
      }
    }

    const fotos: string[] = [];
    const fotosNode = doc.getElementsByTagName('Fotos')[0];
    if (fotosNode) {
      const stringNodes = fotosNode.getElementsByTagName('string');
      for (let i = 0; i < stringNodes.length; i++) {
        fotos.push(stringNodes[i].textContent || '');
      }
    }

    const data: ServicioDetalleDto = {
      Sku: this.getNodeText(doc, 'Sku'),
      Nombre: this.getNodeText(doc, 'Nombre'),
      Descripcion: this.getNodeText(doc, 'Descripcion'),
      TarifaBaseNoche: parseFloat(this.getNodeText(doc, 'TarifaBaseNoche')) || 0,
      Politicas: politicas,
      Fotos: fotos
    };

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: data };
  }

  private parseBooleanResult(doc: Document): ResultadoDto<boolean> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');
    const dataNodes = doc.getElementsByTagName('Data');
    const data = dataNodes.length > 0 ? (dataNodes[0].textContent || '').toLowerCase() === 'true' : false;

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: data };
  }

  private parseCotizacionResult(doc: Document): ResultadoDto<CotizacionDto> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');

    const items: ItemCotizacionDto[] = [];
    const itemNodes = doc.getElementsByTagName('ItemCotizacionDto');
    for (let i = 0; i < itemNodes.length; i++) {
      const node = itemNodes[i];
      items.push({
        Sku: this.getChildText(node, 'Sku'),
        Cantidad: parseInt(this.getChildText(node, 'Cantidad')) || 0,
        Noches: parseInt(this.getChildText(node, 'Noches')) || 0,
        PrecioUnitarioNoche: parseFloat(this.getChildText(node, 'PrecioUnitarioNoche')) || 0
      });
    }

    const data: CotizacionDto = {
      Subtotal: parseFloat(this.getNodeText(doc, 'Subtotal')) || 0,
      PorcentajeIva: parseFloat(this.getNodeText(doc, 'PorcentajeIva')) || 0,
      MontoIva: parseFloat(this.getNodeText(doc, 'MontoIva')) || 0,
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0,
      Items: items,
      Moneda: this.getNodeText(doc, 'Moneda')
    };

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: data };
  }

  private parsePreReservaResult(doc: Document): ResultadoDto<PreReservaDto> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');

    const data: PreReservaDto = {
      PreBookingId: this.getNodeText(doc, 'PreBookingId'),
      ExpiraEn: this.getNodeText(doc, 'ExpiraEn'),
      Estado: this.getNodeText(doc, 'Estado')
    };

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: data };
  }

  private parseConfirmacionSimpleResult(doc: Document): ResultadoDto<ReservaConfirmadaDto> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');

    const data: ReservaConfirmadaDto = {
      BookingId: this.getNodeText(doc, 'BookingId'),
      Estado: this.getNodeText(doc, 'Estado'),
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0,
      Moneda: this.getNodeText(doc, 'Moneda'),
      ConfirmadaEn: this.getNodeText(doc, 'ConfirmadaEn')
    };

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: data };
  }

  private parseConfirmacionConFacturaResult(doc: Document): ResultadoDto<ConfirmacionConFacturaDto> {
    const ok = this.getNodeText(doc, 'Ok').toLowerCase() === 'true';
    const mensaje = this.getNodeText(doc, 'Mensaje');
    const codigo = this.getNodeText(doc, 'Codigo');

    const reserva: ReservaConfirmadaDto = {
      BookingId: this.getNodeText(doc, 'BookingId'),
      Estado: this.getNodeText(doc, 'Estado'),
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0,
      Moneda: this.getNodeText(doc, 'Moneda'),
      ConfirmadaEn: this.getNodeText(doc, 'ConfirmadaEn')
    };

    const factura: FacturaEmitidaDto = {
      IdFactura: parseInt(this.getNodeText(doc, 'IdFactura')) || 0,
      Numero: this.getNodeText(doc, 'Numero'),
      Subtotal: parseFloat(this.getNodeText(doc, 'Subtotal')) || 0,
      PorcentajeIva: parseFloat(this.getNodeText(doc, 'PorcentajeIva')) || 0,
      MontoIva: parseFloat(this.getNodeText(doc, 'MontoIva')) || 0,
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0
    };

    const pago: PagoRegistradoDto = {
      IdPago: parseInt(this.getNodeText(doc, 'IdPago')) || 0,
      Metodo: this.getNodeText(doc, 'Metodo'),
      Monto: parseFloat(this.getNodeText(doc, 'Monto')) || 0,
      Referencia: this.getNodeText(doc, 'Referencia')
    };

    const data: ConfirmacionConFacturaDto = {
      Reserva: reserva,
      Factura: factura,
      Pago: pago
    };

    return { Ok: ok, Mensaje: mensaje, Codigo: codigo, Data: data };
  }

  private getChildText(parent: Element, tagName: string): string {
    const child = parent.getElementsByTagName(tagName)[0];
    return child?.textContent || '';
  }
}
