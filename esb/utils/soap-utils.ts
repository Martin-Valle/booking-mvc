/**
 * ESB - Utilidades para manejo de SOAP
 */

/**
 * Escapa caracteres especiales XML
 */
export function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (char) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    return map[char] || char;
  });
}

/**
 * Convierte un objeto Date a string XML
 */
export function dateToXmlString(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Convierte un string XML a Date
 */
export function xmlStringToDate(xmlDate: string): Date {
  return new Date(xmlDate);
}

/**
 * Construye un envelope SOAP 1.1 con el body proporcionado
 */
export function buildSoapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Genera un envelope SOAP genérico
 */
export function createSoapEnvelope(
  namespace: string,
  operation: string,
  body: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="${namespace}">
  <soapenv:Header/>
  <soapenv:Body>
    <ns:${operation}>
      ${body}
    </ns:${operation}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Parsea una respuesta SOAP y extrae el body
 * Soporta tanto navegador (browser) como Node.js
 */
export async function parseSoapResponse(xmlString: string): Promise<Document> {
  // Detectar si estamos en Node.js o en navegador
  if (typeof DOMParser !== 'undefined') {
    // Navegador
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, 'text/xml');
  } else {
    // Node.js - usar xmldom
    try {
      const xmldom = await import('@xmldom/xmldom');
      const parser = new xmldom.DOMParser();
      return parser.parseFromString(xmlString, 'text/xml');
    } catch (error) {
      throw new Error('No se pudo parsear XML. Instala @xmldom/xmldom para Node.js');
    }
  }
}

/**
 * Extrae un valor de un nodo XML
 */
export function getXmlNodeValue(doc: Document, tagName: string): string | null {
  const node = doc.getElementsByTagName(tagName)[0];
  return node?.textContent || null;
}

/**
 * Extrae múltiples valores de nodos XML
 */
export function getXmlNodeValues(doc: Document, tagName: string): string[] {
  const nodes = doc.getElementsByTagName(tagName);
  const values: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const value = nodes[i].textContent;
    if (value) values.push(value);
  }
  return values;
}

/**
 * Crea un objeto de error estandarizado
 */
export interface ESBError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export function createError(code: string, message: string, details?: any): ESBError {
  return {
    code,
    message,
    details,
    timestamp: new Date()
  };
}

/**
 * Valida si una respuesta SOAP tiene errores
 */
export function hasSoapFault(doc: Document): boolean {
  return doc.getElementsByTagName('soap:Fault').length > 0 ||
         doc.getElementsByTagName('soapenv:Fault').length > 0;
}

/**
 * Extrae el mensaje de error de un SOAP Fault
 */
export function getSoapFaultMessage(doc: Document): string {
  const faultString = getXmlNodeValue(doc, 'faultstring');
  return faultString || 'Error desconocido en la respuesta SOAP';
}

/**
 * Logger simple para el ESB
 */
export class ESBLogger {
  private static instance: ESBLogger;
  private logs: Array<{ level: string; message: string; timestamp: Date; data?: any }> = [];

  private constructor() {}

  static getInstance(): ESBLogger {
    if (!ESBLogger.instance) {
      ESBLogger.instance = new ESBLogger();
    }
    return ESBLogger.instance;
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }

  private log(level: string, message: string, data?: any): void {
    const entry = {
      level,
      message,
      timestamp: new Date(),
      data
    };
    this.logs.push(entry);
    console.log(`[ESB ${level}] ${message}`, data || '');
  }

  getLogs(): Array<{ level: string; message: string; timestamp: Date; data?: any }> {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Generador de IDs únicos
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Retry handler para llamadas SOAP
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      ESBLogger.getInstance().warn(`Intento ${i + 1}/${maxRetries} falló`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}
