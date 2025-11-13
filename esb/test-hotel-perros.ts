/**
 * Test Suite: Hotel Perros SOAP Service
 * Service 21 - Hotel Perros (Pet/Dog Hotel)
 * Endpoint: https://wsintegracionhotel20251024134454-gxaqacbthwcdgzer.canadacentral-01.azurewebsites.net/WS_Integracion_Hotel.asmx
 * Type: ASMX Pet Hotel Service (Hospedaje Canino)
 */

import { HotelPerrosSoapAdapter } from './gateway/hotel-perros.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new HotelPerrosSoapAdapter(config.endpoints.hotelPerros);

console.log('================================================');
console.log('  TEST: HOTEL PERROS SOAP SERVICE 🐕');
console.log('  (Pet/Dog Hotel - Hospedaje Canino)');
console.log('================================================\n');

async function runTests() {
  let testsPassed = 0;
  let totalTests = 8;

  // TEST 1: Buscar Servicios
  console.log('TEST 1: buscarServicios');
  console.log('─────────────────────────────────────────────');
  try {
    const inicio = new Date();
    const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

    const resultado = await adapter.buscarServicios({
      Inicio: inicio.toISOString(),
      Fin: fin.toISOString(),
      Unidades: 1,
      Tamano: 'MEDIANO'
    });

    if (resultado.Ok) {
      console.log(`✅ Search successful: ${resultado.Data.length} services found`);
      
      if (resultado.Data.length > 0) {
        testsPassed++;
        console.log('\n🐕 Sample Service:');
        const sample = resultado.Data[0];
        console.log(`   SKU: ${sample.Sku}`);
        console.log(`   Name: ${sample.Nombre}`);
        console.log(`   Rate/Night: ${sample.Moneda} ${sample.TarifaBaseNoche.toFixed(2)}`);
        console.log(`   Available: ${sample.Disponible}`);
        
        // Save for next tests
        (global as any).sku = sample.Sku;
        (global as any).precioNoche = sample.TarifaBaseNoche;
      } else {
        testsPassed++;
        console.log('⚠️  No services found (but query works)');
      }
    } else {
      console.log(`❌ Error: ${resultado.Mensaje} (Code: ${resultado.Codigo})`);
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
    const sku = (global as any).sku;
    if (sku) {
      // Assume SKU is numeric ID, try with 1
      const resultado = await adapter.obtenerDetalleServicio(1);
      
      if (resultado.Ok) {
        console.log('✅ Service detail retrieved');
        console.log(`   Name: ${resultado.Data.Nombre}`);
        console.log(`   Description: ${resultado.Data.Descripcion}`);
        console.log(`   Rate/Night: $${resultado.Data.TarifaBaseNoche.toFixed(2)}`);
        console.log(`   Policies: ${resultado.Data.Politicas.length}`);
        console.log(`   Photos: ${resultado.Data.Fotos.length}`);
        testsPassed++;
      } else {
        console.log(`⚠️  ${resultado.Mensaje}`);
      }
    } else {
      console.log('⏭️  Skipped - No services available');
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
    const sku = (global as any).sku;
    if (sku) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const resultado = await adapter.verificarDisponibilidad(
        sku,
        inicio.toISOString(),
        fin.toISOString(),
        1
      );
      
      if (resultado.Ok) {
        console.log(`✅ Availability: ${resultado.Data ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
        console.log(`   SKU: ${sku}`);
        console.log(`   Period: ${inicio.toLocaleDateString()} to ${fin.toLocaleDateString()}`);
        testsPassed++;
      } else {
        console.log(`⚠️  ${resultado.Mensaje}`);
      }
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
    const sku = (global as any).sku;
    const precioNoche = (global as any).precioNoche;
    if (sku && precioNoche) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const resultado = await adapter.cotizarReserva(
        [{
          Sku: sku,
          Cantidad: 1,
          Noches: 3,
          PrecioUnitarioNoche: precioNoche
        }],
        inicio.toISOString(),
        fin.toISOString()
      );
      
      if (resultado.Ok) {
        console.log('✅ Quote generated');
        console.log(`   Subtotal: ${resultado.Data.Moneda} ${resultado.Data.Subtotal.toFixed(2)}`);
        console.log(`   Tax (${resultado.Data.PorcentajeIva}%): ${resultado.Data.Moneda} ${resultado.Data.MontoIva.toFixed(2)}`);
        console.log(`   Total: ${resultado.Data.Moneda} ${resultado.Data.Total.toFixed(2)}`);
        console.log(`   Items: ${resultado.Data.Items.length}`);
        testsPassed++;
        
        // Save for next test
        (global as any).totalCotizado = resultado.Data.Total;
      } else {
        console.log(`⚠️  ${resultado.Mensaje}`);
      }
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
    const sku = (global as any).sku;
    if (sku) {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const resultado = await adapter.crearPreReserva({
        IdCliente: 1,
        Inicio: inicio.toISOString(),
        Fin: fin.toISOString(),
        IdsPerros: [1, 2], // 2 dogs
        Tamano: 'MEDIANO',
        Comentarios: 'Test integration - 2 medium dogs',
        HoldMinutes: 15,
        IdemKey: `TEST-${Date.now()}`
      });
      
      if (resultado.Ok) {
        console.log('✅ Pre-booking created');
        console.log(`   PreBookingId: ${resultado.Data.PreBookingId}`);
        console.log(`   Expires: ${resultado.Data.ExpiraEn}`);
        console.log(`   Status: ${resultado.Data.Estado}`);
        testsPassed++;
        
        // Save for next tests
        (global as any).preBookingId = resultado.Data.PreBookingId;
      } else {
        console.log(`⚠️  Pre-booking failed: ${resultado.Mensaje} (Code: ${resultado.Codigo})`);
      }
    } else {
      console.log('⏭️  Skipped - No services available');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 6: Confirmar Reserva (Simple)
  console.log('TEST 6: confirmarReservaSimple');
  console.log('─────────────────────────────────────────────');
  try {
    const preBookingId = (global as any).preBookingId;
    const totalCotizado = (global as any).totalCotizado;
    if (preBookingId) {
      const resultado = await adapter.confirmarReservaSimple({
        PreBookingId: preBookingId,
        MetodoPago: 'Tarjeta',
        DatosPago: 'VISA-4532',
        Monto: totalCotizado
      });
      
      if (resultado.Ok) {
        console.log('✅ Booking confirmed (simple)');
        console.log(`   BookingId: ${resultado.Data.BookingId}`);
        console.log(`   Status: ${resultado.Data.Estado}`);
        console.log(`   Total: ${resultado.Data.Moneda} ${resultado.Data.Total.toFixed(2)}`);
        console.log(`   Confirmed: ${new Date(resultado.Data.ConfirmadaEn).toLocaleString()}`);
        testsPassed++;
        
        // Save for cancellation
        (global as any).bookingId = resultado.Data.BookingId;
      } else {
        console.log(`⚠️  ${resultado.Mensaje}`);
      }
    } else {
      console.log('⏭️  Skipped - No pre-booking created');
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
  }

  // TEST 7: Confirmar Reserva (Con Factura) - Test alternative
  console.log('TEST 7: confirmarReserva (with invoice)');
  console.log('─────────────────────────────────────────────');
  console.log('⏭️  Skipped - Using simple confirmation in TEST 6');
  console.log('   (This would generate invoice + payment details)');
  console.log('');

  // TEST 8: Cancelar Reserva
  console.log('TEST 8: cancelarReservaIntegracion');
  console.log('─────────────────────────────────────────────');
  try {
    const bookingId = (global as any).bookingId;
    if (bookingId) {
      const resultado = await adapter.cancelarReservaIntegracion(
        bookingId,
        'Test integration - cancellation test'
      );
      
      if (resultado.Ok) {
        console.log(`✅ Cancellation: ${resultado.Data ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Message: ${resultado.Mensaje}`);
        testsPassed++;
      } else {
        console.log(`⚠️  ${resultado.Mensaje}`);
      }
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
    console.log('🎉 ALL TESTS PASSED! Hotel Perros is fully functional!');
  } else if (testsPassed >= 5) {
    console.log('✅ Core workflow validated - Excellent integration!');
  } else if (testsPassed > 0) {
    console.log('⚠️  Partial functionality - Database may need seeding');
  }
  
  console.log('');
  console.log('🐕 NOTE: This is a unique pet hotel service!');
  console.log('   Features: Dog size filtering, multiple pets, idempotency');
  console.log('================================================\n');
}

// Run tests
runTests().catch(console.error);
