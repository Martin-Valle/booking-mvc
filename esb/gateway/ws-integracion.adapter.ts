import { SoapClient } from './soap-client';

// ========================================
// DTOs y Tipos - WS Integración (WCF)
// ========================================

export interface SearchCriteria {
  FechaInicio?: Date;
  FechaFin?: Date;
  IdCategoria?: number;
  IdPlataforma?: number;
  Page?: number;
  PageSize?: number;
  Ubicacion?: string;
}

export interface Servicio {
  IdServicio: number;
  Nombre: string;
  Descripcion: string;
  PrecioBase: number;
  Moneda: string;
  IdCategoria: number;
  NombreCategoria: string;
  Disponible: boolean;
  ImagenUrl?: string;
  Ubicacion?: string;
}

export interface DisponibilidadRequest {
  IdServicio: number;
  FechaInicio: Date;
  FechaFin: Date;
  Cantidad?: number;
}

export interface DisponibilidadResponse {
  Disponible: boolean;
  Mensaje?: string;
  UnidadesDisponibles?: number;
}

export interface PrecioTotalRequest {
  IdServicio: number;
  FechaInicio: Date;
  FechaFin: Date;
  Cantidad: number;
}

export interface PrecioTotalResponse {
  PrecioTotal: number;
  PrecioBase: number;
  Impuestos: number;
  Descuentos: number;
  Moneda: string;
  Detalle?: string;
}

export interface PreReservaRequest {
  IdServicio: number;
  IdCliente: number;
  FechaInicio: Date;
  FechaFin: Date;
  Cantidad: number;
  DatosCliente?: string;
}

export interface PreReservaResponse {
  IdPreReserva: string;
  Estado: string;
  ExpiraEn: Date;
  MontoTotal: number;
  Moneda: string;
}

export interface ConfirmarPreReservaRequest {
  IdPreReserva: string;
  MetodoPago?: string;
}

export interface ReservaResponse {
  IdReserva: number;
  Estado: string;
  FechaCreacion: Date;
  MontoTotal: number;
  Moneda: string;
  CodigoConfirmacion?: string;
}

export interface CancelarReservaRequest {
  IdReserva: number;
  Motivo?: string;
}

export interface CancelarReservaResponse {
  Exitoso: boolean;
  Mensaje: string;
  MontoReembolso?: number;
}

// ========================================
// WS Integración SOAP Adapter (WCF)
// ========================================

export class WSIntegracionSoapAdapter extends SoapClient {
  
  /**
   * Helper: Convierte Date a formato WCF (ISO 8601 completo)
   */
  private formatDateForSoap(date: Date): string {
    return date.toISOString(); // WCF soporta ISO completo
  }

  /**
   * 1. Buscar servicios con criterios
   */
  async buscarServicios(criterios?: SearchCriteria): Promise<Servicio[]> {
    const fechaInicioXml = criterios?.FechaInicio 
      ? `<a:FechaInicio>${this.formatDateForSoap(criterios.FechaInicio)}</a:FechaInicio>`
      : '<a:FechaInicio i:nil="true" />';
    
    const fechaFinXml = criterios?.FechaFin
      ? `<a:FechaFin>${this.formatDateForSoap(criterios.FechaFin)}</a:FechaFin>`
      : '<a:FechaFin i:nil="true" />';

    const body = `
      <tem:BuscarServicios>
        <tem:criterios xmlns:a="http://schemas.datacontract.org/2004/07/Entidades.Integracion" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          ${fechaInicioXml}
          ${fechaFinXml}
          ${criterios?.IdCategoria ? `<a:IdCategoria>${criterios.IdCategoria}</a:IdCategoria>` : '<a:IdCategoria i:nil="true" />'}
          ${criterios?.IdPlataforma ? `<a:IdPlataforma>${criterios.IdPlataforma}</a:IdPlataforma>` : '<a:IdPlataforma i:nil="true" />'}
          <a:Page>${criterios?.Page || 1}</a:Page>
          <a:PageSize>${criterios?.PageSize || 10}</a:PageSize>
          ${criterios?.Ubicacion ? `<a:Ubicacion>${criterios.Ubicacion}</a:Ubicacion>` : '<a:Ubicacion i:nil="true" />'}
        </tem:criterios>
      </tem:BuscarServicios>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/BuscarServicios');
    
    const servicios: Servicio[] = [];
    const items = xml.getElementsByTagName('a:Servicio');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      servicios.push({
        IdServicio: parseInt(this.getTextContent(item, 'a:IdServicio') || '0'),
        Nombre: this.getTextContent(item, 'a:Nombre') || '',
        Descripcion: this.getTextContent(item, 'a:Descripcion') || '',
        PrecioBase: parseFloat(this.getTextContent(item, 'a:PrecioBase') || '0'),
        Moneda: this.getTextContent(item, 'a:Moneda') || 'USD',
        IdCategoria: parseInt(this.getTextContent(item, 'a:IdCategoria') || '0'),
        NombreCategoria: this.getTextContent(item, 'a:NombreCategoria') || '',
        Disponible: this.getTextContent(item, 'a:Disponible') === 'true',
        ImagenUrl: this.getTextContent(item, 'a:ImagenUrl'),
        Ubicacion: this.getTextContent(item, 'a:Ubicacion')
      });
    }
    
    return servicios;
  }

  /**
   * 2. Verificar disponibilidad de servicio
   */
  async verificarDisponibilidad(request: DisponibilidadRequest): Promise<DisponibilidadResponse> {
    const body = `
      <tem:VerificarDisponibilidad>
        <tem:request xmlns:a="http://schemas.datacontract.org/2004/07/Entidades.Integracion" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <a:IdServicio>${request.IdServicio}</a:IdServicio>
          <a:FechaInicio>${this.formatDateForSoap(request.FechaInicio)}</a:FechaInicio>
          <a:FechaFin>${this.formatDateForSoap(request.FechaFin)}</a:FechaFin>
          ${request.Cantidad ? `<a:Cantidad>${request.Cantidad}</a:Cantidad>` : '<a:Cantidad i:nil="true" />'}
        </tem:request>
      </tem:VerificarDisponibilidad>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/VerificarDisponibilidad');
    
    const resultEl = xml.getElementsByTagName('VerificarDisponibilidadResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo verificar disponibilidad');
    }

    return {
      Disponible: this.getTextContent(resultEl, 'a:Disponible') === 'true',
      Mensaje: this.getTextContent(resultEl, 'a:Mensaje'),
      UnidadesDisponibles: parseInt(this.getTextContent(resultEl, 'a:UnidadesDisponibles') || '0')
    };
  }

  /**
   * 3. Calcular precio total
   */
  async calcularPrecioTotal(request: PrecioTotalRequest): Promise<PrecioTotalResponse> {
    const body = `
      <tem:CalcularPrecioTotal>
        <tem:request xmlns:a="http://schemas.datacontract.org/2004/07/Entidades.Integracion" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <a:IdServicio>${request.IdServicio}</a:IdServicio>
          <a:FechaInicio>${this.formatDateForSoap(request.FechaInicio)}</a:FechaInicio>
          <a:FechaFin>${this.formatDateForSoap(request.FechaFin)}</a:FechaFin>
          <a:Cantidad>${request.Cantidad}</a:Cantidad>
        </tem:request>
      </tem:CalcularPrecioTotal>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/CalcularPrecioTotal');
    
    const resultEl = xml.getElementsByTagName('CalcularPrecioTotalResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo calcular precio');
    }

    return {
      PrecioTotal: parseFloat(this.getTextContent(resultEl, 'a:PrecioTotal') || '0'),
      PrecioBase: parseFloat(this.getTextContent(resultEl, 'a:PrecioBase') || '0'),
      Impuestos: parseFloat(this.getTextContent(resultEl, 'a:Impuestos') || '0'),
      Descuentos: parseFloat(this.getTextContent(resultEl, 'a:Descuentos') || '0'),
      Moneda: this.getTextContent(resultEl, 'a:Moneda') || 'USD',
      Detalle: this.getTextContent(resultEl, 'a:Detalle')
    };
  }

  /**
   * 4. Crear pre-reserva
   */
  async crearPreReserva(request: PreReservaRequest): Promise<PreReservaResponse> {
    const body = `
      <tem:CrearPreReserva>
        <tem:request xmlns:a="http://schemas.datacontract.org/2004/07/Entidades.Integracion" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <a:IdServicio>${request.IdServicio}</a:IdServicio>
          <a:IdCliente>${request.IdCliente}</a:IdCliente>
          <a:FechaInicio>${this.formatDateForSoap(request.FechaInicio)}</a:FechaInicio>
          <a:FechaFin>${this.formatDateForSoap(request.FechaFin)}</a:FechaFin>
          <a:Cantidad>${request.Cantidad}</a:Cantidad>
          ${request.DatosCliente ? `<a:DatosCliente>${request.DatosCliente}</a:DatosCliente>` : '<a:DatosCliente i:nil="true" />'}
        </tem:request>
      </tem:CrearPreReserva>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/CrearPreReserva');
    
    const resultEl = xml.getElementsByTagName('CrearPreReservaResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo crear pre-reserva');
    }

    return {
      IdPreReserva: this.getTextContent(resultEl, 'a:IdPreReserva') || '',
      Estado: this.getTextContent(resultEl, 'a:Estado') || '',
      ExpiraEn: new Date(this.getTextContent(resultEl, 'a:ExpiraEn') || Date.now()),
      MontoTotal: parseFloat(this.getTextContent(resultEl, 'a:MontoTotal') || '0'),
      Moneda: this.getTextContent(resultEl, 'a:Moneda') || 'USD'
    };
  }

  /**
   * 5. Confirmar pre-reserva (sin pago final)
   */
  async confirmarPreReserva(request: ConfirmarPreReservaRequest): Promise<ReservaResponse> {
    const body = `
      <tem:ConfirmarPreReserva>
        <tem:request xmlns:a="http://schemas.datacontract.org/2004/07/Entidades.Integracion" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <a:IdPreReserva>${request.IdPreReserva}</a:IdPreReserva>
          ${request.MetodoPago ? `<a:MetodoPago>${request.MetodoPago}</a:MetodoPago>` : '<a:MetodoPago i:nil="true" />'}
        </tem:request>
      </tem:ConfirmarPreReserva>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/ConfirmarPreReserva');
    
    return this.parseReservaResponse(xml, 'ConfirmarPreReservaResult');
  }

  /**
   * 6. Confirmar reserva (pago final)
   */
  async confirmarReserva(idReserva: number, datosPago?: string): Promise<ReservaResponse> {
    const body = `
      <tem:ConfirmarReserva>
        <tem:idReserva>${idReserva}</tem:idReserva>
        ${datosPago ? `<tem:datosPago xmlns:i="http://www.w3.org/2001/XMLSchema-instance">${datosPago}</tem:datosPago>` : '<tem:datosPago i:nil="true" xmlns:i="http://www.w3.org/2001/XMLSchema-instance" />'}
      </tem:ConfirmarReserva>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/ConfirmarReserva');
    
    return this.parseReservaResponse(xml, 'ConfirmarReservaResult');
  }

  /**
   * 7. Cancelar reserva
   */
  async cancelarReserva(request: CancelarReservaRequest): Promise<CancelarReservaResponse> {
    const body = `
      <tem:CancelarReserva>
        <tem:request xmlns:a="http://schemas.datacontract.org/2004/07/Entidades.Integracion" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <a:IdReserva>${request.IdReserva}</a:IdReserva>
          ${request.Motivo ? `<a:Motivo>${request.Motivo}</a:Motivo>` : '<a:Motivo i:nil="true" />'}
        </tem:request>
      </tem:CancelarReserva>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/CancelarReserva');
    
    const resultEl = xml.getElementsByTagName('CancelarReservaResult')[0];
    if (!resultEl) {
      throw new Error('No se pudo cancelar reserva');
    }

    return {
      Exitoso: this.getTextContent(resultEl, 'a:Exitoso') === 'true',
      Mensaje: this.getTextContent(resultEl, 'a:Mensaje') || '',
      MontoReembolso: parseFloat(this.getTextContent(resultEl, 'a:MontoReembolso') || '0')
    };
  }

  /**
   * 8. Consultar reserva por ID
   */
  async consultarReserva(idReserva: number): Promise<ReservaResponse> {
    const body = `
      <tem:ConsultarReserva>
        <tem:idReserva>${idReserva}</tem:idReserva>
      </tem:ConsultarReserva>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/ConsultarReserva');
    
    return this.parseReservaResponse(xml, 'ConsultarReservaResult');
  }

  /**
   * 9. Consultar pre-reserva por ID
   */
  async consultarPreReserva(idPreReserva: string): Promise<PreReservaResponse> {
    const body = `
      <tem:ConsultarPreReserva>
        <tem:idPreReserva>${idPreReserva}</tem:idPreReserva>
      </tem:ConsultarPreReserva>
    `;

    const soapEnvelope = this.buildWCFEnvelope(body);
    const xml = await this.call(soapEnvelope, 'http://tempuri.org/IIntegracionService/ConsultarPreReserva');
    
    const resultEl = xml.getElementsByTagName('ConsultarPreReservaResult')[0];
    if (!resultEl) {
      throw new Error('No se encontró la pre-reserva');
    }

    return {
      IdPreReserva: this.getTextContent(resultEl, 'a:IdPreReserva') || '',
      Estado: this.getTextContent(resultEl, 'a:Estado') || '',
      ExpiraEn: new Date(this.getTextContent(resultEl, 'a:ExpiraEn') || Date.now()),
      MontoTotal: parseFloat(this.getTextContent(resultEl, 'a:MontoTotal') || '0'),
      Moneda: this.getTextContent(resultEl, 'a:Moneda') || 'USD'
    };
  }

  // ========================================
  // Helpers
  // ========================================

  /**
   * Extrae texto de un elemento hijo
   */
  private getTextContent(element: Element, tagName: string): string | undefined {
    const child = element.getElementsByTagName(tagName)[0];
    return child?.textContent || undefined;
  }

  /**
   * Construye envelope WCF (diferente a SOAP 1.1 estándar)
   */
  private buildWCFEnvelope(body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <s:Body>
    ${body}
  </s:Body>
</s:Envelope>`;
  }

  /**
   * Parser común para ReservaResponse
   */
  private parseReservaResponse(xml: Document, tagName: string): ReservaResponse {
    const resultEl = xml.getElementsByTagName(tagName)[0];
    if (!resultEl) {
      throw new Error(`No se encontró ${tagName}`);
    }

    return {
      IdReserva: parseInt(this.getTextContent(resultEl, 'a:IdReserva') || '0'),
      Estado: this.getTextContent(resultEl, 'a:Estado') || '',
      FechaCreacion: new Date(this.getTextContent(resultEl, 'a:FechaCreacion') || Date.now()),
      MontoTotal: parseFloat(this.getTextContent(resultEl, 'a:MontoTotal') || '0'),
      Moneda: this.getTextContent(resultEl, 'a:Moneda') || 'USD',
      CodigoConfirmacion: this.getTextContent(resultEl, 'a:CodigoConfirmacion')
    };
  }
}
