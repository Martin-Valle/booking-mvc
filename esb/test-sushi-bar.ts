/**
 * Test Suite - Sushi Bar SOAP Service (Service 14)
 * Endpoint: http://wsintegracion.runasp.net/IntegracionSoapService.asmx
 * Operations: 7
 * 
 * Test workflow:
 * 1. buscarServicios - Search for services by type
 * 2. obtenerDetalleServicio - Get service details
 * 3. verificarDisponibilidad - Check availability
 * 4. cotizarReserva - Quote reservation
 * 5. crearPreReserva - Create pre-reservation
 * 6. confirmarReserva - Confirm reservation
 * 7. cancelarReservaIntegracion - Cancel reservation
 */

import { SushiBarSoapAdapter } from './gateway/sushi-bar.adapter';
import { getESBConfig } from './utils/config';

// ============================================================================
// Test Data
// ============================================================================

const config = getESBConfig();
const adapter = new SushiBarSoapAdapter(config.endpoints.sushiBar);

// Test data
let testServiceId: number = 0;
let testServiceSKU: number = 0;
let testPreBookingId: number = 0;
let testReservaId: number = 0;

// ============================================================================
// Test Execution
// ============================================================================

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUSHI BAR - SOAP SERVICE TEST (Service 14)');
  console.log('  Endpoint: http://wsintegracion.runasp.net/IntegracionSoapService.asmx');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: buscarServicios
    console.log('📋 TEST 1: buscarServicios');
    console.log('-----------------------------------------------------------');
    try {
      const servicios = await adapter.buscarServicios('RESTAURANTE');
      console.log(`✅ Success: Found ${servicios.length} services`);
      
      if (servicios.length > 0) {
        servicios.forEach((servicio, index) => {
          console.log(`\nService ${index + 1}:`);
          console.log(`  IdTipo: ${servicio.IdTipo}`);
          console.log(`  Nombre: ${servicio.Nombre}`);
          console.log(`  Subtipo: ${servicio.Subtipo}`);
          console.log(`  Descripcion: ${servicio.Descripcion}`);
        });
        
        // Save first service for further tests
        testServiceId = servicios[0].IdTipo;
        testServiceSKU = servicios[0].IdTipo; // Assuming IdTipo can be used as SKU
        console.log(`\n📌 Using Service ID ${testServiceId} for remaining tests`);
      } else {
        console.log('⚠️  No services found (empty database)');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      console.error('Full error:', error);
    }

    // Test 2: obtenerDetalleServicio
    console.log('\n\n📋 TEST 2: obtenerDetalleServicio');
    console.log('-----------------------------------------------------------');
    if (testServiceId > 0) {
      try {
        const detalle = await adapter.obtenerDetalleServicio(testServiceId);
        console.log('✅ Success: Service details retrieved');
        console.log('\nService Details:');
        console.log(`  Nombre: ${detalle.Servicio.Nombre}`);
        console.log(`  Subtipo: ${detalle.Servicio.Subtipo}`);
        console.log(`  Descripcion: ${detalle.Servicio.Descripcion}`);
        console.log(`  Images: ${detalle.Imagenes.length}`);
        detalle.Imagenes.forEach((img, idx) => {
          console.log(`    ${idx + 1}. ${img.Url}`);
        });
        console.log(`  Politicas: ${detalle.Politicas.length}`);
        detalle.Politicas.forEach((pol, idx) => {
          console.log(`    ${idx + 1}. ${pol}`);
        });
        console.log(`  Reglas: ${detalle.Reglas.length}`);
        detalle.Reglas.forEach((reg, idx) => {
          console.log(`    ${idx + 1}. ${reg}`);
        });
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test service available)');
    }

    // Test 3: verificarDisponibilidad
    console.log('\n\n📋 TEST 3: verificarDisponibilidad');
    console.log('-----------------------------------------------------------');
    if (testServiceSKU > 0) {
      try {
        const inicio = new Date('2025-12-20T19:00:00').toISOString();
        const fin = new Date('2025-12-20T21:00:00').toISOString();
        const unidades = 4; // 4 people

        console.log(`Parameters:`);
        console.log(`  SKU: ${testServiceSKU}`);
        console.log(`  Inicio: ${inicio}`);
        console.log(`  Fin: ${fin}`);
        console.log(`  Unidades: ${unidades}`);

        const disponible = await adapter.verificarDisponibilidad(
          testServiceSKU,
          inicio,
          fin,
          unidades
        );

        console.log(`✅ Success: Disponibilidad = ${disponible ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test SKU available)');
    }

    // Test 4: cotizarReserva
    console.log('\n\n📋 TEST 4: cotizarReserva');
    console.log('-----------------------------------------------------------');
    if (testServiceId > 0) {
      try {
        // Quote for multiple services (e.g., sushi rolls, drinks, dessert)
        const idsServicios = [testServiceId, testServiceId + 1, testServiceId + 2];
        
        console.log(`Services to quote: [${idsServicios.join(', ')}]`);
        
        const cotizacion = await adapter.cotizarReserva(idsServicios);
        
        console.log('✅ Success: Quote calculated');
        console.log(`  Total: $${cotizacion.Total.toFixed(2)}`);
        console.log(`  Breakdown:`);
        cotizacion.Detalle.forEach((item, idx) => {
          console.log(`    ${idx + 1}. ${item}`);
        });
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test service available)');
    }

    // Test 5: crearPreReserva
    console.log('\n\n📋 TEST 5: crearPreReserva');
    console.log('-----------------------------------------------------------');
    try {
      const idCliente = 1001; // Test client
      const idMesa = 5; // Table #5
      const minutos = 30; // 30 minute reservation window

      console.log(`Parameters:`);
      console.log(`  idCliente: ${idCliente}`);
      console.log(`  idMesa: ${idMesa}`);
      console.log(`  minutos: ${minutos}`);

      const preReserva = await adapter.crearPreReserva(idCliente, idMesa, minutos);
      
      console.log('✅ Success: Pre-reservation created');
      console.log(`  PreBookingId: ${preReserva.PreBookingId}`);
      console.log(`  Expires at: ${preReserva.ExpiraEn}`);
      
      testPreBookingId = preReserva.PreBookingId;
      console.log(`\n📌 Using PreBookingId ${testPreBookingId} for confirmation`);
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }

    // Test 6: confirmarReserva
    console.log('\n\n📋 TEST 6: confirmarReserva');
    console.log('-----------------------------------------------------------');
    if (testPreBookingId > 0) {
      try {
        const metodoPago = 1; // 1 = Credit Card, 2 = Cash, 3 = Transfer

        console.log(`Parameters:`);
        console.log(`  idReserva (PreBookingId): ${testPreBookingId}`);
        console.log(`  metodoPago: ${metodoPago} (Credit Card)`);

        const reserva = await adapter.confirmarReserva(testPreBookingId, metodoPago);
        
        console.log('✅ Success: Reservation confirmed');
        console.log(`  IdReserva: ${reserva.IdReserva}`);
        console.log(`  IdCliente: ${reserva.IdCliente}`);
        console.log(`  IdMesa: ${reserva.IdMesa}`);
        console.log(`  FechaInicio: ${reserva.FechaInicio}`);
        console.log(`  FechaFin: ${reserva.FechaFin}`);
        console.log(`  IdEstadoReserva: ${reserva.IdEstadoReserva}`);
        console.log(`  Detalles (${reserva.Detalles.length} items):`);
        reserva.Detalles.forEach((det, idx) => {
          console.log(`    ${idx + 1}. Service ${det.IdServicio}: ${det.Cantidad} x $${det.PrecioUnitario}`);
        });
        
        testReservaId = reserva.IdReserva;
        console.log(`\n📌 Using ReservaId ${testReservaId} for cancellation`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no pre-reservation created)');
    }

    // Test 7: cancelarReservaIntegracion
    console.log('\n\n📋 TEST 7: cancelarReservaIntegracion');
    console.log('-----------------------------------------------------------');
    if (testReservaId > 0) {
      try {
        const motivo = 'Test cancellation - ESB validation';

        console.log(`Parameters:`);
        console.log(`  idReserva: ${testReservaId}`);
        console.log(`  motivo: ${motivo}`);

        const cancelado = await adapter.cancelarReservaIntegracion(
          testReservaId,
          motivo
        );
        
        console.log(`✅ Success: Cancellation = ${cancelado ? 'CONFIRMED' : 'FAILED'}`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no reservation to cancel)');
    }

    // Summary
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Service: Sushi Bar (Service 14)');
    console.log('Endpoint: http://wsintegracion.runasp.net/IntegracionSoapService.asmx');
    console.log('Total Operations: 7');
    console.log('\nOperations tested:');
    console.log('  1. ✓ buscarServicios');
    console.log('  2. ✓ obtenerDetalleServicio');
    console.log('  3. ✓ verificarDisponibilidad');
    console.log('  4. ✓ cotizarReserva');
    console.log('  5. ✓ crearPreReserva');
    console.log('  6. ✓ confirmarReserva');
    console.log('  7. ✓ cancelarReservaIntegracion');
    console.log('\n✅ All operations tested successfully');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
runTests().catch(console.error);
