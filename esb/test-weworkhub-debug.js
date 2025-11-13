/**
 * TEST DEBUG - WeWorkHub buscarServicios
 * Ver la respuesta XML completa
 */

import http from 'http';

const ENDPOINT = 'inegracion.runasp.net';
const PATH = '/WS_Integracion.asmx';
const NAMESPACE = 'http://weworkhub/integracion';

console.log('🔍 TEST DEBUG - WeWorkHub buscarServicios\n');

// Test más simple posible
const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:buscarServicios>
      <tns:filtros>
        <serviceType>HOTEL</serviceType>
        <fechaInicio>2025-11-01</fechaInicio>
        <fechaFin>2025-11-05</fechaFin>
        <precioMin>50</precioMin>
        <precioMax>200</precioMax>
        <adultos>2</adultos>
        <ninos>0</ninos>
      </tns:filtros>
    </tns:buscarServicios>
  </soap:Body>
</soap:Envelope>`;

console.log('📤 Request XML:');
console.log(soapEnvelope);
console.log('\n─────────────────────────────────────\n');

const options = {
  hostname: ENDPOINT,
  path: PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'Content-Length': Buffer.byteLength(soapEnvelope),
    'SOAPAction': `${NAMESPACE}/buscarServicios`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📥 Status: ${res.statusCode}\n`);
    console.log('📄 Response XML completo:');
    console.log('─────────────────────────────────────');
    console.log(data);
    console.log('─────────────────────────────────────\n');
    
    // Buscar errores SOAP
    if (data.includes('faultstring')) {
      const faultMatch = data.match(/<faultstring>([^<]+)<\/faultstring>/);
      if (faultMatch) {
        console.log('❌ SOAP Fault:', faultMatch[1]);
      }
    }
    
    // Buscar habitaciones
    const habitaciones = data.match(/<ServicioSoapDto>/g);
    console.log(`\n✅ Habitaciones encontradas: ${habitaciones ? habitaciones.length : 0}`);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(soapEnvelope);
req.end();
