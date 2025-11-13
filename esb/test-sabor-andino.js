/**
 * TEST SIMPLIFICADO - Sabor Andino SOAP
 * Ejecutar con: node esb/test-sabor-andino.js
 */

import https from 'https';

// Configuración del servicio
const ENDPOINT = 'saborandino.runasp.net';
const PATH = '/Ws_IntegracionRestaurante.asmx';
const NAMESPACE = 'http://SaborAndino.ec/Integracion';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🌮 TEST SABOR ANDINO - SOAP SERVICE');
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
          // Extraer primera mesa como ejemplo
          const idMatch = data.match(/<IdServicio>(\d+)<\/IdServicio>/);
          const nombreMatch = data.match(/<Nombre>([^<]+)<\/Nombre>/);
          const precioMatch = data.match(/<Precio>([^<]+)<\/Precio>/);
          const ciudadMatch = data.match(/<Ciudad>([^<]+)<\/Ciudad>/);
          
          console.log(`\n   📋 Ejemplo (primera mesa):`);
          console.log(`      ID: ${idMatch ? idMatch[1] : 'N/A'}`);
          console.log(`      Nombre: ${nombreMatch ? nombreMatch[1] : 'N/A'}`);
          console.log(`      Ciudad: ${ciudadMatch ? ciudadMatch[1] : 'N/A'}`);
          console.log(`      Precio: $${precioMatch ? precioMatch[1] : 'N/A'}`);
        }
        
        console.log('\n');
        resolve(count);
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
        
        if (idMatch) {
          console.log(`   ✅ Servicio encontrado:\n`);
          console.log(`      ID: ${idMatch[1]}`);
          console.log(`      Nombre: ${nombreMatch ? nombreMatch[1] : 'N/A'}`);
          console.log(`      Tipo: ${tipoMatch ? tipoMatch[1] : 'N/A'}`);
          console.log(`      Ciudad: ${ciudadMatch ? ciudadMatch[1] : 'N/A'}`);
          console.log(`      Precio: $${precioMatch ? precioMatch[1] : 'N/A'}`);
          console.log(`      Clasificación: ${clasificacionMatch ? clasificacionMatch[1] : 'N/A'}`);
          console.log(`      Descripción: ${descripcionMatch ? descripcionMatch[1].substring(0, 60) : 'N/A'}...`);
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
// EJECUTAR TODOS LOS TESTS
// ============================================================================
async function runAllTests() {
  try {
    await testBuscarServicios();
    await testObtenerDetalle(2);
    await testVerificarDisponibilidad(101);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runAllTests();
