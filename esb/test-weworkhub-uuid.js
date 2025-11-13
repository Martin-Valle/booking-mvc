/**
 * TEST DIRECTO - obtenerDetalleServicio con UUID real
 * UUID: 6a8a0a7c-f00c-4650-9df4-fd6f4f98c017 (Habitación 101)
 */

import http from 'http';

const ENDPOINT = 'inegracion.runasp.net';
const PATH = '/WS_Integracion.asmx';
const NAMESPACE = 'http://weworkhub/integracion';

console.log('🔍 TEST DIRECTO - obtenerDetalleServicio\n');
console.log('UUID: 6a8a0a7c-f00c-4650-9df4-fd6f4f98c017');
console.log('(Habitación 101, Individual, $75)\n');

const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:obtenerDetalleServicio>
      <tns:idServicio>6a8a0a7c-f00c-4650-9df4-fd6f4f98c017</tns:idServicio>
    </tns:obtenerDetalleServicio>
  </soap:Body>
</soap:Envelope>`;

console.log('📤 Request:');
console.log(soapEnvelope);
console.log('\n' + '─'.repeat(60) + '\n');

const options = {
  hostname: ENDPOINT,
  path: PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'Content-Length': Buffer.byteLength(soapEnvelope),
    'SOAPAction': `${NAMESPACE}/obtenerDetalleServicio`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`📥 Status: ${res.statusCode}\n`);
    console.log('📄 Response completo:');
    console.log('─'.repeat(60));
    console.log(data);
    console.log('─'.repeat(60));
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(soapEnvelope);
req.end();
