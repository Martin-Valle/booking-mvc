const http = require('http');

const ENDPOINT = 'http://easycar.runasp.net/IntegracionService.asmx';
const NAMESPACE = 'http://tuservidor.com/booking/autos';

async function testSoap(testName, soapBody) {
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
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
  console.log('\n🚗 EASY CAR - Probando con IDs que SÍ existen en el SOAP\n');

  try {
    // 1. Detalle del RAV4 (ID 3)
    await testSoap('ObtenerDetalleServicio: Toyota RAV4 (ID 3)', `
      <ObtenerDetalleServicio xmlns="${NAMESPACE}">
        <idVehiculo>3</idVehiculo>
      </ObtenerDetalleServicio>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Detalle del BMW (ID 4)
    await testSoap('ObtenerDetalleServicio: BMW X6 (ID 4)', `
      <ObtenerDetalleServicio xmlns="${NAMESPACE}">
        <idVehiculo>4</idVehiculo>
      </ObtenerDetalleServicio>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Cotizar RAV4 - 3 días
    await testSoap('CotizarReserva: RAV4 (ID 3), 3 días', `
      <CotizarReserva xmlns="${NAMESPACE}">
        <idVehiculo>3</idVehiculo>
        <dias>3</dias>
      </CotizarReserva>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Crear Pre-Reserva RAV4
    await testSoap('CrearPreReserva: RAV4 (ID 3), Usuario 1', `
      <CrearPreReserva xmlns="${NAMESPACE}">
        <idVehiculo>3</idVehiculo>
        <idCliente>1</idCliente>
        <inicio>2025-10-30</inicio>
        <fin>2025-11-02</fin>
        <edadConductor>27</edadConductor>
      </CrearPreReserva>
    `);

    console.log('\n✅ PRUEBAS COMPLETADAS\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

runTests();
