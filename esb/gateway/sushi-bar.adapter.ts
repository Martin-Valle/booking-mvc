/**
 * Sushi Bar SOAP Service Adapter
 * Service 14 - Sushi Bar Restaurant
 * Endpoint: http://wsintegracion.runasp.net/IntegracionSoapService.asmx
 * Namespace: http://sushibar1.com/
 * Type: ASMX Restaurant Service
 * Operations: 7
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface TipoServicioDTO {
  IdTipo: number;
  Nombre: string;
  Subtipo: string;
  Descripcion: string;
}

export interface ImagenServicioDTO {
  IdImagen: number;
  IdServicio: number;
  Url: string;
}

export interface DetalleServicioDTO {
  Servicio: TipoServicioDTO;
  Imagenes: ImagenServicioDTO[];
  Politicas: string[];
  Reglas: string[];
}

export interface CotizacionDTO {
  Total: number;
  Detalle: string[];
}

export interface PreReservaDTO {
  PreBookingId: number;
  ExpiraEn: string; // DateTime ISO format
}

export interface DetalleReservaDTO {
  IdDetalle: number;
  IdReserva: number;
  IdServicio: number;
  Cantidad: number;
  PrecioUnitario: number;
}

export interface ReservaDTO {
  IdReserva: number;
  IdCliente: number;
  IdMesa: number;
  FechaInicio: string;
  FechaFin: string;
  IdEstadoReserva: number;
  Detalles: DetalleReservaDTO[];
}

// ==================== Adapter ====================

export class SushiBarSoapAdapter extends SoapClient {
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
   * 1. buscarServicios - Búsqueda de servicios por tipo
   */
  async buscarServicios(tipo: string): Promise<TipoServicioDTO[]> {
    const soapBody = `
      <buscarServicios xmlns="http://sushibar1.com/">
        <tipo>${tipo || ''}</tipo>
      </buscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/buscarServicios');
    return this.parseTipoServicioList(response);
  }

  /**
   * 2. obtenerDetalleServicio - Obtiene detalle completo del servicio
   */
  async obtenerDetalleServicio(idServicio: number): Promise<DetalleServicioDTO> {
    const soapBody = `
      <obtenerDetalleServicio xmlns="http://sushibar1.com/">
        <idServicio>${idServicio}</idServicio>
      </obtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/obtenerDetalleServicio');
    return this.parseDetalleServicio(response);
  }

  /**
   * 3. verificarDisponibilidad - Valida cupo/stock por fechas y unidades
   */
  async verificarDisponibilidad(
    sku: number,
    inicio: string,
    fin: string,
    unidades: number
  ): Promise<boolean> {
    const soapBody = `
      <verificarDisponibilidad xmlns="http://sushibar1.com/">
        <sku>${sku}</sku>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
        <unidades>${unidades}</unidades>
      </verificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/verificarDisponibilidad');
    
    const result = this.getNodeText(response, 'verificarDisponibilidadResult');
    return result.toLowerCase() === 'true';
  }

  /**
   * 4. cotizarReserva - Calcula precio total con impuestos y detalle
   */
  async cotizarReserva(idsServicios: number[]): Promise<CotizacionDTO> {
    const arrayXml = idsServicios.map(id => `<int>${id}</int>`).join('');
    const soapBody = `
      <cotizarReserva xmlns="http://sushibar1.com/">
        <idsServicios>
          ${arrayXml}
        </idsServicios>
      </cotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/cotizarReserva');
    return this.parseCotizacion(response);
  }

  /**
   * 5. crearPreReserva - Crea una pre-reserva temporal
   */
  async crearPreReserva(
    idCliente: number,
    idMesa: number,
    minutos: number
  ): Promise<PreReservaDTO> {
    const soapBody = `
      <crearPreReserva xmlns="http://sushibar1.com/">
        <idCliente>${idCliente}</idCliente>
        <idMesa>${idMesa}</idMesa>
        <minutos>${minutos}</minutos>
      </crearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/crearPreReserva');
    return this.parsePreReserva(response);
  }

  /**
   * 6. confirmarReserva - Confirma y emite una reserva
   */
  async confirmarReserva(
    idReserva: number,
    metodoPago: number
  ): Promise<ReservaDTO> {
    const soapBody = `
      <confirmarReserva xmlns="http://sushibar1.com/">
        <idReserva>${idReserva}</idReserva>
        <metodoPago>${metodoPago}</metodoPago>
      </confirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/confirmarReserva');
    return this.parseReserva(response);
  }

  /**
   * 7. cancelarReservaIntegracion - Cancela una reserva existente
   */
  async cancelarReservaIntegracion(
    idReserva: number,
    motivo: string
  ): Promise<boolean> {
    const soapBody = `
      <cancelarReservaIntegracion xmlns="http://sushibar1.com/">
        <idReserva>${idReserva}</idReserva>
        <motivo>${motivo || ''}</motivo>
      </cancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://sushibar1.com/cancelarReservaIntegracion');
    
    const result = this.getNodeText(response, 'cancelarReservaIntegracionResult');
    return result.toLowerCase() === 'true';
  }

  // ==================== Parsers ====================

  private parseTipoServicioList(doc: Document): TipoServicioDTO[] {
    const servicios: TipoServicioDTO[] = [];
    const nodes = doc.getElementsByTagName('TipoServicio');

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      servicios.push({
        IdTipo: parseInt(this.getChildText(node, 'IdTipo')) || 0,
        Nombre: this.getChildText(node, 'Nombre'),
        Subtipo: this.getChildText(node, 'Subtipo'),
        Descripcion: this.getChildText(node, 'Descripcion')
      });
    }

    return servicios;
  }

  private parseDetalleServicio(doc: Document): DetalleServicioDTO {
    // Parse Servicio
    const servicioNode = doc.getElementsByTagName('Servicio')[0];
    const servicio: TipoServicioDTO = {
      IdTipo: parseInt(this.getChildText(servicioNode, 'IdTipo')) || 0,
      Nombre: this.getChildText(servicioNode, 'Nombre'),
      Subtipo: this.getChildText(servicioNode, 'Subtipo'),
      Descripcion: this.getChildText(servicioNode, 'Descripcion')
    };

    // Parse Imagenes
    const imagenes: ImagenServicioDTO[] = [];
    const imagenesNodes = doc.getElementsByTagName('ImagenServicio');
    for (let i = 0; i < imagenesNodes.length; i++) {
      const node = imagenesNodes[i];
      imagenes.push({
        IdImagen: parseInt(this.getChildText(node, 'IdImagen')) || 0,
        IdServicio: parseInt(this.getChildText(node, 'IdServicio')) || 0,
        Url: this.getChildText(node, 'Url')
      });
    }

    // Parse Politicas (ArrayOfString)
    const politicas: string[] = [];
    const politicasNodes = doc.getElementsByTagName('Politicas')[0];
    if (politicasNodes) {
      const stringNodes = politicasNodes.getElementsByTagName('string');
      for (let i = 0; i < stringNodes.length; i++) {
        politicas.push(stringNodes[i].textContent || '');
      }
    }

    // Parse Reglas (ArrayOfString)
    const reglas: string[] = [];
    const reglasNodes = doc.getElementsByTagName('Reglas')[0];
    if (reglasNodes) {
      const stringNodes = reglasNodes.getElementsByTagName('string');
      for (let i = 0; i < stringNodes.length; i++) {
        reglas.push(stringNodes[i].textContent || '');
      }
    }

    return { 
      Servicio: servicio, 
      Imagenes: imagenes, 
      Politicas: politicas, 
      Reglas: reglas 
    };
  }

  private parseCotizacion(doc: Document): CotizacionDTO {
    const total = parseFloat(this.getNodeText(doc, 'Total')) || 0;
    
    // Parse Detalle (ArrayOfString)
    const detalle: string[] = [];
    const detalleNodes = doc.getElementsByTagName('Detalle')[0];
    if (detalleNodes) {
      const stringNodes = detalleNodes.getElementsByTagName('string');
      for (let i = 0; i < stringNodes.length; i++) {
        detalle.push(stringNodes[i].textContent || '');
      }
    }

    return { Total: total, Detalle: detalle };
  }

  private parsePreReserva(doc: Document): PreReservaDTO {
    return {
      PreBookingId: parseInt(this.getNodeText(doc, 'PreBookingId')) || 0,
      ExpiraEn: this.getNodeText(doc, 'ExpiraEn')
    };
  }

  private parseReserva(doc: Document): ReservaDTO {
    // Parse Detalles
    const detalles: DetalleReservaDTO[] = [];
    const detallesNodes = doc.getElementsByTagName('DetalleReserva');
    for (let i = 0; i < detallesNodes.length; i++) {
      const node = detallesNodes[i];
      detalles.push({
        IdDetalle: parseInt(this.getChildText(node, 'IdDetalle')) || 0,
        IdReserva: parseInt(this.getChildText(node, 'IdReserva')) || 0,
        IdServicio: parseInt(this.getChildText(node, 'IdServicio')) || 0,
        Cantidad: parseInt(this.getChildText(node, 'Cantidad')) || 0,
        PrecioUnitario: parseFloat(this.getChildText(node, 'PrecioUnitario')) || 0
      });
    }

    return {
      IdReserva: parseInt(this.getNodeText(doc, 'IdReserva')) || 0,
      IdCliente: parseInt(this.getNodeText(doc, 'IdCliente')) || 0,
      IdMesa: parseInt(this.getNodeText(doc, 'IdMesa')) || 0,
      FechaInicio: this.getNodeText(doc, 'FechaInicio'),
      FechaFin: this.getNodeText(doc, 'FechaFin'),
      IdEstadoReserva: parseInt(this.getNodeText(doc, 'IdEstadoReserva')) || 0,
      Detalles: detalles
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
