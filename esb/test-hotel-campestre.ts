/**
 * Hotel Campestre - Test Suite
 * Servicio 13: Hotel
 * Endpoint: https://hotelcampestre-erdgb0cvedd7asb9.canadacentral-01.azurewebsites.net/WS_Integracion.asmx
 */

import { HotelCampestreSoapAdapter } from './gateway/hotel-campestre.adapter';
import { getESBConfig } from './utils/config';

// ============================================================================
// TEST RUNNER
// ============================================================================

async function testHotelCampestre() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HOTEL CAMPESTRE - TEST DE TODAS LAS OPERACIONES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const config = getESBConfig();
  const adapter = new HotelCampestreSoapAdapter(config.endpoints.hotelCampestre);

  let testServicio: any = null;
  let preReservaId: string = '';
  let bookingId: number = 0;
  let montoTotal: number = 0;

  // ============================================================================
  // 1. BUSCAR SERVICIOS
  // ============================================================================
  console.log('🔍 1. BUSCAR SERVICIOS');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const tipo = 'HABITACION';
    const precioMin = 50;
    const precioMax = 300;

    console.log('📤 Request:');
    console.log(`   Tipo: ${tipo}`);
    console.log(`   Precio mínimo: $${precioMin}`);
    console.log(`   Precio máximo: $${precioMax}`);

    const servicios = await adapter.buscarServicios(tipo, precioMin, precioMax);
    
    console.log(`\n✅ Servicios encontrados: ${servicios.length}\n`);
    
    if (servicios.length > 0) {
      testServicio = servicios[0];
      console.log('📋 Primer servicio:');
      console.log(`   ID: ${testServicio.Id}`);
      console.log(`   Tipo: ${testServicio.Tipo}`);
      console.log(`   Nombre: ${testServicio.Nombre}`);
      console.log(`   Ciudad: ${testServicio.Ciudad}`);
      console.log(`   Precio: $${testServicio.Precio}`);
      console.log(`   Descripción: ${testServicio.Descripcion}`);
      console.log(`   Disponible: ${testServicio.Disponible ? '✅ Sí' : '❌ No'}\n`);
    }
  } catch (error: any) {
    console.error('❌ Error en buscarServicios:', error.message);
    console.log('⚠️  No se puede continuar sin servicios. Abortando tests.\n');
    return;
  }

  // ============================================================================
  // 2. VERIFICAR DISPONIBILIDAD
  // ============================================================================
  console.log('\n🔍 2. VERIFICAR DISPONIBILIDAD');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const servicioId = testServicio.Id;
    const inicio = '2025-12-15';
    const fin = '2025-12-20';

    console.log('📤 Request:');
    console.log(`   Servicio ID: ${servicioId}`);
    console.log(`   Fecha inicio: ${inicio}`);
    console.log(`   Fecha fin: ${fin}`);
    
    const disponible = await adapter.verificarDisponibilidad(servicioId, inicio, fin);
    
    console.log(`\n${disponible ? '✅' : '❌'} Disponible: ${disponible ? 'Sí' : 'No'}\n`);
  } catch (error: any) {
    console.error('❌ Error en verificarDisponibilidad:', error.message);
  }

  // ============================================================================
  // 3. COTIZAR RESERVA
  // ============================================================================
  console.log('\n💰 3. COTIZAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const precioNoche = testServicio.Precio;
    const noches = 5;
    const impuesto = 0.12; // 12%

    console.log('📤 Request:');
    console.log(`   Precio por noche: $${precioNoche.toFixed(2)}`);
    console.log(`   Noches: ${noches}`);
    console.log(`   Impuesto: ${(impuesto * 100).toFixed(0)}%`);
    
    const total = await adapter.cotizarReserva(precioNoche, noches, impuesto);
    montoTotal = total;
    
    const subtotal = precioNoche * noches;
    const impuestoMonto = subtotal * impuesto;
    
    console.log('\n✅ Cotización:');
    console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`   Impuesto (${(impuesto * 100).toFixed(0)}%): $${impuestoMonto.toFixed(2)}`);
    console.log(`   TOTAL: $${total.toFixed(2)}\n`);
  } catch (error: any) {
    console.error('❌ Error en cotizarReserva:', error.message);
  }

  // ============================================================================
  // 4. CREAR PRE-RESERVA
  // ============================================================================
  console.log('\n📝 4. CREAR PRE-RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const cliente = JSON.stringify({
      nombre: 'Juan Carlos Pérez',
      email: 'test@example.com',
      telefono: '+593987654321',
      documento: '0102030405'
    });
    const servicioId = testServicio.Id;
    const fechaInicio = '2025-12-15';
    const fechaFin = '2025-12-20';

    console.log('📤 Request:');
    console.log(`   Cliente: ${cliente}`);
    console.log(`   Servicio ID: ${servicioId}`);
    console.log(`   Fecha inicio: ${fechaInicio}`);
    console.log(`   Fecha fin: ${fechaFin}`);
    
    const resultado = await adapter.crearPreReserva(cliente, servicioId, fechaInicio, fechaFin);
    preReservaId = resultado;
    
    console.log('\n✅ Pre-reserva creada:');
    console.log(`   Pre-Reserva ID: ${resultado}\n`);
  } catch (error: any) {
    console.error('❌ Error en crearPreReserva:', error.message);
  }

  // ============================================================================
  // 5. CONFIRMAR RESERVA
  // ============================================================================
  console.log('\n✅ 5. CONFIRMAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (!preReservaId) {
    console.log('⚠️  No hay pre-reserva para confirmar. Saltando...\n');
  } else {
    try {
      // Intentar parsear el ID como número
      const preReservaIdNum = parseInt(preReservaId);
      const metodoPago = 'TARJETA_CREDITO';
      const monto = montoTotal || 500;

      console.log('📤 Request:');
      console.log(`   Pre-Reserva ID: ${preReservaIdNum}`);
      console.log(`   Método de pago: ${metodoPago}`);
      console.log(`   Monto: $${monto.toFixed(2)}`);
      
      const resultado = await adapter.confirmarReserva(preReservaIdNum, metodoPago, monto);
      
      // Intentar extraer el booking ID del resultado
      try {
        bookingId = parseInt(resultado);
      } catch {
        bookingId = 1; // Fallback
      }
      
      console.log('\n✅ Reserva confirmada:');
      console.log(`   Resultado: ${resultado}\n`);
    } catch (error: any) {
      console.error('❌ Error en confirmarReserva:', error.message);
    }
  }

  // ============================================================================
  // 6. CANCELAR RESERVA
  // ============================================================================
  console.log('\n🚫 6. CANCELAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (!bookingId && !preReservaId) {
    console.log('⚠️  No hay reserva para cancelar. Saltando...\n');
  } else {
    try {
      const idCancelar = bookingId || parseInt(preReservaId || '1');
      const motivo = 'Prueba de integración - Cancelación automática';

      console.log('📤 Request:');
      console.log(`   Booking ID: ${idCancelar}`);
      console.log(`   Motivo: ${motivo}`);
      
      const resultado = await adapter.cancelarReservaIntegracion(idCancelar, motivo);
      
      console.log(`\n✅ Resultado de cancelación: ${resultado}\n`);
    } catch (error: any) {
      console.error('❌ Error en cancelarReservaIntegracion:', error.message);
    }
  }

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESUMEN DEL TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Servicio: Hotel Campestre');
  console.log('  Endpoint: https://hotelcampestre-erdgb0cvedd7asb9.canadacentral-01.azurewebsites.net/WS_Integracion.asmx');
  console.log('  Operaciones: 6 (buscar, verificar, cotizar, pre-reserva, confirmar, cancelar)');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// ============================================================================
// EJECUTAR TEST
// ============================================================================

testHotelCampestre().catch(error => {
  console.error('\n💥 Error fatal en el test:', error);
  process.exit(1);
});
