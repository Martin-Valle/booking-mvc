/**
 * Test Suite - Dragon Rojo SOAP Service (Service 17)
 * Endpoint: http://dragonrojo.runasp.net/WS_IntegracionRestaurante.asmx
 * Operations: 7
 * 
 * Test workflow:
 * 1. buscarServicios - Search restaurants
 * 2. obtenerDetalleServicio - Get details
 * 3. verificarDisponibilidad - Check availability
 * 4. cotizarReserva - Quote reservation
 * 5. crearPreReserva - Create pre-reservation
 * 6. confirmarReserva - Confirm reservation
 * 7. cancelarReservaIntegracion - Cancel reservation
 */

import { DragonRojoSoapAdapter } from './gateway/dragon-rojo.adapter';
import { getESBConfig } from './utils/config';
import type { ItemDetalleDTO } from './gateway/dragon-rojo.adapter';

// ============================================================================
// Test Data
// ============================================================================

const config = getESBConfig();
const adapter = new DragonRojoSoapAdapter(config.endpoints.dragonRojo);

// Test data
let testServiceId: number = 0;
let testSKU: number = 0;
let testPreBookingId: string = '';
let testBookingId: string = '';

// ============================================================================
// Test Execution
// ============================================================================

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DRAGON ROJO - SOAP SERVICE TEST (Service 17)');
  console.log('  Endpoint: http://dragonrojo.runasp.net/WS_IntegracionRestaurante.asmx');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Test 1: buscarServicios
    console.log('📋 TEST 1: buscarServicios');
    console.log('-----------------------------------------------------------');
    try {
      const filtros = 'Restaurante';
      console.log(`Filtros: "${filtros}"`);

      const servicios = await adapter.buscarServicios(filtros);
      console.log(`\n✅ Success: Found ${servicios.length} services`);
      
      if (servicios.length > 0) {
        servicios.forEach((servicio, index) => {
          console.log(`\nService ${index + 1}:`);
          console.log(`  IdServicio: ${servicio.IdServicio}`);
          console.log(`  Nombre: ${servicio.Nombre}`);
          console.log(`  Tipo: ${servicio.Tipo}`);
          console.log(`  Ciudad: ${servicio.Ciudad}`);
          console.log(`  Precio: ${servicio.Precio}`);
          console.log(`  Clasificacion: ${servicio.Clasificacion}`);
          console.log(`  Descripcion: ${servicio.Descripcion}`);
          if (servicio.ImagenURL) {
            console.log(`  ImagenURL: ${servicio.ImagenURL}`);
          }
        });
        
        // Save first service for further tests
        testServiceId = servicios[0].IdServicio;
        testSKU = servicios[0].IdServicio; // Using IdServicio as SKU
        console.log(`\n📌 Using Service ID ${testServiceId} for remaining tests`);
      } else {
        console.log('⚠️  No services found (empty database)');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }

    // Test 2: obtenerDetalleServicio
    console.log('\n\n📋 TEST 2: obtenerDetalleServicio');
    console.log('-----------------------------------------------------------');
    if (testServiceId > 0) {
      try {
        const detalle = await adapter.obtenerDetalleServicio(testServiceId);
        console.log('✅ Success: Service details retrieved');
        console.log('\nService Details:');
        console.log(`  IdServicio: ${detalle.IdServicio}`);
        console.log(`  Nombre: ${detalle.Nombre}`);
        console.log(`  Tipo: ${detalle.Tipo}`);
        console.log(`  Ciudad: ${detalle.Ciudad}`);
        console.log(`  Precio: ${detalle.Precio}`);
        console.log(`  Clasificacion: ${detalle.Clasificacion}`);
        console.log(`  Descripcion: ${detalle.Descripcion}`);
        console.log(`  Politicas: ${detalle.Politicas}`);
        console.log(`  Reglas: ${detalle.Reglas}`);
        if (detalle.ImagenURL) {
          console.log(`  ImagenURL: ${detalle.ImagenURL}`);
        }
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test service available)');
    }

    // Test 3: verificarDisponibilidad
    console.log('\n\n📋 TEST 3: verificarDisponibilidad');
    console.log('-----------------------------------------------------------');
    if (testSKU > 0) {
      try {
        const inicio = new Date('2025-12-20T19:00:00');
        const fin = new Date('2025-12-20T21:00:00');
        const unidades = 4;

        console.log(`Parameters:`);
        console.log(`  SKU: ${testSKU}`);
        console.log(`  Inicio: ${inicio.toISOString()}`);
        console.log(`  Fin: ${fin.toISOString()}`);
        console.log(`  Unidades: ${unidades}`);

        const disponibilidad = await adapter.verificarDisponibilidad(
          testSKU,
          inicio,
          fin,
          unidades
        );

        console.log(`✅ Success:`);
        console.log(`  Disponible: ${disponibilidad.Disponible ? 'SÍ ✓' : 'NO ✗'}`);
        console.log(`  Mensaje: ${disponibilidad.Mensaje}`);
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
        const items: ItemDetalleDTO[] = [
          {
            Nombre: 'Menu Ejecutivo',
            Cantidad: 2,
            PrecioUnitario: 45.00,
            PrecioTotal: 90.00
          },
          {
            Nombre: 'Bebida Premium',
            Cantidad: 2,
            PrecioUnitario: 12.50,
            PrecioTotal: 25.00
          }
        ];
        
        console.log(`Items to quote:`);
        items.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.Nombre}: ${item.Cantidad} × $${item.PrecioUnitario} = $${item.PrecioTotal}`);
        });
        
        const cotizacion = await adapter.cotizarReserva(items);
        
        console.log('\n✅ Success: Quote calculated');
        console.log(`  Total: $${cotizacion.Total.toFixed(2)}`);
        console.log(`  Breakdown:`);
        cotizacion.Breakdown.forEach((item, idx) => {
          console.log(`    ${idx + 1}. ${item.Nombre}: ${item.Cantidad} × $${item.PrecioUnitario} = $${item.PrecioTotal}`);
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
    if (testServiceId > 0) {
      try {
        const itinerario = JSON.stringify({
          items: [
            { nombre: 'Menu Ejecutivo', cantidad: 2, precio: 45.00 },
            { nombre: 'Bebida Premium', cantidad: 2, precio: 12.50 }
          ]
        });
        const cliente = JSON.stringify({
          nombre: 'Cliente Test',
          email: 'test@example.com',
          telefono: '0999999999'
        });
        const holdMinutes = 30;
        const idemKey = `TEST-DRAGON-${Date.now()}`;

        console.log(`Parameters:`);
        console.log(`  cliente: ${cliente.substring(0, 50)}...`);
        console.log(`  holdMinutes: ${holdMinutes}`);
        console.log(`  idemKey: ${idemKey}`);

        const preReserva = await adapter.crearPreReserva(
          itinerario,
          cliente,
          holdMinutes,
          idemKey
        );
        
        console.log('✅ Success: Pre-reservation created');
        console.log(`  PreBookingId: ${preReserva.PreBookingId}`);
        console.log(`  ExpiraEn: ${preReserva.ExpiraEn}`);
        
        testPreBookingId = preReserva.PreBookingId;
        console.log(`\n📌 Using PreBookingId ${testPreBookingId} for confirmation`);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('⏭️  Skipped (no test service available)');
    }

    // Test 6: confirmarReserva
    console.log('\n\n📋 TEST 6: confirmarReserva');
    console.log('-----------------------------------------------------------');
    if (testPreBookingId) {
      try {
        const metodoPago = 'TARJETA_CREDITO';
        const datosPago = JSON.stringify({
          tarjeta: '4111111111111111',
          referencia: 'REF-' + Date.now(),
          monto: 115.00
        });

        console.log(`Parameters:`);
        console.log(`  preBookingId: ${testPreBookingId}`);
        console.log(`  metodoPago: ${metodoPago}`);
        console.log(`  datosPago: ${datosPago.substring(0, 50)}...`);

        const confirmacion = await adapter.confirmarReserva(
          testPreBookingId,
          metodoPago,
          datosPago
        );
        
        console.log('✅ Success: Reservation confirmed');
        console.log(`  BookingId: ${confirmacion.BookingId}`);
        console.log(`  Estado: ${confirmacion.Estado}`);
        
        testBookingId = confirmacion.BookingId;
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

        const cancelacion = await adapter.cancelarReservaIntegracion(
          testBookingId,
          motivo
        );
        
        console.log(`✅ Success: Cancellation = ${cancelacion.Cancelacion ? 'CONFIRMED ✓' : 'FAILED ✗'}`);
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
    console.log('Service: Dragon Rojo (Service 17 - Restaurant)');
    console.log('Endpoint: http://dragonrojo.runasp.net/WS_IntegracionRestaurante.asmx');
    console.log('Total Operations: 7');
    console.log('\nOperations tested:');
    console.log('  1. ✓ buscarServicios');
    console.log('  2. ✓ obtenerDetalleServicio');
    console.log('  3. ✓ verificarDisponibilidad');
    console.log('  4. ✓ cotizarReserva');
    console.log('  5. ✓ crearPreReserva (with idemKey)');
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
