/**
 * 🦀 Debug Script - El Cangrejo Feliz
 * Analiza las respuestas SOAP crudas para verificar estructura XML
 */

import axios from 'axios';
import { buildSoapEnvelope } from './utils/soap-utils';

const endpoint = 'https://elcangrejofeliz.runasp.net/WS_IntegracionRestaurante.asmx';
const namespace = 'http://elcangrejofeliz.ec/Integracion';

async function debugBuscarServicios() {
  console.log('🦀 DEBUG: El Cangrejo Feliz - buscarServicios');
  console.log('='.repeat(60));
  
  const body = `
    <buscarServicios xmlns="${namespace}">
      <filtros></filtros>
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
    
    // Contar servicios en la respuesta
    const serviciosCount = (response.data.match(/<ServicioDTO>/g) || []).length;
    console.log(`\n📊 Servicios encontrados: ${serviciosCount}`);
    
  } catch (error: any) {
    console.error('❌ Error en la petición SOAP:');
    console.error(`   HTTP Status: ${error.response?.status}`);
    console.error(`   Message: ${error.message}`);
    if (error.response?.data) {
      console.error(`\n📄 Error Response:`);
      console.error(error.response.data);
    }
  }
}

debugBuscarServicios();
