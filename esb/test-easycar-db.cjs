const http = require('http');

// Easy Car - Alquiler Autos Quito/Guayaquil
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
        'SOAPAction': `"${NAMESPACE}/${testName.split(':')[0]}"`
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
  console.log('\n🚗 PRUEBAS EASY CAR - Datos Reales de tu DB');
  console.log('===========================================');
  console.log('Agencias: AGQ1 (Quito), AGG1 (Guayaquil)');
  console.log('Auto real: Toyota Yaris 2021, PBA-1010, $30/día\n');

  try {
    // 1. BUSCAR SERVICIOS - Sin filtros (todos los autos disponibles)
    await testSoap('BuscarServicios: Todos los autos', `
      <BuscarServicios xmlns="${NAMESPACE}">
      </BuscarServicios>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. BUSCAR SERVICIOS - Por categoría ECONOMY
    await testSoap('BuscarServicios: Categoría ECONOMY', `
      <BuscarServicios xmlns="${NAMESPACE}">
        <categoria>ECONOMY</categoria>
      </BuscarServicios>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. BUSCAR SERVICIOS - Por transmisión AT (Automático)
    await testSoap('BuscarServicios: Transmisión Automática', `
      <BuscarServicios xmlns="${NAMESPACE}">
        <transmision>AT</transmision>
      </BuscarServicios>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. BUSCAR SERVICIOS - Con fechas futuras
    await testSoap('BuscarServicios: Fechas 30 oct - 2 nov', `
      <BuscarServicios xmlns="${NAMESPACE}">
        <fechaInicio>2025-10-30</fechaInicio>
        <fechaFin>2025-11-02</fechaFin>
      </BuscarServicios>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. OBTENER DETALLE - Asumiendo que el Toyota Yaris es ID 1
    await testSoap('ObtenerDetalleServicio: Auto ID 1 (Toyota Yaris)', `
      <ObtenerDetalleServicio xmlns="${NAMESPACE}">
        <idVehiculo>1</idVehiculo>
      </ObtenerDetalleServicio>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. VERIFICAR DISPONIBILIDAD - Auto 1, fechas futuras
    await testSoap('VerificarDisponibilidad: Auto 1, 30 oct - 2 nov', `
      <VerificarDisponibilidad xmlns="${NAMESPACE}">
        <idVehiculo>1</idVehiculo>
        <inicio>2025-10-30</inicio>
        <fin>2025-11-02</fin>
      </VerificarDisponibilidad>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. COTIZAR RESERVA - 3 días (como en tu DB)
    await testSoap('CotizarReserva: Auto 1, 3 días', `
      <CotizarReserva xmlns="${NAMESPACE}">
        <idVehiculo>1</idVehiculo>
        <dias>3</dias>
      </CotizarReserva>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 8. CREAR PRE-RESERVA - Usuario 1 (de tu DB)
    await testSoap('CrearPreReserva: Usuario 1, Auto 1, 3 días', `
      <CrearPreReserva xmlns="${NAMESPACE}">
        <idVehiculo>1</idVehiculo>
        <idCliente>1</idCliente>
        <inicio>2025-10-30</inicio>
        <fin>2025-11-02</fin>
        <edadConductor>27</edadConductor>
      </CrearPreReserva>
    `);

    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS\n');
    console.log('📊 RESUMEN:');
    console.log('   • Si BuscarServicios retorna autos: ✅ El SOAP funciona');
    console.log('   • Si retorna vacío: El servicio funciona pero no hay datos');
    console.log('   • Si da error 500: Revisar implementación del servidor SOAP\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
  }
}

runTests();
