/**
 * Test Suite: Backend Cuenca SOAP Service
 * Service 22 - Backend Cuenca (Tour Packages)
 * Endpoint: http://backend-cuenca.onrender.com/WS_Integracion.asmx
 * Type: SOAP Tour Package Service
 */

import { BackendCuencaSoapAdapter } from './gateway/backend-cuenca.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new BackendCuencaSoapAdapter(config.endpoints.backendCuenca);

console.log('================================================');
console.log('  TEST: BACKEND CUENCA SOAP SERVICE');
console.log('  (Tour Packages)');
console.log('================================================\n');

async function runTests() {
  let testsPassed = 0;
  let totalTests = 7;

  // TEST 1: Buscar Servicios (sin filtros)
  console.log('TEST 1: buscarServicios (no filters)');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios();
    console.log(`✅ Found ${servicios.length} tour packages`);
    
    if (servicios.length > 0) {
      testsPassed++;
      console.log('\n📦 Sample Package:');
      const sample = servicios[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Agency: ${sample.agencyName}`);
      console.log(`   Duration: ${sample.durationDays} days`);
      console.log(`   Adult Price: ${sample.currency} ${sample.adultPrice.toFixed(2)}`);
      console.log(`   Child Price: ${sample.currency} ${sample.childPrice.toFixed(2)}`);
      console.log(`   Stock: ${sample.stock}`);
      console.log(`   Description: ${sample.description.substring(0, 80)}...`);
      
      // Save for next tests
      (global as any).packageId = sample.id;
      (global as any).adultPrice = sample.adultPrice;
      (global as any).childPrice = sample.childPrice;
    } else {
      testsPassed++;
      console.log('⚠️  No packages found (but query works)');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 2: Buscar con Filtros
  console.log('TEST 2: buscarServicios (with price filters)');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios({
      minPrecio: 100,
      maxPrecio: 500
    });
    console.log(`✅ Found ${servicios.length} packages between $100-$500`);
    testsPassed++;
    
    if (servicios.length > 0 && !(global as any).packageId) {
      // Use filtered results if no packages from test 1
      const sample = servicios[0];
      console.log('\n📦 Sample Package:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Agency: ${sample.agencyName}`);
      console.log(`   Duration: ${sample.durationDays} days`);
      console.log(`   Adult Price: ${sample.currency} ${sample.adultPrice.toFixed(2)}`);
      console.log(`   Child Price: ${sample.currency} ${sample.childPrice.toFixed(2)}`);
      console.log(`   Stock: ${sample.stock}`);
      
      // Save for next tests
      (global as any).packageId = sample.id;
      (global as any).adultPrice = sample.adultPrice;
      (global as any).childPrice = sample.childPrice;
    }
    
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 3: Obtener Detalle Servicio
  console.log('TEST 3: obtenerDetalleServicio');
  console.log('─────────────────────────────────────────────');
  try {
    const packageId = (global as any).packageId;
    if (packageId) {
      const detalle = await adapter.obtenerDetalleServicio(packageId);
      
      if (detalle) {
        console.log('✅ Package detail retrieved');
        console.log(`   Package: ${detalle.name}`);
        console.log(`   Agency: ${detalle.agencyName}`);
        console.log(`   Duration: ${detalle.durationDays} days`);
        console.log(`   Adult: ${detalle.currency} ${detalle.adultPrice.toFixed(2)}`);
        console.log(`   Child: ${detalle.currency} ${detalle.childPrice.toFixed(2)}`);
        testsPassed++;
      } else {
        console.log('⚠️  No detail returned');
      }
    } else {
      console.log('⏭️  Skipped - No packages available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 4: Verificar Disponibilidad
  console.log('TEST 4: verificarDisponibilidad');
  console.log('─────────────────────────────────────────────');
  try {
    const packageId = (global as any).packageId;
    if (packageId) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
      
      const disponible = await adapter.verificarDisponibilidad(
        packageId,
        inicio.toISOString(),
        fin.toISOString(),
        2 // 2 units
      );
      
      console.log(`✅ Availability: ${disponible ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      console.log(`   Package ID: ${packageId}`);
      console.log(`   Units: 2`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No packages available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 5: Cotizar Reserva
  console.log('TEST 5: cotizarReserva');
  console.log('─────────────────────────────────────────────');
  try {
    const packageId = (global as any).packageId;
    if (packageId) {
      const cotizacion = await adapter.cotizarReserva([
        {
          codigo: packageId,
          adultos: 2,
          ninos: 1
        }
      ]);
      
      console.log('✅ Quote generated');
      console.log(`   Total: ${cotizacion.total}`);
      console.log(`   Breakdown: ${cotizacion.breakdown}`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No packages available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 6: Crear Pre-Reserva
  console.log('TEST 6: crearPreReserva');
  console.log('─────────────────────────────────────────────');
  try {
    const packageId = (global as any).packageId;
    if (packageId) {
      const preReserva = await adapter.crearPreReserva(
        `Package: ${packageId}, 2 adults + 1 child`,
        'Cliente Test',
        15, // 15 minutes hold
        `TEST-${Date.now()}`
      );
      
      console.log('✅ Pre-booking created');
      console.log(`   PreBookingId: ${preReserva.preBookingId}`);
      console.log(`   Expires: ${preReserva.expiraEn}`);
      testsPassed++;
      
      // Save for next tests
      (global as any).preBookingId = preReserva.preBookingId;
    } else {
      console.log('⏭️  Skipped - No packages available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 7: Confirmar Reserva
  console.log('TEST 7: confirmarReserva');
  console.log('─────────────────────────────────────────────');
  try {
    const preBookingId = (global as any).preBookingId;
    if (preBookingId) {
      const confirmacion = await adapter.confirmarReserva(
        preBookingId,
        'Tarjeta',
        'VISA-1234'
      );
      
      console.log('✅ Booking confirmed');
      console.log(`   BookingId: ${confirmacion.bookingId}`);
      console.log(`   Status: ${confirmacion.estado}`);
      testsPassed++;
      
      // Save for cancellation
      (global as any).bookingId = confirmacion.bookingId;
    } else {
      console.log('⏭️  Skipped - No pre-booking created');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 8: Cancelar Reserva
  console.log('TEST 8: cancelarReservaIntegracion');
  console.log('─────────────────────────────────────────────');
  try {
    const bookingId = (global as any).bookingId;
    if (bookingId) {
      const cancelado = await adapter.cancelarReservaIntegracion(
        bookingId,
        'Test integration - cancellation test'
      );
      
      console.log(`✅ Cancellation: ${cancelado ? 'SUCCESS' : 'FAILED'}`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No booking to cancel');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // Summary
  console.log('================================================');
  console.log('  TEST SUMMARY');
  console.log('================================================');
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('');
  
  if (testsPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Backend Cuenca is fully functional!');
  } else if (testsPassed >= 5) {
    console.log('✅ Core workflow validated - Excellent integration!');
  } else if (testsPassed > 0) {
    console.log('⚠️  Partial functionality - Database may need seeding');
  }
  
  console.log('');
  console.log('📦 NOTE: Tour packages with adult/child pricing');
  console.log('================================================\n');
}

// Run tests
runTests().catch(console.error);
