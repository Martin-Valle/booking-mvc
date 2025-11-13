/**
 * 🔍 Debug detallado del servicio SkyAndes
 */

import axios from 'axios';

async function debugSkyAndes() {
  console.log('\n🔍 ===== DEBUG DETALLADO DE SKYANDES =====\n');
  
  const endpoint = 'http://skyandesintegracion.runasp.net/WS_Integracion.asmx';
  const soapAction = 'http://skyandes.com/integracion/buscarServicios';
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <buscarServicios xmlns="http://skyandes.com/integracion/">
      <OriginId>1</OriginId>
      <DestinationId>2</DestinationId>
      <Fecha>2025-12-15T00:00:00</Fecha>
      <CabinClass>Economy</CabinClass>
    </buscarServicios>
  </soap:Body>
</soap:Envelope>`;

  console.log('📤 Request SOAP enviado:');
  console.log('   URL:', endpoint);
  console.log('   SOAPAction:', soapAction);
  console.log('   Body:', soapEnvelope.substring(0, 400) + '...\n');

  try {
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': `"${soapAction}"`
      },
      timeout: 30000
    });

    console.log('✅ Respuesta exitosa (HTTP 200)');
    console.log('\n📄 XML Completo de la respuesta:\n');
    console.log(response.data);
    
    console.log('\n✅ El servicio SOAP está funcionando correctamente');

  } catch (error: any) {
    console.log('❌ Error capturado\n');
    
    if (error.response) {
      console.log('📊 INFORMACIÓN DE LA RESPUESTA:');
      console.log('   HTTP Status:', error.response.status, error.response.statusText);
      console.log('   Content-Type:', error.response.headers['content-type']);
      console.log('   Server:', error.response.headers['server']);
      
      console.log('\n📄 Respuesta del servidor:\n');
      console.log(error.response.data);
      
    } else if (error.request) {
      console.log('❌ No se recibió respuesta del servidor');
      console.log('   Posible problema de red o servidor caído');
    } else {
      console.log('❌ Error en la configuración de la petición');
      console.log('   Mensaje:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Ejecutar debug
debugSkyAndes();
