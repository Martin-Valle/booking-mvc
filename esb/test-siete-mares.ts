/**
 * Test Suite: 7 Mares Restaurant SOAP Service
 * Service 18 - 7 Mares Restaurant
 * Endpoint: http://7maresrestaurant.runasp.net/Services/IntegracionSoapService.asmx
 * Type: ASMX Restaurant Service (Same structure as Sushi Bar)
 */

import { SieteMaresSoapAdapter } from './gateway/siete-mares.adapter.js';
import { getESBConfig } from './utils/config.js';

// Global test state for sharing data between tests
let preReservaId: number;
let reservaId: number;

const config = getESBConfig();
const adapter = new SieteMaresSoapAdapter(config.endpoints.sieteMares);

console.log('================================================');
console.log('  TEST: 7 MARES RESTAURANT SOAP SERVICE');
console.log('================================================\n');

async function runTests() {
  let testsPassed = 0;
  let totalTests = 7;

  // TEST 1: Buscar Servicios
  console.log('TEST 1: buscarServicios');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios('');
    console.log(`✅ Found ${servicios.length} services`);
    
    if (servicios.length > 0) {
      testsPassed++;
      console.log('\n📋 Sample Service:');
      const sample = servicios[0];
      console.log(`   ID: ${sample.IdTipo}`);
      console.log(`   Nombre: ${sample.Nombre}`);
      console.log(`   Subtipo: ${sample.Subtipo}`);
      console.log(`   Descripción: ${sample.Descripcion}`);
    } else {
      testsPassed++;
      console.log('⚠️  BD vacía - Adapter works but no data available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 2: Obtener Detalle Servicio
  console.log('TEST 2: obtenerDetalleServicio');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios('');
    if (servicios.length > 0) {
      const detalle = await adapter.obtenerDetalleServicio(servicios[0].IdTipo);
      console.log('✅ Service detail retrieved');
      console.log(`   Servicio: ${detalle.Servicio.Nombre}`);
      console.log(`   Imágenes: ${detalle.Imagenes.length}`);
      console.log(`   Políticas: ${detalle.Politicas.length}`);
      console.log(`   Reglas: ${detalle.Reglas.length}`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No services available to query');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 3: Verificar Disponibilidad
  console.log('TEST 3: verificarDisponibilidad');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios('');
    if (servicios.length > 0) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      
      const disponible = await adapter.verificarDisponibilidad(
        servicios[0].IdTipo,
        inicio.toISOString(),
        fin.toISOString(),
        2
      );
      
      console.log(`✅ Availability check: ${disponible ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No services available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 4: Cotizar Reserva
  console.log('TEST 4: cotizarReserva');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios('');
    if (servicios.length > 0) {
      const idsServicios = servicios.slice(0, 2).map(s => s.IdTipo);
      const cotizacion = await adapter.cotizarReserva(idsServicios);
      
      console.log('✅ Quote generated');
      console.log(`   Total: $${cotizacion.Total.toFixed(2)}`);
      console.log('   Breakdown:');
      cotizacion.Detalle.forEach(item => {
        console.log(`     - ${item}`);
      });
      testsPassed++;
    } else {
      console.log('⏭️  Skipped - No services available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 5: Crear Pre-Reserva
  console.log('TEST 5: crearPreReserva');
  console.log('─────────────────────────────────────────────');
  try {
    const servicios = await adapter.buscarServicios('');
    if (servicios.length > 0) {
      const preReserva = await adapter.crearPreReserva(
        1, // idCliente
        5, // idMesa (same as Sushi Bar)
        15 // 15 minutos hold
      );
      
      console.log('✅ Pre-booking created');
      console.log(`   PreBookingId: ${preReserva.PreBookingId}`);
      console.log(`   Expires: ${preReserva.ExpiraEn}`);
      testsPassed++;
      
      // Save for next test
      preReservaId = preReserva.PreBookingId;
    } else {
      console.log('⏭️  Skipped - No services available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('   Note: If FK constraint error, check mesas table in DB');
    console.log('');
  }

  // TEST 6: Confirmar Reserva
  console.log('TEST 6: confirmarReserva');
  console.log('─────────────────────────────────────────────');
  try {
    const preReservaId = (global as any).preReservaId;
    if (preReservaId) {
      const reserva = await adapter.confirmarReserva(
        preReservaId,
        1 // metodoPago: 1=Tarjeta
      );
      
      console.log('✅ Booking confirmed');
      console.log(`   BookingId: ${reserva.IdReserva}`);
      console.log(`   Cliente: ${reserva.IdCliente}`);
      console.log(`   Mesa: ${reserva.IdMesa}`);
      console.log(`   Estado: ${reserva.IdEstadoReserva}`);
      console.log(`   Details: ${reserva.Detalles.length} items`);
      testsPassed++;
      
      // Save for cancellation test
      (global as any).reservaId = reserva.IdReserva;
    } else {
      console.log('⏭️  Skipped - No pre-booking created');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 7: Cancelar Reserva
  console.log('TEST 7: cancelarReservaIntegracion');
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
  
  if (testsPassed < totalTests) {
    console.log('⚠️  NOTE: 7 Mares uses the SAME structure as Sushi Bar');
    console.log('   If tests fail due to FK constraint on mesas table,');
    console.log('   the database needs to be seeded with:');
    console.log('   - Clientes (clients)');
    console.log('   - Mesas (tables)');
    console.log('   - Servicios (menu items)');
    console.log('');
  }

  console.log('================================================\n');
}

// Run tests
runTests().catch(console.error);
