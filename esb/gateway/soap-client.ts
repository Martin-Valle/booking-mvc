/**
 * ESB - Gateway - Cliente SOAP Base
 * Cliente HTTP para llamadas SOAP a servicios externos
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ESBLogger, parseSoapResponse, hasSoapFault, getSoapFaultMessage } from '../utils/soap-utils';
import type { EndpointConfig } from '../utils/config';

const logger = ESBLogger.getInstance();

export class SoapClient {
  private axiosInstance: AxiosInstance;
  private endpoint: EndpointConfig;

  constructor(endpoint: EndpointConfig) {
    this.endpoint = endpoint;
    this.axiosInstance = axios.create({
      baseURL: endpoint.url,
      timeout: endpoint.timeout || 30000,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': ''
      }
    });
  }

  /**
   * Ejecuta una llamada SOAP vía proxy (para el navegador)
   */
  private async callViaProxy(soapEnvelope: string, soapAction?: string): Promise<Document> {
    try {
      console.log('[SOAP Client] 🌐 Usando proxy para evitar CORS...');
      console.log('[SOAP Client] 📡 Endpoint:', this.endpoint.url);
      console.log('[SOAP Client] 📤 SOAPAction:', soapAction);
      
      // Detectar si estamos en desarrollo o producción
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
      
      // URL del proxy según el entorno - USA EL PROXY GENÉRICO DE SOAP
      const proxyUrl = isDevelopment 
        ? 'http://localhost:3001/api/proxy/soap'  // Desarrollo: Express local (proxy genérico)
        : '/.netlify/functions/soap-proxy';        // Producción: Netlify Function
      
      console.log('[SOAP Client] Entorno:', isDevelopment ? 'Desarrollo' : 'Producción');
      console.log('[SOAP Client] Proxy URL:', proxyUrl);
      
      // Preparar payload para el proxy genérico
      const payload = {
        url: this.endpoint.url,
        soapAction: soapAction || '',
        body: soapEnvelope
      };
      
      console.log('[SOAP Client] 📦 Enviando al proxy...');
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('[SOAP Client] ✅ Respuesta recibida del proxy');
      
      const doc = await parseSoapResponse(responseText);

      // Verificar si hay un SOAP Fault
      if (hasSoapFault(doc)) {
        const faultMessage = getSoapFaultMessage(doc);
        logger.error('SOAP Fault recibido', { message: faultMessage });
        throw new Error(`SOAP Fault: ${faultMessage}`);
      }

      logger.info('Respuesta SOAP recibida exitosamente vía proxy');
      return doc;

    } catch (error: any) {
      console.error('[SOAP Client] ❌ Error en proxy:', error);
      throw new Error(`Error en llamada vía proxy: ${error.message}`);
    }
  }

  /**
   * Detecta si está ejecutándose en el navegador
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Ejecuta una llamada SOAP
   */
  async call(soapEnvelope: string, soapAction?: string): Promise<Document> {
    if (!this.endpoint.enabled) {
      throw new Error(`El endpoint ${this.endpoint.url} está deshabilitado`);
    }

    logger.info(`Llamada SOAP a ${this.endpoint.url}`, { soapAction });

    // Si estamos en el navegador, usar el proxy
    if (this.isBrowser()) {
      return this.callViaProxy(soapEnvelope, soapAction);
    }

    // Si estamos en Node.js, llamada directa
    const config: AxiosRequestConfig = {};
    if (soapAction) {
      config.headers = { 'SOAPAction': soapAction };
    }

    try {
      const response = await this.axiosInstance.post('', soapEnvelope, config);
      const doc = await parseSoapResponse(response.data);

      // Verificar si hay un SOAP Fault
      if (hasSoapFault(doc)) {
        const faultMessage = getSoapFaultMessage(doc);
        logger.error('SOAP Fault recibido', { message: faultMessage });
        throw new Error(`SOAP Fault: ${faultMessage}`);
      }

      logger.info('Respuesta SOAP recibida exitosamente');
      return doc;
    } catch (error: any) {
      logger.error('Error en llamada SOAP', error);
      
      if (error.response) {
        // El servidor respondió con un código de error
        throw new Error(`Error HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        throw new Error('No se recibió respuesta del servidor');
      } else {
        // Error al configurar la petición
        throw error;
      }
    }
  }

  /**
   * Ejecuta una llamada SOAP y retorna el XML crudo (raw string)
   */
  async callRaw(soapEnvelope: string, soapAction?: string): Promise<string> {
    if (!this.endpoint.enabled) {
      throw new Error(`El endpoint ${this.endpoint.url} está deshabilitado`);
    }

    logger.info(`Llamada SOAP a ${this.endpoint.url}`, { soapAction });

    // Si estamos en el navegador, usar el proxy
    if (this.isBrowser()) {
      throw new Error('callRaw no soportado en navegador, usar call() en su lugar');
    }

    // Si estamos en Node.js, llamada directa
    const config: AxiosRequestConfig = {};
    if (soapAction) {
      config.headers = { 'SOAPAction': soapAction };
    }

    try {
      const response = await this.axiosInstance.post('', soapEnvelope, config);
      logger.info('Respuesta SOAP recibida exitosamente');
      return response.data;
    } catch (error: any) {
      logger.error('Error en llamada SOAP', error);
      
      if (error.response) {
        throw new Error(`Error HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw error;
      }
    }
  }

  /**
   * Extrae un valor de texto de un nodo XML
   */
  protected getNodeText(doc: Document, tagName: string): string {
    const node = doc.getElementsByTagName(tagName)[0];
    return node?.textContent || '';
  }

  /**
   * Extrae múltiples valores de nodos XML
   */
  protected getNodeTexts(doc: Document, tagName: string): string[] {
    const nodes = doc.getElementsByTagName(tagName);
    const texts: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const text = nodes[i].textContent;
      if (text) texts.push(text);
    }
    return texts;
  }

  /**
   * Extrae un número de un nodo XML
   */
  protected getNodeNumber(doc: Document, tagName: string, defaultValue: number = 0): number {
    const text = this.getNodeText(doc, tagName);
    return text ? parseFloat(text) : defaultValue;
  }

  /**
   * Extrae un booleano de un nodo XML
   */
  protected getNodeBoolean(doc: Document, tagName: string, defaultValue: boolean = false): boolean {
    const text = this.getNodeText(doc, tagName).toLowerCase();
    if (text === 'true' || text === '1') return true;
    if (text === 'false' || text === '0') return false;
    return defaultValue;
  }

  /**
   * Extrae una fecha de un nodo XML
   */
  protected getNodeDate(doc: Document, tagName: string): Date | null {
    const text = this.getNodeText(doc, tagName);
    return text ? new Date(text) : null;
  }
}
