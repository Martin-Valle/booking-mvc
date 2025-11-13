const http = require('http');

// Alquiler Autos Guayaquil/Quito (AGQ/AGG)
const ENDPOINT = 'http://alquileraugye.runasp.net/AutosIntegracion.asmx';

async function testSoap(testName, soapBody, soapAction) {
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
  console.log('REQUEST:');
  console.log(envelope);
  console.log('\n' + '─'.repeat(80));

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
        'SOAPAction': soapAction
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`RESPONSE STATUS: ${res.statusCode}`);
        console.log('RESPONSE:');
        console.log(data);
        console.log('═'.repeat(80) + '\n');
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.error(`ERROR: ${e.message}`);
      console.log('═'.repeat(80) + '\n');
      reject(e);
    });

    req.write(envelope);
    req.end();
  });
}

async function runTests() {
  console.log('\n🚗 PRUEBAS ALQUILER AUTOS GYE/QUITO (AGQ/AGG)');
  console.log('=============================================');
  console.log('Endpoint: http://alquileraugye.runasp.net/AutosIntegracion.asmx');
  console.log('Datos: AGQ1 (Quito), AGG1 (Guayaquil), Toyota Yaris $30/día\n');

  try {
    // Primero necesito descubrir qué métodos tiene este SOAP
    // Voy a probar los métodos comunes de integración de autos
    
    // 1. BuscarAutos / BuscarServicios
    await testSoap(
      'BuscarAutos: Sin filtros', 
      `<BuscarAutos xmlns="http://tempuri.org/" />`,
      '"http://tempuri.org/BuscarAutos"'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Probar con namespace diferente si el anterior falla
    await testSoap(
      'BuscarServicios: Sin filtros', 
      `<BuscarServicios xmlns="http://tempuri.org/" />`,
      '"http://tempuri.org/BuscarServicios"'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. ListarAutos
    await testSoap(
      'ListarAutos: Todos', 
      `<ListarAutos xmlns="http://tempuri.org/" />`,
      '"http://tempuri.org/ListarAutos"'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. ObtenerAutos
    await testSoap(
      'ObtenerAutos: Todos', 
      `<ObtenerAutos xmlns="http://tempuri.org/" />`,
      '"http://tempuri.org/ObtenerAutos"'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. ConsultarDisponibilidad
    await testSoap(
      'ConsultarDisponibilidad: General', 
      `<ConsultarDisponibilidad xmlns="http://tempuri.org/" />`,
      '"http://tempuri.org/ConsultarDisponibilidad"'
    );

    console.log('\n✅ PRUEBAS COMPLETADAS');
    console.log('\n📋 NOTA: Si todos fallan, necesitamos ver el WSDL para conocer los métodos exactos.');
    console.log('    Puedes abrirlo en: http://alquileraugye.runasp.net/AutosIntegracion.asmx?wsdl\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

runTests();
