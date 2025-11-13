/**
 * Easy Car SOAP Service Adapter
 * Service 19 - Easy Car (Car Rental)
 * Endpoint: http://easycar.runasp.net/IntegracionService.asmx
 * Namespace: http://tuservidor.com/booking/autos
 * Type: ASMX Car Rental Service
 * Operations: 6
 */

import { SoapClient } from './soap-client';
import type { EndpointConfig } from '../utils/config';

// ==================== DTOs ====================

export interface VehiculoDTO {
  IdVehiculo: number;
  IdAgencia: number;
  Marca: string;
  Modelo: string;
  Anio: number;
  Categoria: string;
  Transmision: string;
  Combustible: string;
  Activo: boolean;
  PrecioBaseDia: number;
}

export interface CotizacionDTO {
  Subtotal: number;
  Impuestos: number;
  Total: number;
  Dias: number;
}

export interface PreReservaDTO {
  IdReserva: number;
  CodigoReserva: string;
  IdCliente: number;
  IdAgenciaRetiro: number;
  IdAgenciaDevolucion: number;
  IdVehiculo: number;
  FechaRetiro: string;
  FechaDevolucion: string;
  IdEstado: number;
  Subtotal: number;
  Impuestos: number;
  Total: number;
}

// ==================== Adapter ====================

export class EasyCarSoapAdapter extends SoapClient {
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
   * 1. Buscar Servicios (Vehículos)
   * Busca vehículos disponibles por filtros
   */
  async buscarServicios(
    categoria?: string,
    transmision?: string,
    fechaInicio?: string,
    fechaFin?: string,
    edadConductor?: number
  ): Promise<VehiculoDTO[]> {
    console.log('[Easy Car] 🔍 Parámetros recibidos:', { categoria, transmision, fechaInicio, fechaFin, edadConductor });
    
    // IMPORTANTE: Este servicio NO acepta campos vacíos
    // Solo incluimos los campos que tienen valores
    let fields = '';
    if (categoria) fields += `<categoria>${categoria}</categoria>`;
    if (transmision) fields += `<transmision>${transmision}</transmision>`;
    if (fechaInicio) fields += `<fechaInicio>${fechaInicio}</fechaInicio>`;
    if (fechaFin) fields += `<fechaFin>${fechaFin}</fechaFin>`;
    if (edadConductor && edadConductor > 0) fields += `<edadConductor>${edadConductor}</edadConductor>`;
    
    console.log('[Easy Car] 📝 Campos a enviar:', fields || '(ninguno)');
    
    const soapBody = `
      <BuscarServicios xmlns="http://tuservidor.com/booking/autos">
        ${fields}
      </BuscarServicios>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    console.log('[Easy Car] 📤 SOAP Envelope:', envelope.substring(0, 500));
    
    try {
      // Usar callRaw() para obtener XML como string
      const rawResponse = await this.callRaw(envelope, 'http://tuservidor.com/booking/autos/BuscarServicios');
      console.log('[Easy Car] 📄 Raw XML Response length:', rawResponse.length);
      
      // Contar elementos usando regex
      const matches = rawResponse.match(/<VehiculoDTO>/g);
      console.log('[Easy Car] 🚗 VehiculoDTO elements found:', matches ? matches.length : 0);
      
      return this.parseVehiculosListFromXml(rawResponse);
    } catch (error: any) {
      console.error('[Easy Car] ❌ Error en buscarServicios:', error.message);
      throw error;
    }
  }

  /**
   * 2. Obtener Detalle Servicio
   * Obtiene información detallada de un vehículo
   */
  async obtenerDetalleServicio(idVehiculo: number): Promise<VehiculoDTO> {
    const soapBody = `
      <ObtenerDetalleServicio xmlns="http://tuservidor.com/booking/autos">
        <idVehiculo>${idVehiculo}</idVehiculo>
      </ObtenerDetalleServicio>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/ObtenerDetalleServicio');
    return this.parseVehiculo(response);
  }

  /**
   * 3. Verificar Disponibilidad
   * Verifica disponibilidad por rango de fechas
   */
  async verificarDisponibilidad(
    idVehiculo: number,
    inicio: string,
    fin: string
  ): Promise<boolean> {
    const soapBody = `
      <VerificarDisponibilidad xmlns="http://tuservidor.com/booking/autos">
        <idVehiculo>${idVehiculo}</idVehiculo>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
      </VerificarDisponibilidad>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/VerificarDisponibilidad');
    
    const result = this.getNodeText(response, 'VerificarDisponibilidadResult');
    return result.toLowerCase() === 'true';
  }

  /**
   * 4. Cotizar Reserva
   * Calcula el precio total estimado de la reserva
   */
  async cotizarReserva(idVehiculo: number, dias: number): Promise<CotizacionDTO> {
    const soapBody = `
      <CotizarReserva xmlns="http://tuservidor.com/booking/autos">
        <idVehiculo>${idVehiculo}</idVehiculo>
        <dias>${dias}</dias>
      </CotizarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/CotizarReserva');
    return this.parseCotizacion(response);
  }

  /**
   * 5. Crear Pre-Reserva
   * Crea una reserva temporal en estado PENDIENTE
   */
  async crearPreReserva(
    idVehiculo: number,
    idCliente: number,
    inicio: string,
    fin: string,
    edadConductor: number
  ): Promise<PreReservaDTO> {
    const soapBody = `
      <CrearPreReserva xmlns="http://tuservidor.com/booking/autos">
        <idVehiculo>${idVehiculo}</idVehiculo>
        <idCliente>${idCliente}</idCliente>
        <inicio>${inicio}</inicio>
        <fin>${fin}</fin>
        <edadConductor>${edadConductor}</edadConductor>
      </CrearPreReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/CrearPreReserva');
    return this.parsePreReserva(response);
  }

  /**
   * 6. Confirmar Reserva
   * Confirma una reserva pendiente y genera factura
   */
  async confirmarReserva(idReserva: number): Promise<boolean> {
    const soapBody = `
      <ConfirmarReserva xmlns="http://tuservidor.com/booking/autos">
        <idReserva>${idReserva}</idReserva>
      </ConfirmarReserva>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/ConfirmarReserva');
    
    const result = this.getNodeText(response, 'ConfirmarReservaResult');
    return result.toLowerCase() === 'true';
  }

  /**
   * 7. Cancelar Reserva
   * Cancela una reserva activa y libera disponibilidad
   */
  async cancelarReservaIntegracion(idReserva: number, motivo: string): Promise<boolean> {
    const soapBody = `
      <CancelarReservaIntegracion xmlns="http://tuservidor.com/booking/autos">
        <idReserva>${idReserva}</idReserva>
        <motivo>${motivo || ''}</motivo>
      </CancelarReservaIntegracion>
    `;

    const envelope = this.buildSoapEnvelope(soapBody);
    const response = await this.call(envelope, 'http://tuservidor.com/booking/autos/CancelarReservaIntegracion');
    
    const result = this.getNodeText(response, 'CancelarReservaIntegracionResult');
    return result.toLowerCase() === 'true';
  }

  // ==================== Parser Helpers ====================

  /**
   * Parsear lista de vehículos desde XML crudo (raw string)
   * Usa regex para extraer elementos VehiculoDTO
   */
  private parseVehiculosListFromXml(xmlString: string): VehiculoDTO[] {
    const vehiculos: VehiculoDTO[] = [];
    
    // Extraer todos los bloques <VehiculoDTO>...</VehiculoDTO>
    const vehiculoRegex = /<VehiculoDTO>([\s\S]*?)<\/VehiculoDTO>/g;
    const matches = xmlString.matchAll(vehiculoRegex);
    
    for (const match of matches) {
      const vehiculoXml = match[1]; // Contenido entre <VehiculoDTO> y </VehiculoDTO>
      
      // Extraer valores
      const precioStr = this.extractXmlValue(vehiculoXml, 'PrecioBaseDia');
      console.log('[Easy Car] 💰 Precio extraído (string):', precioStr);
      
      const vehiculo: VehiculoDTO = {
        IdVehiculo: parseInt(this.extractXmlValue(vehiculoXml, 'IdVehiculo') || '0'),
        IdAgencia: parseInt(this.extractXmlValue(vehiculoXml, 'IdAgencia') || '0'),
        Marca: this.extractXmlValue(vehiculoXml, 'Marca') || '',
        Modelo: this.extractXmlValue(vehiculoXml, 'Modelo') || '',
        Anio: parseInt(this.extractXmlValue(vehiculoXml, 'Anio') || '0'),
        Categoria: this.extractXmlValue(vehiculoXml, 'Categoria') || '',
        Transmision: this.extractXmlValue(vehiculoXml, 'Transmision') || '',
        Combustible: this.extractXmlValue(vehiculoXml, 'Combustible') || '',
        Activo: (this.extractXmlValue(vehiculoXml, 'Activo') || '').toLowerCase() === 'true',
        PrecioBaseDia: parseFloat(precioStr || '0')
      };
      
      console.log('[Easy Car] 💵 Precio parseado (float):', vehiculo.PrecioBaseDia);
      vehiculos.push(vehiculo);
    }
    
    console.log('[Easy Car] ✅ Parsed vehiculos:', vehiculos.length);
    if (vehiculos.length > 0) {
      console.log('[Easy Car] 🔍 First vehiculo:', vehiculos[0]);
    }
    return vehiculos;
  }

  /**
   * Extrae el valor de un elemento XML usando regex
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  // ==================== Parser Helpers (DOM-based - legacy) ====================

  private parseVehiculoList(doc: Document): VehiculoDTO[] {
    const vehiculos: VehiculoDTO[] = [];
    const nodes = doc.getElementsByTagName('VehiculoDTO');

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      vehiculos.push(this.parseVehiculoNode(node));
    }

    return vehiculos;
  }

  private parseVehiculo(doc: Document): VehiculoDTO {
    const result = doc.getElementsByTagName('ObtenerDetalleServicioResult')[0];
    return this.parseVehiculoNode(result);
  }

  private parseVehiculoNode(node: Element): VehiculoDTO {
    return {
      IdVehiculo: parseInt(this.getChildText(node, 'IdVehiculo')) || 0,
      IdAgencia: parseInt(this.getChildText(node, 'IdAgencia')) || 0,
      Marca: this.getChildText(node, 'Marca'),
      Modelo: this.getChildText(node, 'Modelo'),
      Anio: parseInt(this.getChildText(node, 'Anio')) || 0,
      Categoria: this.getChildText(node, 'Categoria'),
      Transmision: this.getChildText(node, 'Transmision'),
      Combustible: this.getChildText(node, 'Combustible'),
      Activo: this.getChildText(node, 'Activo').toLowerCase() === 'true',
      PrecioBaseDia: parseFloat(this.getChildText(node, 'PrecioBaseDia')) || 0
    };
  }

  private parseCotizacion(doc: Document): CotizacionDTO {
    return {
      Subtotal: parseFloat(this.getNodeText(doc, 'Subtotal')) || 0,
      Impuestos: parseFloat(this.getNodeText(doc, 'Impuestos')) || 0,
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0,
      Dias: parseInt(this.getNodeText(doc, 'Dias')) || 0
    };
  }

  private parsePreReserva(doc: Document): PreReservaDTO {
    return {
      IdReserva: parseInt(this.getNodeText(doc, 'IdReserva')) || 0,
      CodigoReserva: this.getNodeText(doc, 'CodigoReserva'),
      IdCliente: parseInt(this.getNodeText(doc, 'IdCliente')) || 0,
      IdAgenciaRetiro: parseInt(this.getNodeText(doc, 'IdAgenciaRetiro')) || 0,
      IdAgenciaDevolucion: parseInt(this.getNodeText(doc, 'IdAgenciaDevolucion')) || 0,
      IdVehiculo: parseInt(this.getNodeText(doc, 'IdVehiculo')) || 0,
      FechaRetiro: this.getNodeText(doc, 'FechaRetiro'),
      FechaDevolucion: this.getNodeText(doc, 'FechaDevolucion'),
      IdEstado: parseInt(this.getNodeText(doc, 'IdEstado')) || 0,
      Subtotal: parseFloat(this.getNodeText(doc, 'Subtotal')) || 0,
      Impuestos: parseFloat(this.getNodeText(doc, 'Impuestos')) || 0,
      Total: parseFloat(this.getNodeText(doc, 'Total')) || 0
    };
  }

  private getChildText(parent: Element, tagName: string): string {
    const child = parent.getElementsByTagName(tagName)[0];
    return child?.textContent || '';
  }
}
