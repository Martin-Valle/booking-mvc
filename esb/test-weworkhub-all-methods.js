const https = require('https');
const http = require('http');

const ENDPOINT = 'http://inegracion.runasp.net/WS_Integracion.asmx';
const NAMESPACE = 'http://weworkhub/integracion';

// Agent para permitir certificados inválidos si fuera HTTPS
const agent = new https.Agent({ rejectUnauthorized: false });

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
        'SOAPAction': `"${NAMESPACE}/${testName.split(':')[0]}"` // Extraer acción del nombre
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
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
  console.log('\n🧪 PRUEBAS CON DATOS REALES DE TU AMIGO');
  console.log('========================================\n');

  try {
    // 1. BUSCAR SERVICIOS - Datos reales
    await testSoap('buscarServicios: Hoteles en Cuenca', `
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
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. OBTENER DETALLE - UUID REAL: Habitación 101
    await testSoap('obtenerDetalleServicio: Habitación 101 (UUID real)', `
    <tns:obtenerDetalleServicio>
      <tns:idServicio>6a8a0a7c-f00c-4650-9df4-fd6f4f98c017</tns:idServicio>
    </tns:obtenerDetalleServicio>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. VERIFICAR DISPONIBILIDAD - SKU REAL: 101
    await testSoap('verificarDisponibilidad: Habitación 101 (SKU 101)', `
    <tns:verificarDisponibilidad>
      <tns:sku>101</tns:sku>
      <tns:inicio>2025-11-01</tns:inicio>
      <tns:fin>2025-11-05</tns:fin>
      <tns:unidades>1</tns:unidades>
    </tns:verificarDisponibilidad>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. COTIZAR RESERVA - Habitación 101 real
    await testSoap('cotizarReserva: Habitación 101 ($75 x 4 noches)', `
    <tns:cotizarReserva>
      <tns:items>
        <ItemItinerarioSoapDto>
          <sku>101</sku>
          <serviceType>HOTEL</serviceType>
          <fechaInicio>2025-11-01</fechaInicio>
          <fechaFin>2025-11-05</fechaFin>
          <unidades>1</unidades>
          <precioUnitario>75.00</precioUnitario>
        </ItemItinerarioSoapDto>
      </tns:items>
    </tns:cotizarReserva>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. CREAR PRE-RESERVA - Cliente real ID 14
    await testSoap('crearPreReserva: Cliente real (ID 14) en Habitación 201', `
    <tns:crearPreReserva>
      <tns:itinerario>
        <ItemItinerarioSoapDto>
          <sku>201</sku>
          <serviceType>HOTEL</serviceType>
          <fechaInicio>2025-12-01</fechaInicio>
          <fechaFin>2025-12-04</fechaFin>
          <unidades>1</unidades>
          <precioUnitario>120.00</precioUnitario>
        </ItemItinerarioSoapDto>
      </tns:itinerario>
      <tns:cliente>
        <IdUsuario>14</IdUsuario>
        <NumeroIdentificacion>0987654321</NumeroIdentificacion>
        <TipoIdentificacion>CI</TipoIdentificacion>
        <Email>cliente1@email.com</Email>
        <Nombres>María José</Nombres>
        <Apellidos>González López</Apellidos>
        <Telefono>0999123456</Telefono>
        <Nacionalidad>ECUATORIANA</Nacionalidad>
      </tns:cliente>
      <tns:holdMinutes>30</tns:holdMinutes>
      <tns:idemKey>test-prereserva-api-nueva-001</tns:idemKey>
    </tns:crearPreReserva>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. CONFIRMAR RESERVA - Pre-reserva real
    await testSoap('confirmarReserva: PRE-TEST-001 (existe en DB)', `
    <tns:confirmarReserva>
      <tns:preBookingId>PRE-TEST-001</tns:preBookingId>
      <tns:metodoPago>TARJETA_CREDITO</tns:metodoPago>
      <tns:datosPago>{"numero":"4111111111111111","exp":"12/26","cvv":"123"}</tns:datosPago>
    </tns:confirmarReserva>
    `);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. CANCELAR RESERVA - Reserva real
    await testSoap('cancelarReservaIntegracion: RES-20251027-001 (existe en DB)', `
    <tns:cancelarReservaIntegracion>
      <tns:bookingId>RES-20251027-001</tns:bookingId>
      <tns:motivo>Prueba de cancelación desde API externa</tns:motivo>
    </tns:cancelarReservaIntegracion>
    `);

    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS\n');
  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
  }
}

runTests();
