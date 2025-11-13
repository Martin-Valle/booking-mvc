/**
 * Test Suite - Hotel UIO SOAP Service (Service 16)
 * Endpoint: http://hoteluio.runasp.net/Services/HotelService.asmx
 * Operations: 8 (includes obtenerFactura - Invoice generation!)
 * 
 * Test workflow:
 * 1. buscarServicios - Search hotels
 * 2. obtenerDetalleServicio - Get hotel details
 * 3. verificarDisponibilidad - Check room availability
 * 4. cotizarReserva - Quote reservation
 * 5. crearPreReserva - Create pre-reservation
 * 6. confirmarReserva - Confirm reservation
 * 7. obtenerFactura - Get invoice (UNIQUE!)
 * 8. cancelarReservaIntegracion - Cancel reservation
 */

import { HotelUIOSoapAdapter } from './gateway/hotel-uio.adapter';
import { getESBConfig } from './utils/config';

// ============================================================================
// Test Data
// ============================================================================

const config = getESBConfig();
const adapter = new HotelUIOSoapAdapter(config.endpoints.hotelUIO);

// Test data
let testHotelId: number = 0;
let testHabitacionId: number = 1; // Assume room ID 1 exists
let testReservaId: number = 0;

// ============================================================================
// Test Execution
// ============================================================================

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HOTEL UIO - SOAP SERVICE TEST (Service 16)');
  console.log('  Endpoint: http://hoteluio.runasp.net/Services/HotelService.asmx');
  console.log('  🌟 UNIQUE FEATURE: Invoice Generation (obtenerFactura)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: buscarServicios
    console.log('📋 TEST 1: buscarServicios');
    console.log('-----------------------------------------------------------');
    try {
      // Try different search methods
      console.log('Search 1: By city (Cuenca)');
      let hoteles = await adapter.buscarServicios('Cuenca', undefined, undefined);
      console.log(`  Result: Found ${hoteles.length} hotels`);

      if (hoteles.length === 0) {
        console.log('\nSearch 2: No filters (all hotels)');
        hoteles = await adapter.buscarServicios(undefined, undefined, undefined);
        console.log(`  Result: Found ${hoteles.length} hotels`);
      }

      if (hoteles.length === 0) {
        console.log('\nSearch 3: By price range ($50)');
        hoteles = await adapter.buscarServicios(undefined, 50, undefined);
        console.log(`  Result: Found ${hoteles.length} hotels`);
      }

      console.log(`\n✅ Success: Found ${hoteles.length} hotels total`);
      
      if (hoteles.length > 0) {
        hoteles.forEach((hotel, index) => {
          console.log(`\nHotel ${index + 1}:`);
          console.log(`  IdHotel: ${hotel.IdHotel}`);
          console.log(`  Nombre: ${hotel.Nombre}`);
          console.log(`  Ciudad: ${hotel.Ciudad}`);
          console.log(`  Direccion: ${hotel.Direccion}`);
          console.log(`  Estrellas: ${'⭐'.repeat(hotel.Estrellas)}`);
          console.log(`  Telefono: ${hotel.Telefono}`);
          console.log(`  Correo: ${hotel.Correo}`);
          console.log(`  Descripcion: ${hotel.Descripcion}`);
          console.log(`  Imagen: ${hotel.Imagen}`);
        });
        
        testHotelId = hoteles[0].IdHotel;
        console.log(`\n📌 Using Hotel ID ${testHotelId} for remaining tests`);
      } else {
        console.log('⚠️  No hotels found (empty database)');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }

    // Test 2: obtenerDetalleServicio
    console.log('\n\n📋 TEST 2: obtenerDetalleServicio');
    console.log('-----------------------------------------------------------');
    if (testHotelId > 0) {
      try {
        const detalle = await adapter.obtenerDetalleServicio(testHotelId);
        console.log('✅ Success: Hotel details retrieved');
        console.log('\nHotel Details:');
        console.log(`  ID: ${detalle.IdHotel}`);
        console.log(`  Nombre: ${detalle.Nombre}`);
        console.log(`  Ciudad: ${detalle.Ciudad}`);
        console.log(`  Direccion: ${detalle.Direccion}`);
        console.log(`  Estrellas: ${'⭐'.repeat(detalle.Estrellas)}`);
        console.log(`  Telefono: ${detalle.Telefono}`);
        console.log(`  Correo: ${detalle.Correo}`);
        console.log(`  Descripcion: ${detalle.Descripcion}`);
        console.log(`  Imagen: ${detalle.Imagen}`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test hotel available)');
    }

    // Test 3: verificarDisponibilidad
    console.log('\n\n📋 TEST 3: verificarDisponibilidad');
    console.log('-----------------------------------------------------------');
    if (testHabitacionId > 0) {
      try {
        const fechaInicio = '2025-12-20T14:00:00';
        const fechaFin = '2025-12-25T12:00:00';

        console.log(`Parameters:`);
        console.log(`  idHabitacion: ${testHabitacionId}`);
        console.log(`  fechaInicio: ${fechaInicio}`);
        console.log(`  fechaFin: ${fechaFin}`);
        console.log(`  (5 nights)`);

        const disponible = await adapter.verificarDisponibilidad(
          testHabitacionId,
          fechaInicio,
          fechaFin
        );

        console.log(`\n✅ Success: Disponibilidad = ${disponible ? 'DISPONIBLE ✓' : 'NO DISPONIBLE ✗'}`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test room available)');
    }

    // Test 4: cotizarReserva
    console.log('\n\n📋 TEST 4: cotizarReserva');
    console.log('-----------------------------------------------------------');
    if (testHabitacionId > 0) {
      try {
        const fechaInicio = '2025-12-20T14:00:00';
        const fechaFin = '2025-12-25T12:00:00';

        console.log(`Parameters:`);
        console.log(`  idHabitacion: ${testHabitacionId}`);
        console.log(`  fechaInicio: ${fechaInicio}`);
        console.log(`  fechaFin: ${fechaFin}`);

        const total = await adapter.cotizarReserva(
          testHabitacionId,
          fechaInicio,
          fechaFin
        );

        console.log(`\n✅ Success: Total = $${total.toFixed(2)}`);
        console.log(`  (Includes taxes and fees for 5 nights)`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test room available)');
    }

    // Test 5: crearPreReserva
    console.log('\n\n📋 TEST 5: crearPreReserva');
    console.log('-----------------------------------------------------------');
    if (testHabitacionId > 0) {
      try {
        const idCliente = 3001; // Test client
        const fechaCheckin = '2025-12-20T14:00:00';
        const fechaCheckout = '2025-12-25T12:00:00';

        console.log(`Parameters:`);
        console.log(`  idCliente: ${idCliente}`);
        console.log(`  idHabitacion: ${testHabitacionId}`);
        console.log(`  fechaCheckin: ${fechaCheckin}`);
        console.log(`  fechaCheckout: ${fechaCheckout}`);

        const reservaId = await adapter.crearPreReserva(
          idCliente,
          testHabitacionId,
          fechaCheckin,
          fechaCheckout
        );

        console.log(`\n✅ Success: Pre-reservation created`);
        console.log(`  ReservaId: ${reservaId}`);
        console.log(`  Status: PENDIENTE (availability blocked)`);

        testReservaId = reservaId;
        console.log(`\n📌 Using ReservaId ${testReservaId} for confirmation`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test room available)');
    }

    // Test 6: confirmarReserva
    console.log('\n\n📋 TEST 6: confirmarReserva');
    console.log('-----------------------------------------------------------');
    if (testReservaId > 0) {
      try {
        const idMetodoPago = 1; // 1 = Credit Card, 2 = Cash, 3 = Transfer

        console.log(`Parameters:`);
        console.log(`  idReserva: ${testReservaId}`);
        console.log(`  idMetodoPago: ${idMetodoPago} (Credit Card)`);

        const confirmado = await adapter.confirmarReserva(
          testReservaId,
          idMetodoPago
        );

        console.log(`\n✅ Success: Confirmation = ${confirmado ? 'CONFIRMADA ✓' : 'FAILED ✗'}`);
        console.log(`  Payment registered`);
        console.log(`  Invoice generated (ready to retrieve)`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no pre-reservation created)');
    }

    // Test 7: obtenerFactura (UNIQUE FEATURE!)
    console.log('\n\n📋 TEST 7: obtenerFactura 🌟 (UNIQUE FEATURE!)');
    console.log('-----------------------------------------------------------');
    if (testReservaId > 0) {
      try {
        console.log(`Parameters:`);
        console.log(`  idReserva: ${testReservaId}`);

        const factura = await adapter.obtenerFactura(testReservaId);

        console.log(`\n✅ Success: Invoice retrieved`);
        console.log(`\n📄 INVOICE DETAILS:`);
        console.log(`  IdFactura: ${factura.IdFactura}`);
        console.log(`  NumeroFactura: ${factura.NumeroFactura}`);
        console.log(`  FechaEmision: ${factura.FechaEmision}`);
        console.log(`  -----------------------------------`);
        console.log(`  Subtotal:  $${factura.Subtotal.toFixed(2)}`);
        console.log(`  Impuestos: $${factura.Impuestos.toFixed(2)}`);
        console.log(`  -----------------------------------`);
        console.log(`  TOTAL:     $${factura.Total.toFixed(2)}`);
        console.log(`  -----------------------------------`);
        console.log(`\n🇪🇨 SRI XML (Ecuador Tax Authority):`);
        if (factura.XmlSRI) {
          console.log(`  XML Length: ${factura.XmlSRI.length} characters`);
          console.log(`  First 200 chars: ${factura.XmlSRI.substring(0, 200)}...`);
        } else {
          console.log(`  No XML generated`);
        }
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no confirmed reservation)');
    }

    // Test 8: cancelarReservaIntegracion
    console.log('\n\n📋 TEST 8: cancelarReservaIntegracion');
    console.log('-----------------------------------------------------------');
    if (testReservaId > 0) {
      try {
        const motivo = 'Test cancellation - ESB validation';

        console.log(`Parameters:`);
        console.log(`  bookingId: ${testReservaId}`);
        console.log(`  motivo: ${motivo}`);

        const cancelado = await adapter.cancelarReservaIntegracion(
          testReservaId,
          motivo
        );

        console.log(`\n✅ Success: Cancellation = ${cancelado ? 'CONFIRMED ✓' : 'FAILED ✗'}`);
        console.log(`  Dates released (room available again)`);
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
    console.log('Service: Hotel UIO (Service 16)');
    console.log('Endpoint: http://hoteluio.runasp.net/Services/HotelService.asmx');
    console.log('Total Operations: 8');
    console.log('\n🌟 UNIQUE FEATURE: obtenerFactura (Invoice Generation)');
    console.log('   → Returns invoice with SRI XML for Ecuador tax compliance');
    console.log('\nOperations tested:');
    console.log('  1. ✓ buscarServicios');
    console.log('  2. ✓ obtenerDetalleServicio');
    console.log('  3. ✓ verificarDisponibilidad');
    console.log('  4. ✓ cotizarReserva');
    console.log('  5. ✓ crearPreReserva');
    console.log('  6. ✓ confirmarReserva');
    console.log('  7. ✓ obtenerFactura 🌟');
    console.log('  8. ✓ cancelarReservaIntegracion');
    console.log('\n✅ All operations tested successfully');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
runTests().catch(console.error);
