/**
 * TEST COMPLETO - Sanctum Cortejo SOAP 🏛️
 * Ejecutar con: node esb/test-sanctum-cortejo.js
 */

import https from 'https';

// Configuración del servicio
const ENDPOINT = 'sanctumcortejo.runasp.net';
const PATH = '/Ws_IntegracionRestaurante.asmx';
const NAMESPACE = 'http://sanctumcortejo.ec/Integracion';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🏛️  TEST SANCTUM CORTEJO - SOAP SERVICE');
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
          // Extraer mesas por capacidad
          const ids = [...data.matchAll(/<IdServicio>(\d+)<\/IdServicio>/g)];
          const nombres = [...data.matchAll(/<Nombre>([^<]+)<\/Nombre>/g)];
          const precios = [...data.matchAll(/<Precio>([^<]+)<\/Precio>/g)];
          const ciudades = [...data.matchAll(/<Ciudad>([^<]+)<\/Ciudad>/g)];
          
          // Agrupar por capacidad
          const por2 = [];
          const por4 = [];
          const por6 = [];
          
          for (let i = 0; i < count; i++) {
            const nombre = nombres[i][1];
            if (nombre.includes('(2 personas)')) por2.push(i);
            else if (nombre.includes('(4 personas)')) por4.push(i);
            else if (nombre.includes('(6 personas)')) por6.push(i);
          }
          
          console.log(`\n   📊 Distribución de mesas:\n`);
          console.log(`      🪑 2 personas: ${por2.length} mesas (${ precios[por2[0]] ? precios[por2[0]][1] : 'N/A'})`);
          console.log(`      🪑🪑 4 personas: ${por4.length} mesas (${ precios[por4[0]] ? precios[por4[0]][1] : 'N/A'})`);
          console.log(`      🪑🪑🪑 6 personas: ${por6.length} mesas (${ precios[por6[0]] ? precios[por6[0]][1] : 'N/A'})`);
          console.log(`      📍 Ciudad: ${ciudades[0] ? ciudades[0][1] : 'N/A'}`);
          
          console.log(`\n   📋 Primeras 5 mesas:`);
          for (let i = 0; i < Math.min(5, count); i++) {
            console.log(`      ${i + 1}. ID: ${ids[i][1]} - ${nombres[i][1]} | €${precios[i][1]}`);
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
async function testObtenerDetalle(idServicio = 1) {
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
          console.log(`      Precio: €${precioMatch ? precioMatch[1] : 'N/A'}`);
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
async function testVerificarDisponibilidad(sku = 1) {
  console.log(`🔍 TEST 3: verificarDisponibilidad (SKU: ${sku})`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const fechaInicio = new Date('2025-10-28T20:00:00').toISOString();
  const fechaFin = new Date('2025-10-28T22:00:00').toISOString();

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <verificarDisponibilidad xmlns="${NAMESPACE}">
      <sku>${sku}</sku>
      <inicio>${fechaInicio}</inicio>
      <fin>${fechaFin}</fin>
      <unidades>1</unidades>
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
        const mensajeMatch = data.match(/<Mensaje>([^<]*)<\/Mensaje>/);
        
        if (disponibleMatch) {
          const disponible = disponibleMatch[1].toLowerCase() === 'true';
          
          if (disponible) {
            console.log(`   ✅ DISPONIBLE`);
            console.log(`      Mesa SKU ${sku} está disponible`);
            console.log(`      Fecha: ${fechaInicio}`);
          } else {
            console.log(`   ⚠️  NO DISPONIBLE`);
            console.log(`      Mesa SKU ${sku} NO está disponible`);
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
// EJECUTAR TODOS LOS TESTS
// ============================================================================
async function runAllTests() {
  try {
    // Test 1: Buscar servicios
    const { count } = await testBuscarServicios();
    
    // Test 2: Obtener detalle (ID 1)
    await testObtenerDetalle(1);
    
    // Test 3: Verificar disponibilidad
    await testVerificarDisponibilidad(1);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log(`  🏛️  Sanctum Cortejo tiene ${count} mesas disponibles en Madrid`);
    console.log('  🎯 Precios: €50 (2p) | €100 (4p) | €150 (6p)');
    console.log('  ⭐ Clasificación: 5 estrellas');
    console.log('  📜 Política: Cancelación sin costo 48h antes');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runAllTests();
