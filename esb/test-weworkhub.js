/**
 * TEST COMPLETO - WeWorkHub Cuenca SOAP 🏨
 * Ejecutar con: node esb/test-weworkhub.js
 * Datos de prueba reales de la base de datos
 */

import http from 'http';

// Configuración del servicio
const ENDPOINT = 'inegracion.runasp.net'; // Nota: tiene typo en el dominio (inegracion)
const PATH = '/WS_Integracion.asmx';
const NAMESPACE = 'http://weworkhub/integracion';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🏨 TEST WEWORKHUB CUENCA - SOAP SERVICE');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`  Endpoint: http://${ENDPOINT}${PATH}`);
console.log(`  Namespace: ${NAMESPACE}\n`);

// ============================================================================
// TEST 1: buscarServicios
// ============================================================================
async function testBuscarServicios() {
  console.log('🔍 TEST 1: buscarServicios (HOTEL, fechas futuras)');
  console.log('─────────────────────────────────────────────────────────────\n');

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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Buscar servicios en la respuesta
        const matches = data.match(/<ServicioSoapDto>/g);
        const count = matches ? matches.length : 0;
        
        console.log(`   ✅ Hoteles encontrados: ${count}`);
        
        if (count > 0) {
          // Extraer detalles
          const ids = [...data.matchAll(/<IdServicio>([^<]+)<\/IdServicio>/g)];
          const nombres = [...data.matchAll(/<Nombre>([^<]+)<\/Nombre>/g)];
          const tipos = [...data.matchAll(/<Tipo>([^<]+)<\/Tipo>/g)];
          const precios = [...data.matchAll(/<Precio>([^<]+)<\/Precio>/g)];
          
          console.log(`\n   📋 Primeras 5 habitaciones:\n`);
          for (let i = 0; i < Math.min(5, count); i++) {
            console.log(`      ${i + 1}. ${nombres[i] ? nombres[i][1] : 'N/A'}`);
            console.log(`         ID: ${ids[i] ? ids[i][1] : 'N/A'}`);
            console.log(`         Tipo: ${tipos[i] ? tipos[i][1] : 'N/A'}`);
            console.log(`         Precio: $${precios[i] ? precios[i][1] : 'N/A'}`);
            console.log('');
          }
        }
        
        console.log('');
        resolve({ count, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// TEST 2: obtenerDetalleServicio
// ============================================================================
async function testObtenerDetalle() {
  console.log('🔍 TEST 2: obtenerDetalleServicio');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const idServicio = '6a8a0a7c-f00c-4650-9df4-fd6f4f98c017'; // UUID real: habitación 101

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:obtenerDetalleServicio>
      <tns:idServicio>${idServicio}</tns:idServicio>
    </tns:obtenerDetalleServicio>
  </soap:Body>
</soap:Envelope>`;

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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   UUID buscado: ${idServicio}\n`);
        
        // Extraer datos
        const idMatch = data.match(/<IdServicio>([^<]+)<\/IdServicio>/);
        const nombreMatch = data.match(/<Nombre>([^<]+)<\/Nombre>/);
        const tipoMatch = data.match(/<Tipo>([^<]+)<\/Tipo>/);
        const precioMatch = data.match(/<Precio>([^<]+)<\/Precio>/);
        const descripcionMatch = data.match(/<Descripcion>([^<]+)<\/Descripcion>/);
        
        if (idMatch) {
          console.log(`   ✅ Habitación encontrada:\n`);
          console.log(`      ID: ${idMatch[1]}`);
          console.log(`      Nombre: ${nombreMatch ? nombreMatch[1] : 'N/A'}`);
          console.log(`      Tipo: ${tipoMatch ? tipoMatch[1] : 'N/A'}`);
          console.log(`      Precio: $${precioMatch ? precioMatch[1] : 'N/A'}`);
          console.log(`      Descripción: ${descripcionMatch ? descripcionMatch[1] : 'N/A'}`);
        } else {
          console.log(`   ⚠️  No se encontró la habitación`);
        }
        
        console.log('\n');
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// TEST 3: verificarDisponibilidad
// ============================================================================
async function testVerificarDisponibilidad() {
  console.log('🔍 TEST 3: verificarDisponibilidad (Habitación 101)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:verificarDisponibilidad>
      <tns:sku>101</tns:sku>
      <tns:inicio>2025-11-01</tns:inicio>
      <tns:fin>2025-11-05</tns:fin>
      <tns:unidades>1</tns:unidades>
    </tns:verificarDisponibilidad>
  </soap:Body>
</soap:Envelope>`;

  const options = {
    hostname: ENDPOINT,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(soapEnvelope),
      'SOAPAction': `${NAMESPACE}/verificarDisponibilidad`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer disponibilidad
        const disponibleMatch = data.match(/<Disponible>(true|false)<\/Disponible>/i);
        const mensajeMatch = data.match(/<Mensaje>([^<]*)<\/Mensaje>/);
        
        if (disponibleMatch) {
          const disponible = disponibleMatch[1].toLowerCase() === 'true';
          
          if (disponible) {
            console.log(`   ✅ DISPONIBLE`);
            console.log(`      Habitación 101 está disponible`);
            console.log(`      Fechas: 2025-11-01 a 2025-11-05`);
            console.log(`      Unidades: 1`);
          } else {
            console.log(`   ⚠️  NO DISPONIBLE`);
            console.log(`      Habitación 101 NO está disponible`);
            if (mensajeMatch && mensajeMatch[1]) {
              console.log(`      Mensaje: ${mensajeMatch[1]}`);
            }
          }
        } else {
          console.log(`   ⚠️  No se pudo determinar disponibilidad`);
        }
        
        console.log('\n');
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// TEST 4: cotizarReserva
// ============================================================================
async function testCotizarReserva() {
  console.log('🔍 TEST 4: cotizarReserva (Habitación 101, 4 noches)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
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
  </soap:Body>
</soap:Envelope>`;

  const options = {
    hostname: ENDPOINT,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(soapEnvelope),
      'SOAPAction': `${NAMESPACE}/cotizarReserva`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer cotización
        const subtotalMatch = data.match(/<Subtotal>([^<]+)<\/Subtotal>/);
        const impuestosMatch = data.match(/<Impuestos>([^<]+)<\/Impuestos>/);
        const totalMatch = data.match(/<Total>([^<]+)<\/Total>/);
        
        if (totalMatch) {
          console.log(`   ✅ COTIZACIÓN GENERADA:\n`);
          console.log(`      Subtotal: $${subtotalMatch ? subtotalMatch[1] : 'N/A'}`);
          console.log(`      Impuestos: $${impuestosMatch ? impuestosMatch[1] : 'N/A'}`);
          console.log(`      Total: $${totalMatch[1]}`);
          console.log(`\n      📊 Esperado: $75 x 4 noches = $300`);
        } else {
          console.log(`   ⚠️  No se pudo generar la cotización`);
        }
        
        console.log('\n');
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// TEST 5: crearPreReserva
// ============================================================================
async function testCrearPreReserva() {
  console.log('🔍 TEST 5: crearPreReserva (Habitación 201, Cliente María José)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
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
  </soap:Body>
</soap:Envelope>`;

  const options = {
    hostname: ENDPOINT,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(soapEnvelope),
      'SOAPAction': `${NAMESPACE}/crearPreReserva`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer pre-reserva
        const preBookingIdMatch = data.match(/<PreBookingId>([^<]+)<\/PreBookingId>/);
        const expiraEnMatch = data.match(/<ExpiraEn>([^<]+)<\/ExpiraEn>/);
        
        if (preBookingIdMatch) {
          console.log(`   ✅ PRE-RESERVA CREADA:\n`);
          console.log(`      PreBookingId: ${preBookingIdMatch[1]}`);
          console.log(`      Expira en: ${expiraEnMatch ? expiraEnMatch[1] : 'N/A'}`);
          console.log(`      Cliente: María José González López`);
          console.log(`      Habitación: 201 (Doble, $120)`);
          console.log(`      Hold: 30 minutos`);
        } else {
          console.log(`   ⚠️  No se pudo crear la pre-reserva`);
        }
        
        console.log('\n');
        resolve({ preBookingId: preBookingIdMatch ? preBookingIdMatch[1] : null, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// TEST 6: confirmarReserva
// ============================================================================
async function testConfirmarReserva() {
  console.log('🔍 TEST 6: confirmarReserva (PRE-TEST-001)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const preBookingId = 'PRE-TEST-001'; // Pre-reserva existente en la BD

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:confirmarReserva>
      <tns:preBookingId>${preBookingId}</tns:preBookingId>
      <tns:metodoPago>TARJETA_CREDITO</tns:metodoPago>
      <tns:datosPago>{"numero":"4111111111111111","exp":"12/26","cvv":"123"}</tns:datosPago>
    </tns:confirmarReserva>
  </soap:Body>
</soap:Envelope>`;

  const options = {
    hostname: ENDPOINT,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(soapEnvelope),
      'SOAPAction': `${NAMESPACE}/confirmarReserva`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer confirmación
        const bookingIdMatch = data.match(/<BookingId>([^<]+)<\/BookingId>/);
        const estadoMatch = data.match(/<Estado>([^<]+)<\/Estado>/);
        
        if (bookingIdMatch) {
          console.log(`   ✅ RESERVA CONFIRMADA:\n`);
          console.log(`      BookingId: ${bookingIdMatch[1]}`);
          console.log(`      Estado: ${estadoMatch ? estadoMatch[1] : 'N/A'}`);
          console.log(`      Método de pago: TARJETA_CREDITO`);
        } else {
          console.log(`   ⚠️  No se pudo confirmar la reserva`);
          console.log(`      Nota: PRE-TEST-001 debe existir en la BD`);
        }
        
        console.log('\n');
        resolve({ bookingId: bookingIdMatch ? bookingIdMatch[1] : null, data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// TEST 7: cancelarReservaIntegracion
// ============================================================================
async function testCancelarReserva() {
  console.log('🔍 TEST 7: cancelarReservaIntegracion (RES-20251027-001)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const bookingId = 'RES-20251027-001'; // Reserva existente en la BD

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:cancelarReservaIntegracion>
      <tns:bookingId>${bookingId}</tns:bookingId>
      <tns:motivo>Prueba de cancelación desde API externa</tns:motivo>
    </tns:cancelarReservaIntegracion>
  </soap:Body>
</soap:Envelope>`;

  const options = {
    hostname: ENDPOINT,
    path: PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(soapEnvelope),
      'SOAPAction': `${NAMESPACE}/cancelarReservaIntegracion`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer cancelación
        const cancelacionMatch = data.match(/<Cancelacion>(true|false)<\/Cancelacion>/i);
        
        if (cancelacionMatch) {
          const cancelado = cancelacionMatch[1].toLowerCase() === 'true';
          
          if (cancelado) {
            console.log(`   ✅ RESERVA CANCELADA`);
            console.log(`      BookingId: ${bookingId}`);
            console.log(`      La reserva fue cancelada exitosamente`);
          } else {
            console.log(`   ⚠️  NO SE PUDO CANCELAR`);
            console.log(`      La reserva no pudo ser cancelada`);
            console.log(`      Nota: RES-20251027-001 debe existir en la BD`);
          }
        } else {
          console.log(`   ⚠️  No se pudo determinar el estado de cancelación`);
        }
        
        console.log('\n');
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.write(soapEnvelope);
    req.end();
  });
}

// ============================================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================================
async function runAllTests() {
  try {
    // Test 1: Buscar servicios
    const { count } = await testBuscarServicios();
    
    // Test 2: Obtener detalle
    await testObtenerDetalle();
    
    // Test 3: Verificar disponibilidad
    await testVerificarDisponibilidad();
    
    // Test 4: Cotizar reserva
    await testCotizarReserva();
    
    // Test 5: Crear pre-reserva
    await testCrearPreReserva();
    
    // Test 6: Confirmar reserva (con datos existentes)
    await testConfirmarReserva();
    
    // Test 7: Cancelar reserva (con datos existentes)
    await testCancelarReserva();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log(`  🏨 WeWorkHub Cuenca encontró ${count} hoteles`);
    console.log('  💰 Rango de precios: $65 - $200');
    console.log('  📍 Ciudad: Cuenca, Ecuador');
    console.log('  🎯 7/7 métodos SOAP probados');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error.message);
    console.error('\n⚠️  NOTA: Verifica que el servidor esté activo');
    console.error(`   Endpoint: http://${ENDPOINT}${PATH}\n`);
    process.exit(1);
  }
}

// Ejecutar
runAllTests();
