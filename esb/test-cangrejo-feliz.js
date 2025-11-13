/**
 * TEST COMPLETO - El Cangrejo Feliz SOAP 🦀
 * Ejecutar con: node esb/test-cangrejo-feliz.js
 */

import https from 'https';

// Configuración del servicio
const ENDPOINT = 'elcangrejofeliz.runasp.net';
const PATH = '/WS_IntegracionRestaurante.asmx';
const NAMESPACE = 'http://elcangrejofeliz.ec/Integracion';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🦀 TEST EL CANGREJO FELIZ - SOAP SERVICE');
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1: buscarServicios
// ============================================================================
async function testBuscarServicios() {
  console.log('🔍 TEST 1: buscarServicios (sin filtros)');
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <buscarServicios xmlns="${NAMESPACE}">
      <filtros></filtros>
    </buscarServicios>
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
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Contar mesas
        const matches = data.match(/<ServicioDTO>/g);
        const count = matches ? matches.length : 0;
        
        console.log(`   ✅ Mesas encontradas: ${count}`);
        
        if (count > 0) {
          // Extraer todas las mesas
          const ids = [...data.matchAll(/<IdServicio>(\d+)<\/IdServicio>/g)];
          const nombres = [...data.matchAll(/<Nombre>([^<]+)<\/Nombre>/g)];
          const precios = [...data.matchAll(/<Precio>([^<]+)<\/Precio>/g)];
          const ciudades = [...data.matchAll(/<Ciudad>([^<]+)<\/Ciudad>/g)];
          
          console.log(`\n   📋 Lista de mesas disponibles:\n`);
          for (let i = 0; i < count; i++) {
            console.log(`      ${i + 1}. ID: ${ids[i] ? ids[i][1] : 'N/A'} - ${nombres[i] ? nombres[i][1] : 'N/A'}`);
            console.log(`         Ciudad: ${ciudades[i] ? ciudades[i][1] : 'N/A'} | Precio: $${precios[i] ? precios[i][1] : 'N/A'}`);
          }
        }
        
        console.log('\n');
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
async function testObtenerDetalle(idServicio = 2) {
  console.log(`🔍 TEST 2: obtenerDetalleServicio (ID: ${idServicio})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <obtenerDetalleServicio xmlns="${NAMESPACE}">
      <idServicio>${idServicio}</idServicio>
    </obtenerDetalleServicio>
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
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer datos
        const idMatch = data.match(/<IdServicio>(\d+)<\/IdServicio>/);
        const nombreMatch = data.match(/<Nombre>([^<]+)<\/Nombre>/);
        const tipoMatch = data.match(/<Tipo>([^<]+)<\/Tipo>/);
        const ciudadMatch = data.match(/<Ciudad>([^<]+)<\/Ciudad>/);
        const precioMatch = data.match(/<Precio>([^<]+)<\/Precio>/);
        const clasificacionMatch = data.match(/<Clasificacion>([^<]+)<\/Clasificacion>/);
        const descripcionMatch = data.match(/<Descripcion>([^<]+)<\/Descripcion>/);
        const politicasMatch = data.match(/<Politicas>([^<]+)<\/Politicas>/);
        const reglasMatch = data.match(/<Reglas>([^<]+)<\/Reglas>/);
        
        if (idMatch) {
          console.log(`   ✅ Servicio encontrado:\n`);
          console.log(`      ID: ${idMatch[1]}`);
          console.log(`      Nombre: ${nombreMatch ? nombreMatch[1] : 'N/A'}`);
          console.log(`      Tipo: ${tipoMatch ? tipoMatch[1] : 'N/A'}`);
          console.log(`      Ciudad: ${ciudadMatch ? ciudadMatch[1] : 'N/A'}`);
          console.log(`      Precio: $${precioMatch ? precioMatch[1] : 'N/A'}`);
          console.log(`      Clasificación: ${clasificacionMatch ? clasificacionMatch[1] : 'N/A'}`);
          console.log(`      Descripción: ${descripcionMatch ? descripcionMatch[1] : 'N/A'}`);
          console.log(`      Políticas: ${politicasMatch ? politicasMatch[1] : 'N/A'}`);
          console.log(`      Reglas: ${reglasMatch ? reglasMatch[1] : 'N/A'}`);
        } else {
          console.log(`   ⚠️  No se encontró el servicio con ID ${idServicio}`);
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
async function testVerificarDisponibilidad(sku = 101) {
  console.log(`🔍 TEST 3: verificarDisponibilidad (SKU: ${sku})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const fechaInicio = new Date('2025-10-27T12:00:00').toISOString();
  const fechaFin = new Date('2025-10-27T14:00:00').toISOString();

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <verificarDisponibilidad xmlns="${NAMESPACE}">
      <sku>${sku}</sku>
      <fechaInicio>${fechaInicio}</fechaInicio>
      <fechaFin>${fechaFin}</fechaFin>
      <unidades>2</unidades>
    </verificarDisponibilidad>
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
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer disponibilidad
        const disponibleMatch = data.match(/<Disponible>(true|false)<\/Disponible>/i);
        
        if (disponibleMatch) {
          const disponible = disponibleMatch[1].toLowerCase() === 'true';
          
          if (disponible) {
            console.log(`   ✅ DISPONIBLE`);
            console.log(`      El servicio SKU ${sku} está disponible`);
            console.log(`      Fechas: ${fechaInicio} - ${fechaFin}`);
            console.log(`      Unidades solicitadas: 2`);
          } else {
            console.log(`   ⚠️  NO DISPONIBLE`);
            console.log(`      El servicio SKU ${sku} NO está disponible`);
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
async function testCotizarReserva(sku = 2) {
  console.log(`🔍 TEST 4: cotizarReserva (SKU: ${sku})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const fechaInicio = new Date('2025-10-28T19:00:00').toISOString();
  const fechaFin = new Date('2025-10-28T21:00:00').toISOString();

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <cotizarReserva xmlns="${NAMESPACE}">
      <sku>${sku}</sku>
      <fechaInicio>${fechaInicio}</fechaInicio>
      <fechaFin>${fechaFin}</fechaFin>
      <unidades>1</unidades>
    </cotizarReserva>
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
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Respuesta recibida:\n');
        console.log(`   Status: ${res.statusCode}`);
        
        // Extraer cotización
        const totalMatch = data.match(/<Total>([^<]+)<\/Total>/);
        const breakdownItems = [...data.matchAll(/<ItemDetalle>[\s\S]*?<\/ItemDetalle>/g)];
        
        if (totalMatch) {
          console.log(`   ✅ COTIZACIÓN GENERADA:\n`);
          console.log(`      Total: $${totalMatch[1]}`);
          
          if (breakdownItems.length > 0) {
            console.log(`\n      Desglose:`);
            breakdownItems.forEach((item, i) => {
              const nombre = item[0].match(/<Nombre>([^<]+)<\/Nombre>/);
              const cantidad = item[0].match(/<Cantidad>([^<]+)<\/Cantidad>/);
              const precioUnit = item[0].match(/<PrecioUnitario>([^<]+)<\/PrecioUnitario>/);
              const precioTotal = item[0].match(/<PrecioTotal>([^<]+)<\/PrecioTotal>/);
              
              console.log(`         ${i + 1}. ${nombre ? nombre[1] : 'N/A'}`);
              console.log(`            Cantidad: ${cantidad ? cantidad[1] : 'N/A'} x $${precioUnit ? precioUnit[1] : 'N/A'} = $${precioTotal ? precioTotal[1] : 'N/A'}`);
            });
          }
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
async function testCrearPreReserva(sku = 2) {
  console.log(`🔍 TEST 5: crearPreReserva (SKU: ${sku})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const fechaInicio = new Date('2025-10-28T19:00:00').toISOString();
  const fechaFin = new Date('2025-10-28T21:00:00').toISOString();

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <crearPreReserva xmlns="${NAMESPACE}">
      <sku>${sku}</sku>
      <fechaInicio>${fechaInicio}</fechaInicio>
      <fechaFin>${fechaFin}</fechaFin>
      <unidades>1</unidades>
      <datosContacto>Juan Perez|+593987654321|test@example.com</datosContacto>
    </crearPreReserva>
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
    const req = https.request(options, (res) => {
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
          console.log(`\n      ⚠️  Importante: Tienes tiempo limitado para confirmar`);
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
async function testConfirmarReserva(preBookingId) {
  console.log(`🔍 TEST 6: confirmarReserva (PreBookingId: ${preBookingId})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <confirmarReserva xmlns="${NAMESPACE}">
      <preBookingId>${preBookingId}</preBookingId>
      <metodoPago>Tarjeta</metodoPago>
      <datosPago>VISA-****1234|123</datosPago>
    </confirmarReserva>
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
    const req = https.request(options, (res) => {
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
          console.log(`\n      🎉 ¡Reserva exitosa! Guarda tu BookingId`);
        } else {
          console.log(`   ⚠️  No se pudo confirmar la reserva`);
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
async function testCancelarReserva(bookingId) {
  console.log(`🔍 TEST 7: cancelarReservaIntegracion (BookingId: ${bookingId})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <cancelarReservaIntegracion xmlns="${NAMESPACE}">
      <bookingId>${bookingId}</bookingId>
      <motivo>Prueba de integración</motivo>
    </cancelarReservaIntegracion>
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
    const req = https.request(options, (res) => {
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
            console.log(`      La reserva ${bookingId} fue cancelada exitosamente`);
          } else {
            console.log(`   ⚠️  NO SE PUDO CANCELAR`);
            console.log(`      La reserva no pudo ser cancelada`);
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
    
    // Test 2: Obtener detalle (ID 2)
    await testObtenerDetalle(2);
    
    // Test 3: Verificar disponibilidad
    await testVerificarDisponibilidad(101);
    
    // Test 4: Cotizar reserva
    await testCotizarReserva(2);
    
    // Test 5: Crear pre-reserva
    const { preBookingId } = await testCrearPreReserva(2);
    
    // Test 6 y 7: Solo si se creó una pre-reserva
    if (preBookingId) {
      const { bookingId } = await testConfirmarReserva(preBookingId);
      
      if (bookingId) {
        await testCancelarReserva(bookingId);
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log(`  🦀 El Cangrejo Feliz tiene ${count} mesas disponibles`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runAllTests();
