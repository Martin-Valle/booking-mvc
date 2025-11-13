/**
 * Test End-to-End para Renta Autos Madrid
 * Simula el flujo completo: Frontend -> Backend -> ESB -> SOAP Service
 */

console.log('='.repeat(60));
console.log('  TEST E2E: RENTA AUTOS MADRID');
console.log('='.repeat(60));
console.log();

async function testE2E() {
  try {
    // Test 1: Backend Endpoint
    console.log('📋 TEST 1: Backend API Endpoint');
    console.log('URL: http://localhost:3001/api/cars/rentaautosmadrid/search');
    
    const response = await fetch('http://localhost:3001/api/cars/rentaautosmadrid/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Sin filtros - debería devolver todos los autos
      })
    });

    if (!response.ok) {
      console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.error('Respuesta:', error);
      return;
    }

    const data = await response.json();
    console.log(`✅ Respuesta recibida: ${data.length} vehículos`);
    
    if (data.length > 0) {
      console.log();
      console.log('📋 Primer vehículo:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  No se recibieron vehículos');
    }

    // Test 2: Con filtros
    console.log();
    console.log('📋 TEST 2: Con filtros (ECONOMY, MT)');
    
    const response2 = await fetch('http://localhost:3001/api/cars/rentaautosmadrid/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoria: 'ECONOMY',
        gearbox: 'MT'
      })
    });

    const data2 = await response2.json();
    console.log(`✅ Vehículos filtrados: ${data2.length}`);

    if (data2.length > 0) {
      data2.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.nombre} - ${v.precio} ${v.moneda} (${v.metadata?.categoria}/${v.metadata?.gearbox})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Check if server is running first
fetch('http://localhost:3001/health')
  .then(() => {
    console.log('✅ Servidor API corriendo en http://localhost:3001');
    console.log();
    return testE2E();
  })
  .catch(() => {
    console.error('❌ El servidor API no está corriendo en http://localhost:3001');
    console.error('   Ejecuta: npm run api');
    process.exit(1);
  });
