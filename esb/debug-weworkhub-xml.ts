/**
 * Debug: Mostrar XML SOAP generado
 */

import { WeWorkHubIntegracionSoapAdapter } from './gateway/weworkhub-integracion.adapter';
import { getESBConfig } from './utils/config';

// Extender la clase para acceder al método privado
class DebugAdapter extends WeWorkHubIntegracionSoapAdapter {
  public buildSoapEnvelopePublic(body: string): string {
    return (this as any).buildSoapEnvelope(body);
  }
}

const config = getESBConfig();
const adapter = new DebugAdapter(config.endpoints.weWorkHubIntegracion);

// Construir el SOAP body manualmente para ver cómo queda
const soapBody = `
    <tns:buscarServicios>
      <tns:filtros>
        <q1:serviceType>HOTEL</q1:serviceType>
        <q1:ciudad>Quito</q1:ciudad>
        <q1:fechaInicio>2025-11-01</q1:fechaInicio>
        <q1:fechaFin>2025-11-03</q1:fechaFin>
        <q1:precioMin>30</q1:precioMin>
        <q1:precioMax>120</q1:precioMax>
        <q1:amenities><arr:string>WiFi</arr:string><arr:string>Desayuno</arr:string></q1:amenities>
        <q1:clasificacionMin>3</q1:clasificacionMin>
        <q1:adultos>2</q1:adultos>
        <q1:ninos>0</q1:ninos>
      </tns:filtros>
    </tns:buscarServicios>
    `;

const envelope = adapter.buildSoapEnvelopePublic(soapBody);

console.log('═══════════════════════════════════════════════════════════════');
console.log('  XML SOAP GENERADO');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(envelope);
console.log('\n═══════════════════════════════════════════════════════════════');
