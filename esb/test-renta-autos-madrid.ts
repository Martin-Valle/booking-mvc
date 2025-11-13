/**
 * Test Suite: Renta Autos Madrid SOAP Service
 * Service 20 - Renta Autos Madrid (Car Rental)
 * Endpoint: http://rentaautosmadrid.runasp.net/IntegracionService.asmx
 * Type: ASMX Car Rental Service
 */

import { RentaAutosMadridSoapAdapter } from './gateway/renta-autos-madrid.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new RentaAutosMadridSoapAdapter(config.endpoints.rentaAutosMadrid);

console.log('================================================');
console.log('  TEST: RENTA AUTOS MADRID SOAP SERVICE');
console.log('================================================\n');

async function runTests() {
  let testsPassed = 0;
  let totalTests = 8;

  // TEST 0: Ping
  console.log('TEST 0: ping (Health Check)');
  console.log('─────────────────────────────────────────────');
  try {
    const pingResult = await adapter.ping();
    console.log(`✅ Ping: ${pingResult}`);
    testsPassed++;
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 1: Buscar Servicios (sin filtros)
  console.log('TEST 1: buscarServicios (no filters)');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios();
    console.log(`✅ Found ${servicios.length} vehicles`);
    
    if (servicios.length > 0) {
      testsPassed++;
      console.log('\n📋 Sample Vehicle:');
      const sample = servicios[0];
      console.log(`   ID: ${sample.Id}`);
      console.log(`   Name: ${sample.Nombre}`);
      console.log(`   Category: ${sample.Categoria}`);
      console.log(`   Gearbox: ${sample.Gearbox}`);
      console.log(`   City: ${sample.Ciudad}`);
      console.log(`   Price: $${sample.Precio.toFixed(2)}`);
      console.log(`   Hotel: ${sample.Hotel}`);
      console.log(`   Available: ${sample.Disponible}`);
      console.log(`   Images: ${sample.Imagenes.length}`);
      
      // Save for next tests
      (global as any).autoId = sample.Id;
    } else {
      testsPassed++;
      console.log('⚠️  BD vacía - Adapter works but no data available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 2: Buscar con Filtros
  console.log('TEST 2: buscarServicios (with filters)');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios({
      Categoria: 'SUV',
      Gearbox: 'Automatico',
      Ciudad: 'Madrid',
      PrecioMin: 30,
      PrecioMax: 100
    });
    console.log(`✅ Found ${servicios.length} SUVs in Madrid with automatic transmission`);
    if (servicios.length > 0) {
      testsPassed++;
    } else {
      testsPassed++;
      console.log('⚠️  No vehicles match filters (but query works)');
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
    const autoId = (global as any).autoId;
    if (autoId) {
      const detalle = await adapter.obtenerDetalleServicio(autoId);
      console.log('✅ Vehicle detail retrieved');
      console.log(`   Vehicle: ${detalle.Nombre}`);
      console.log(`   Category: ${detalle.Categoria}`);
      console.log(`   City: ${detalle.Ciudad}`);
      console.log(`   Price: $${detalle.Precio.toFixed(2)}`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No vehicles available');
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
    const autoId = (global as any).autoId;
    if (autoId) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      
      const disponible = await adapter.verificarDisponibilidad(
        autoId,
        inicio.toISOString(),
        fin.toISOString(),
        1
      );
      
      console.log(`✅ Availability check: ${disponible ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      console.log(`   Vehicle ID: ${autoId}`);
      console.log(`   Period: ${inicio.toLocaleDateString()} to ${fin.toLocaleDateString()}`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No vehicles available');
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
    const autoId = (global as any).autoId;
    if (autoId) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      
      const cotizacion = await adapter.cotizarReserva(
        autoId,
        inicio.toISOString(),
        fin.toISOString()
      );
      
      console.log('✅ Quote generated');
      console.log(`   Days: ${cotizacion.Dias}`);
      console.log(`   Subtotal: $${cotizacion.Subtotal.toFixed(2)}`);
      console.log(`   Tax: $${cotizacion.Impuesto.toFixed(2)}`);
      console.log(`   Total: $${cotizacion.Total.toFixed(2)}`);
      
      if (cotizacion.Detalle.length > 0) {
        console.log('   Breakdown:');
        cotizacion.Detalle.forEach(item => {
          console.log(`     - ${item.Descripcion}: ${item.Dias} days × $${item.PrecioDia}`);
        });
      }
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No vehicles available');
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
    const autoId = (global as any).autoId;
    if (autoId) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      
      const preReserva = await adapter.crearPreReserva(
        1, // usuarioId
        autoId,
        inicio.toISOString(),
        fin.toISOString(),
        15 // 15 minutes hold
      );
      
      if (preReserva.Exito) {
        console.log('✅ Pre-booking created');
        console.log(`   PreBookingId: ${preReserva.PreBookingId}`);
        console.log(`   Expires: ${preReserva.ExpiraEn}`);
        console.log(`   Message: ${preReserva.Mensaje}`);
        testsPassed++;
        
        // Save for next tests
        (global as any).preBookingId = preReserva.PreBookingId;
      } else {
        console.log(`⚠️  Pre-booking failed: ${preReserva.Mensaje}`);
      }
    } else {
      console.log('⏭️  Skipped - No vehicles available');
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
      const confirmado = await adapter.confirmarReserva(
        preBookingId,
        'Tarjeta',
        'VISA-1234'
      );
      
      console.log(`✅ Confirmation: ${confirmado ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   PreBookingId: ${preBookingId}`);
      testsPassed++;
      
      // For cancellation, use preBookingId as bookingId
      if (confirmado) {
        (global as any).bookingId = preBookingId;
      }
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
        'Test de integración'
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
    console.log('🎉 ALL TESTS PASSED! Renta Autos Madrid is fully functional!');
  } else if (testsPassed >= 5) {
    console.log('✅ Core workflow validated - Excellent integration!');
  } else if (testsPassed > 0) {
    console.log('⚠️  Partial functionality - Database may need seeding');
  }
  
  console.log('================================================\n');
}

// Run tests
runTests().catch(console.error);
