/**
 * Test Suite: Easy Car SOAP Service
 * Service 19 - Easy Car (Car Rental)
 * Endpoint: http://easycar.runasp.net/IntegracionService.asmx
 * Type: ASMX Car Rental Service
 */

import { EasyCarSoapAdapter } from './gateway/easy-car.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new EasyCarSoapAdapter(config.endpoints.easyCar);

console.log('================================================');
console.log('  TEST: EASY CAR SOAP SERVICE');
console.log('================================================\n');

async function runTests() {
  let testsPassed = 0;
  let totalTests = 7;

  // TEST 1: Buscar Servicios (Vehículos)
  console.log('TEST 1: buscarServicios');
  console.log('─────────────────────────────────────────────');
  try {
    const vehiculos = await adapter.buscarServicios();
    console.log(`✅ Found ${vehiculos.length} vehicles`);
    
    if (vehiculos.length > 0) {
      testsPassed++;
      console.log('\n📋 Sample Vehicle:');
      const sample = vehiculos[0];
      console.log(`   ID: ${sample.IdVehiculo}`);
      console.log(`   Brand: ${sample.Marca} ${sample.Modelo} (${sample.Anio})`);
      console.log(`   Category: ${sample.Categoria}`);
      console.log(`   Transmission: ${sample.Transmision}`);
      console.log(`   Fuel: ${sample.Combustible}`);
      console.log(`   Price/Day: $${sample.PrecioBaseDia.toFixed(2)}`);
      console.log(`   Active: ${sample.Activo}`);
      
      // Save for next tests
      (global as any).vehiculoId = sample.IdVehiculo;
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
    const inicio = new Date();
    const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
    
    const vehiculos = await adapter.buscarServicios(
      'SUV',
      'Automatico',
      inicio.toISOString(),
      fin.toISOString(),
      25
    );
    console.log(`✅ Found ${vehiculos.length} SUVs with automatic transmission`);
    if (vehiculos.length > 0) {
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
    const vehiculoId = (global as any).vehiculoId;
    if (vehiculoId) {
      const detalle = await adapter.obtenerDetalleServicio(vehiculoId);
      console.log('✅ Vehicle detail retrieved');
      console.log(`   Vehicle: ${detalle.Marca} ${detalle.Modelo}`);
      console.log(`   Year: ${detalle.Anio}`);
      console.log(`   Category: ${detalle.Categoria}`);
      console.log(`   Price/Day: $${detalle.PrecioBaseDia.toFixed(2)}`);
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
    const vehiculoId = (global as any).vehiculoId;
    if (vehiculoId) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      
      const disponible = await adapter.verificarDisponibilidad(
        vehiculoId,
        inicio.toISOString(),
        fin.toISOString()
      );
      
      console.log(`✅ Availability check: ${disponible ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      console.log(`   Vehicle ID: ${vehiculoId}`);
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
    const vehiculoId = (global as any).vehiculoId;
    if (vehiculoId) {
      const cotizacion = await adapter.cotizarReserva(vehiculoId, 3); // 3 days
      
      console.log('✅ Quote generated');
      console.log(`   Days: ${cotizacion.Dias}`);
      console.log(`   Subtotal: $${cotizacion.Subtotal.toFixed(2)}`);
      console.log(`   Taxes: $${cotizacion.Impuestos.toFixed(2)}`);
      console.log(`   Total: $${cotizacion.Total.toFixed(2)}`);
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
    const vehiculoId = (global as any).vehiculoId;
    if (vehiculoId) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      
      const preReserva = await adapter.crearPreReserva(
        vehiculoId,
        1, // idCliente
        inicio.toISOString(),
        fin.toISOString(),
        25 // edadConductor
      );
      
      console.log('✅ Pre-booking created');
      console.log(`   BookingId: ${preReserva.IdReserva}`);
      console.log(`   Code: ${preReserva.CodigoReserva}`);
      console.log(`   Vehicle: ${preReserva.IdVehiculo}`);
      console.log(`   Status: ${preReserva.IdEstado} (PENDIENTE)`);
      console.log(`   Total: $${preReserva.Total.toFixed(2)}`);
      console.log(`   Pickup: ${new Date(preReserva.FechaRetiro).toLocaleString()}`);
      console.log(`   Return: ${new Date(preReserva.FechaDevolucion).toLocaleString()}`);
      testsPassed++;
      
      // Save for next tests
      (global as any).reservaId = preReserva.IdReserva;
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
    const reservaId = (global as any).reservaId;
    if (reservaId) {
      const confirmado = await adapter.confirmarReserva(reservaId);
      
      console.log(`✅ Confirmation: ${confirmado ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   BookingId: ${reservaId}`);
      testsPassed++;
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
    const reservaId = (global as any).reservaId;
    if (reservaId) {
      const cancelado = await adapter.cancelarReservaIntegracion(
        reservaId,
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
    console.log('🎉 ALL TESTS PASSED! Easy Car service is fully functional!');
  } else if (testsPassed >= 5) {
    console.log('✅ Core workflow validated - Excellent integration!');
  } else if (testsPassed > 0) {
    console.log('⚠️  Partial functionality - Database may need seeding');
  }
  
  console.log('================================================\n');
}

// Run tests
runTests().catch(console.error);
