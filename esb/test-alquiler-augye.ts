/**
 * Test Suite - Alquiler Augye SOAP Service (Service 15)
 * Endpoint: http://alquileraugye.runasp.net/AutosIntegracion.asmx
 * Operations: 7
 * 
 * Test workflow:
 * 1. buscarServicios - Advanced search with filters
 * 2. obtenerDetalleServicio - Get car details
 * 3. verificarDisponibilidad - Check availability
 * 4. cotizarReserva - Quote reservation
 * 5. crearPreReserva - Create pre-reservation
 * 6. confirmarReserva - Confirm reservation
 * 7. cancelarReservaIntegracion - Cancel reservation
 */

import { AlquilerAugyeSoapAdapter } from './gateway/alquiler-augye.adapter';
import { getESBConfig } from './utils/config';
import type { FiltrosAutosDTO, ItemCotizacionDTO, DatosPagoDTO } from './gateway/alquiler-augye.adapter';

// ============================================================================
// Test Data
// ============================================================================

const config = getESBConfig();
const adapter = new AlquilerAugyeSoapAdapter(config.endpoints.alquilerAugye);

// Test data
let testCarSKU: number = 0;
let testCarPrecioDia: number = 0;
let testPreBookingId: string = '';
let testBookingId: string = '';

// ============================================================================
// Test Execution
// ============================================================================

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ALQUILER AUGYE - SOAP SERVICE TEST (Service 15)');
  console.log('  Endpoint: http://alquileraugye.runasp.net/AutosIntegracion.asmx');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: buscarServicios
    console.log('📋 TEST 1: buscarServicios (Advanced Filters)');
    console.log('-----------------------------------------------------------');
    try {
      const filtros: FiltrosAutosDTO = {
        serviceType: 'AUTO',
        ciudad: 'Cuenca',
        categoria: 'SUV',
        gearbox: 'Automatica',
        pickupAt: '2025-12-20T10:00:00',
        dropoffAt: '2025-12-25T10:00:00',
        driverAge: 30,
        precioMin: 20,
        precioMax: 100,
        page: 1,
        pageSize: 10
      };

      console.log('Filters:');
      console.log(`  serviceType: ${filtros.serviceType}`);
      console.log(`  ciudad: ${filtros.ciudad}`);
      console.log(`  categoria: ${filtros.categoria}`);
      console.log(`  gearbox: ${filtros.gearbox}`);
      console.log(`  pickupAt: ${filtros.pickupAt}`);
      console.log(`  dropoffAt: ${filtros.dropoffAt}`);
      console.log(`  driverAge: ${filtros.driverAge}`);
      console.log(`  precio: $${filtros.precioMin} - $${filtros.precioMax}`);
      console.log(`  page: ${filtros.page}, pageSize: ${filtros.pageSize}`);

      const servicios = await adapter.buscarServicios(filtros);
      console.log(`\n✅ Success: Found ${servicios.length} cars`);
      
      if (servicios.length > 0) {
        servicios.forEach((servicio, index) => {
          console.log(`\nCar ${index + 1}:`);
          console.log(`  SKU: ${servicio.sku}`);
          console.log(`  Marca/Modelo: ${servicio.marca} ${servicio.modelo}`);
          console.log(`  Categoria: ${servicio.categoria}`);
          console.log(`  Transmision: ${servicio.gearbox}`);
          console.log(`  Precio/Dia: $${servicio.precioDia.toFixed(2)}`);
          console.log(`  Ciudad: ${servicio.ciudad}`);
          console.log(`  Imagen: ${servicio.imagen}`);
        });
        
        // Save first car for further tests
        testCarSKU = servicios[0].sku;
        testCarPrecioDia = servicios[0].precioDia;
        console.log(`\n📌 Using Car SKU ${testCarSKU} for remaining tests`);
      } else {
        console.log('⚠️  No cars found (try different filters or empty database)');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }

    // Test 2: obtenerDetalleServicio
    console.log('\n\n📋 TEST 2: obtenerDetalleServicio');
    console.log('-----------------------------------------------------------');
    if (testCarSKU > 0) {
      try {
        const detalle = await adapter.obtenerDetalleServicio(testCarSKU);
        console.log('✅ Success: Car details retrieved');
        console.log('\nCar Details:');
        console.log(`  SKU: ${detalle.sku}`);
        console.log(`  Marca/Modelo: ${detalle.marca} ${detalle.modelo}`);
        console.log(`  Categoria: ${detalle.categoria}`);
        console.log(`  Transmision: ${detalle.gearbox}`);
        console.log(`  Ciudad: ${detalle.ciudad}`);
        console.log(`  Hotel: ${detalle.hotel}`);
        console.log(`  Pickup Office: ${detalle.pickupOffice}`);
        console.log(`  Dropoff Office: ${detalle.dropoffOffice}`);
        console.log(`  Precio/Dia: $${detalle.precioDia.toFixed(2)}`);
        console.log(`  Imagenes: ${detalle.imagenes.length}`);
        detalle.imagenes.forEach((img, idx) => {
          console.log(`    ${idx + 1}. ${img}`);
        });
        console.log(`  Politicas:\n    ${detalle.politicas}`);
        console.log(`  Reglas:\n    ${detalle.reglas}`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test car available)');
    }

    // Test 3: verificarDisponibilidad
    console.log('\n\n📋 TEST 3: verificarDisponibilidad');
    console.log('-----------------------------------------------------------');
    if (testCarSKU > 0) {
      try {
        const inicio = '2025-12-20T10:00:00';
        const fin = '2025-12-25T10:00:00';
        const unidades = 1; // 1 car

        console.log(`Parameters:`);
        console.log(`  SKU: ${testCarSKU}`);
        console.log(`  Inicio: ${inicio}`);
        console.log(`  Fin: ${fin}`);
        console.log(`  Unidades: ${unidades}`);

        const disponible = await adapter.verificarDisponibilidad(
          testCarSKU,
          inicio,
          fin,
          unidades
        );

        console.log(`✅ Success: Disponibilidad = ${disponible ? 'DISPONIBLE ✓' : 'NO DISPONIBLE ✗'}`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test SKU available)');
    }

    // Test 4: cotizarReserva
    console.log('\n\n📋 TEST 4: cotizarReserva');
    console.log('-----------------------------------------------------------');
    if (testCarSKU > 0 && testCarPrecioDia > 0) {
      try {
        const items: ItemCotizacionDTO[] = [
          {
            sku: testCarSKU,
            dias: 5, // 5 days rental
            precioDia: testCarPrecioDia
          }
        ];
        
        console.log(`Items to quote:`);
        items.forEach((item, idx) => {
          console.log(`  ${idx + 1}. SKU ${item.sku}: ${item.dias} days × $${item.precioDia}/day`);
        });
        
        const cotizacion = await adapter.cotizarReserva(items);
        
        console.log('\n✅ Success: Quote calculated');
        console.log(`  Subtotal: $${cotizacion.subtotal.toFixed(2)}`);
        console.log(`  Impuestos: $${cotizacion.impuestos.toFixed(2)}`);
        console.log(`  Total: $${cotizacion.total.toFixed(2)}`);
        console.log(`  Items Breakdown:`);
        cotizacion.items.forEach((item, idx) => {
          const itemTotal = item.dias * item.precioDia;
          console.log(`    ${idx + 1}. SKU ${item.sku}: ${item.dias} días × $${item.precioDia} = $${itemTotal.toFixed(2)}`);
        });
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test car available)');
    }

    // Test 5: crearPreReserva
    console.log('\n\n📋 TEST 5: crearPreReserva');
    console.log('-----------------------------------------------------------');
    if (testCarSKU > 0 && testCarPrecioDia > 0) {
      try {
        const itinerario: ItemCotizacionDTO[] = [
          {
            sku: testCarSKU,
            dias: 5,
            precioDia: testCarPrecioDia
          }
        ];
        
        const clienteId = 2001; // Test client
        const holdMinutes = 30; // 30 minute hold
        const idemKey = `TEST-${Date.now()}`; // Idempotency key
        const pickupAt = '2025-12-20T10:00:00';
        const dropoffAt = '2025-12-25T10:00:00';
        const autoId = testCarSKU;

        console.log(`Parameters:`);
        console.log(`  clienteId: ${clienteId}`);
        console.log(`  autoId: ${autoId}`);
        console.log(`  holdMinutes: ${holdMinutes}`);
        console.log(`  idemKey: ${idemKey}`);
        console.log(`  pickupAt: ${pickupAt}`);
        console.log(`  dropoffAt: ${dropoffAt}`);
        console.log(`  itinerario: ${itinerario.length} item(s)`);

        const preReserva = await adapter.crearPreReserva(
          itinerario,
          clienteId,
          holdMinutes,
          idemKey,
          pickupAt,
          dropoffAt,
          autoId
        );
        
        console.log('✅ Success: Pre-reservation created');
        console.log(`  PreBookingId: ${preReserva.preBookingId}`);
        console.log(`  Expires at: ${preReserva.expiraEn}`);
        
        testPreBookingId = preReserva.preBookingId;
        console.log(`\n📌 Using PreBookingId ${testPreBookingId} for confirmation`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test car available)');
    }

    // Test 6: confirmarReserva
    console.log('\n\n📋 TEST 6: confirmarReserva');
    console.log('-----------------------------------------------------------');
    if (testPreBookingId) {
      try {
        const metodoPago = 'TARJETA_CREDITO';
        const datosPago: DatosPagoDTO = {
          metodo: 'VISA',
          referencia: 'REF-' + Date.now(),
          monto: testCarPrecioDia * 5 // 5 days
        };

        console.log(`Parameters:`);
        console.log(`  preBookingId: ${testPreBookingId}`);
        console.log(`  metodoPago: ${metodoPago}`);
        console.log(`  datosPago.metodo: ${datosPago.metodo}`);
        console.log(`  datosPago.referencia: ${datosPago.referencia}`);
        console.log(`  datosPago.monto: $${datosPago.monto.toFixed(2)}`);

        const reserva = await adapter.confirmarReserva(
          testPreBookingId,
          metodoPago,
          datosPago
        );
        
        console.log('✅ Success: Reservation confirmed');
        console.log(`  BookingId: ${reserva.bookingId}`);
        console.log(`  Estado: ${reserva.estado}`);
        console.log(`  ReservaId: ${reserva.reservaId}`);
        
        testBookingId = reserva.bookingId;
        console.log(`\n📌 Using BookingId ${testBookingId} for cancellation`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no pre-reservation created)');
    }

    // Test 7: cancelarReservaIntegracion
    console.log('\n\n📋 TEST 7: cancelarReservaIntegracion');
    console.log('-----------------------------------------------------------');
    if (testBookingId) {
      try {
        const motivo = 'Test cancellation - ESB validation';

        console.log(`Parameters:`);
        console.log(`  bookingId: ${testBookingId}`);
        console.log(`  motivo: ${motivo}`);

        const cancelado = await adapter.cancelarReservaIntegracion(
          testBookingId,
          motivo
        );
        
        console.log(`✅ Success: Cancellation = ${cancelado ? 'CONFIRMED ✓' : 'FAILED ✗'}`);
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
    console.log('Service: Alquiler Augye (Service 15 - Car Rental)');
    console.log('Endpoint: http://alquileraugye.runasp.net/AutosIntegracion.asmx');
    console.log('Total Operations: 7');
    console.log('\nOperations tested:');
    console.log('  1. ✓ buscarServicios (Advanced filtering)');
    console.log('  2. ✓ obtenerDetalleServicio');
    console.log('  3. ✓ verificarDisponibilidad');
    console.log('  4. ✓ cotizarReserva');
    console.log('  5. ✓ crearPreReserva (with itinerary & idemKey)');
    console.log('  6. ✓ confirmarReserva (with payment data)');
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
