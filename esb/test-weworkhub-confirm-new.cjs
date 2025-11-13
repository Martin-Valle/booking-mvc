const http = require('http');

const ENDPOINT = 'http://inegracion.runasp.net/WS_Integracion.asmx';
const NAMESPACE = 'http://weworkhub/integracion';

async function testSoap(testName, soapBody) {
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    ${soapBody}
  </soap:Body>
</soap:Envelope>`;

  console.log('\n' + '═'.repeat(80));
  console.log(`TEST: ${testName}`);
  console.log('═'.repeat(80));

  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(envelope),
        'SOAPAction': `"${NAMESPACE}/${testName.split(':')[0]}"`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log('RESPONSE:');
        console.log(data);
        console.log('═'.repeat(80));
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.write(envelope);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 PRUEBA: Confirmar la Pre-Reserva que ACABAMOS de Crear\n');

  try {
    // Confirmar la pre-reserva que acabamos de crear
    await testSoap('confirmarReserva: PRE-20251028-5C941410 (recién creada)', `
    <tns:confirmarReserva>
      <tns:preBookingId>PRE-20251028-5C941410</tns:preBookingId>
      <tns:metodoPago>TARJETA_CREDITO</tns:metodoPago>
      <tns:datosPago>{"numero":"4111111111111111","exp":"12/26","cvv":"123"}</tns:datosPago>
    </tns:confirmarReserva>
    `);

    console.log('\n✅ PRUEBA COMPLETADA\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

runTests();
