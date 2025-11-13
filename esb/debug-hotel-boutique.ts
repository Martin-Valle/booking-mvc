/**
 * 🏨 Debug Script - Hotel Boutique Paris
 * Analiza el error del servidor en detalle
 */

import axios from 'axios';
import { buildSoapEnvelope } from './utils/soap-utils';

const endpoint = 'http://hotelboutique.runasp.net/WS_Integracion.asmx';
const namespace = 'http://hotelparis.com/integracion';

async function debugHotelBoutique() {
  console.log('🏨 DEBUG: Hotel Boutique Paris - Análisis de Error');
  console.log('='.repeat(60));
  
  const body = `
    <buscarServicios xmlns="${namespace}">
      <ciudad>Quito</ciudad>
      <inicio>2025-12-20T00:00:00</inicio>
      <fin>2025-12-23T00:00:00</fin>
      <precioMin>0</precioMin>
      <precioMax>200</precioMax>
      <amenities>WiFi</amenities>
    </buscarServicios>
  `;
  
  const soapEnvelope = buildSoapEnvelope(body);
  
  try {
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${namespace}/buscarServicios"`
      }
    });
    
    console.log(`✅ HTTP Status: ${response.status} ${response.statusText}`);
    console.log('\n📄 XML Response:');
    console.log(response.data);
    
  } catch (error: any) {
    console.error('❌ Error en la petición SOAP:');
    console.error(`   HTTP Status: ${error.response?.status}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.response?.data) {
      console.error(`\n📄 SOAP Fault Response:`);
      console.error(error.response.data);
      
      // Extraer el error específico
      const faultMatch = error.response.data.match(/<faultstring>(.*?)<\/faultstring>/s);
      if (faultMatch) {
        console.error(`\n🔍 ERROR DETALLADO:`);
        const errorDetail = faultMatch[1]
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/\r\n/g, '\n');
        console.error(errorDetail);
      }
      
      // Analizar la causa
      if (error.response.data.includes('NullReferenceException')) {
        console.error(`\n💡 DIAGNÓSTICO:`);
        console.error(`   ❌ NullReferenceException en Conexion.cs:line 13`);
        console.error(`   ❌ Ocurre en el constructor de GDatos.Conexion`);
        console.error(`   ❌ El servidor no puede leer la cadena de conexión`);
        console.error(`\n📋 CAUSA PROBABLE:`);
        console.error(`   - ConfigurationManager.ConnectionStrings es null`);
        console.error(`   - Falta el Web.config o connectionStrings no está configurado`);
        console.error(`   - La aplicación no puede acceder a la configuración`);
        console.error(`\n🔧 SOLUCIÓN:`);
        console.error(`   El administrador debe:`);
        console.error(`   1. Verificar que Web.config existe`);
        console.error(`   2. Agregar <connectionStrings> con la BD correcta`);
        console.error(`   3. Verificar permisos de lectura del archivo`);
      }
    }
  }
}

debugHotelBoutique();
