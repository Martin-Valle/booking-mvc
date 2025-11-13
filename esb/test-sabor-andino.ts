/**
 * Sabor Andino - Test Suite
 * Servicio 12: Restaurante
 * Endpoint: https://saborandino.runasp.net/Ws_IntegracionRestaurante.asmx
 */

import { SaborAndinoSoapAdapter } from './gateway/sabor-andino.adapter';
import { getESBConfig } from './utils/config';
import type { ItemDetalle } from './gateway/sabor-andino.adapter';

// ============================================================================
// TEST RUNNER
// ============================================================================

async function testSaborAndino() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SABOR ANDINO - TEST DE TODAS LAS OPERACIONES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const config = getESBConfig();
  const adapter = new SaborAndinoSoapAdapter(config.endpoints.saborAndino);

  let testServicio: any = null;
  let preBookingId: string = '';
  let bookingId: string = '';

  // ============================================================================
  // 1. BUSCAR SERVICIOS
  // ============================================================================
  console.log('🔍 1. BUSCAR SERVICIOS');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const filtros = JSON.stringify({
      tipo: 'MENU',
      ciudad: 'Cuenca',
      precioMin: 10,
      precioMax: 100
    });

    console.log('📤 Request:');
    console.log(`   Filtros: ${filtros}`);

    const servicios = await adapter.buscarServicios(filtros);
    
    console.log(`\n✅ Servicios encontrados: ${servicios.length}\n`);
    
    if (servicios.length > 0) {
      testServicio = servicios[0];
      console.log('📋 Primer servicio:');
      console.log(`   ID: ${testServicio.IdServicio}`);
      console.log(`   Nombre: ${testServicio.Nombre}`);
      console.log(`   Tipo: ${testServicio.Tipo}`);
      console.log(`   Ciudad: ${testServicio.Ciudad}`);
      console.log(`   Precio: ${testServicio.Precio}`);
      console.log(`   Clasificación: ${testServicio.Clasificacion} ⭐`);
      console.log(`   Descripción: ${testServicio.Descripcion}`);
      if (testServicio.ImagenURL) {
        console.log(`   Imagen: ${testServicio.ImagenURL}`);
      }
      console.log();
    }
  } catch (error: any) {
    console.error('❌ Error en buscarServicios:', error.message);
    console.log('⚠️  No se puede continuar sin servicios. Abortando tests.\n');
    return;
  }

  // ============================================================================
  // 2. OBTENER DETALLE DEL SERVICIO
  // ============================================================================
  console.log('\n🔍 2. OBTENER DETALLE DEL SERVICIO');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    console.log(`📤 Request: idServicio = ${testServicio.IdServicio}`);
    
    const detalle = await adapter.obtenerDetalleServicio(testServicio.IdServicio);
    
    console.log('\n✅ Detalle obtenido:');
    console.log(`   ID: ${detalle.IdServicio}`);
    console.log(`   Nombre: ${detalle.Nombre}`);
    console.log(`   Tipo: ${detalle.Tipo}`);
    console.log(`   Ciudad: ${detalle.Ciudad}`);
    console.log(`   Precio: ${detalle.Precio}`);
    console.log(`   Clasificación: ${detalle.Clasificacion} ⭐`);
    console.log(`   Descripción: ${detalle.Descripcion}`);
    if (detalle.Politicas) {
      console.log(`   Políticas: ${detalle.Politicas}`);
    }
    if (detalle.Reglas) {
      console.log(`   Reglas: ${detalle.Reglas}`);
    }
    console.log();
  } catch (error: any) {
    console.error('❌ Error en obtenerDetalleServicio:', error.message);
  }

  // ============================================================================
  // 3. VERIFICAR DISPONIBILIDAD
  // ============================================================================
  console.log('\n🔍 3. VERIFICAR DISPONIBILIDAD');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const sku = testServicio.IdServicio;
    const inicio = new Date('2025-12-15T19:00:00');
    const fin = new Date('2025-12-15T21:00:00');
    const unidades = 4; // 4 personas

    console.log('📤 Request:');
    console.log(`   SKU: ${sku}`);
    console.log(`   Fecha inicio: ${inicio.toISOString()}`);
    console.log(`   Fecha fin: ${fin.toISOString()}`);
    console.log(`   Unidades: ${unidades}`);
    
    const resultado = await adapter.verificarDisponibilidad(sku, inicio, fin, unidades);
    
    console.log(`\n${resultado.Disponible ? '✅' : '❌'} Disponible: ${resultado.Disponible ? 'Sí' : 'No'}\n`);
  } catch (error: any) {
    console.error('❌ Error en verificarDisponibilidad:', error.message);
  }

  // ============================================================================
  // 4. COTIZAR RESERVA
  // ============================================================================
  console.log('\n💰 4. COTIZAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const items: ItemDetalle[] = [
      {
        Nombre: 'Menú Degustación Andino',
        Cantidad: 2,
        PrecioUnitario: 45.00,
        PrecioTotal: 90.00
      },
      {
        Nombre: 'Vino Premium',
        Cantidad: 1,
        PrecioUnitario: 25.00,
        PrecioTotal: 25.00
      }
    ];

    console.log('📤 Request:');
    console.log(`   Items: ${items.length}`);
    items.forEach((item, index) => {
      console.log(`   Item ${index + 1}:`);
      console.log(`      ${item.Nombre}`);
      console.log(`      Cantidad: ${item.Cantidad} x $${item.PrecioUnitario.toFixed(2)} = $${item.PrecioTotal.toFixed(2)}`);
    });
    
    const cotizacion = await adapter.cotizarReserva(items);
    
    console.log('\n✅ Cotización obtenida:');
    console.log(`   Subtotal: $${cotizacion.Subtotal.toFixed(2)}`);
    console.log(`   Impuestos: $${cotizacion.Impuestos.toFixed(2)}`);
    console.log(`   TOTAL: $${cotizacion.Total.toFixed(2)}`);
    
    if (cotizacion.Breakdown && cotizacion.Breakdown.length > 0) {
      console.log('\n   Desglose:');
      cotizacion.Breakdown.forEach(item => {
        console.log(`      ${item.Nombre}: ${item.Cantidad} x $${item.PrecioUnitario.toFixed(2)} = $${item.PrecioTotal.toFixed(2)}`);
      });
    }
    console.log();
  } catch (error: any) {
    console.error('❌ Error en cotizarReserva:', error.message);
  }

  // ============================================================================
  // 5. CREAR PRE-RESERVA
  // ============================================================================
  console.log('\n📝 5. CREAR PRE-RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const itinerario = JSON.stringify({
      fecha: '2025-12-15T19:00:00',
      personas: 4,
      items: [
        { nombre: 'Menú Degustación Andino', cantidad: 2 },
        { nombre: 'Vino Premium', cantidad: 1 }
      ]
    });

    const cliente = JSON.stringify({
      nombre: 'Juan Carlos Pérez',
      email: 'test@example.com',
      telefono: '+593987654321'
    });

    const holdMinutes = 30;
    const idemKey = `SABOR-TEST-${Date.now()}`;

    console.log('📤 Request:');
    console.log(`   Itinerario: ${itinerario}`);
    console.log(`   Cliente: ${cliente}`);
    console.log(`   Hold: ${holdMinutes} minutos`);
    console.log(`   Idempotency Key: ${idemKey}`);
    
    const preReserva = await adapter.crearPreReserva(itinerario, cliente, holdMinutes, idemKey);
    
    preBookingId = preReserva.PreBookingId;
    
    console.log('\n✅ Pre-reserva creada:');
    console.log(`   Pre-Booking ID: ${preReserva.PreBookingId}`);
    console.log(`   Expira en: ${preReserva.ExpiraEn}\n`);
  } catch (error: any) {
    console.error('❌ Error en crearPreReserva:', error.message);
  }

  // ============================================================================
  // 6. CONFIRMAR RESERVA
  // ============================================================================
  console.log('\n✅ 6. CONFIRMAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (!preBookingId) {
    console.log('⚠️  No hay pre-reserva para confirmar. Saltando...\n');
  } else {
    try {
      const metodoPago = 'TARJETA_CREDITO';
      const datosPago = JSON.stringify({
        numeroTarjeta: '4111111111111111',
        nombreTitular: 'JUAN PEREZ',
        fechaExpiracion: '12/26',
        cvv: '123'
      });

      console.log('📤 Request:');
      console.log(`   Pre-Booking ID: ${preBookingId}`);
      console.log(`   Método de pago: ${metodoPago}`);
      
      const confirmacion = await adapter.confirmarReserva(preBookingId, metodoPago, datosPago);
      
      bookingId = confirmacion.BookingId;
      
      console.log('\n✅ Reserva confirmada:');
      console.log(`   Booking ID: ${confirmacion.BookingId}`);
      console.log(`   Estado: ${confirmacion.Estado}\n`);
    } catch (error: any) {
      console.error('❌ Error en confirmarReserva:', error.message);
    }
  }

  // ============================================================================
  // 7. CANCELAR RESERVA
  // ============================================================================
  console.log('\n🚫 7. CANCELAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (!bookingId && !preBookingId) {
    console.log('⚠️  No hay reserva para cancelar. Saltando...\n');
  } else {
    try {
      const idCancelar = bookingId || preBookingId;
      const motivo = 'Prueba de integración - Cancelación automática';

      console.log('📤 Request:');
      console.log(`   Booking ID: ${idCancelar}`);
      console.log(`   Motivo: ${motivo}`);
      
      const cancelacion = await adapter.cancelarReservaIntegracion(idCancelar, motivo);
      
      console.log(`\n${cancelacion.Cancelacion ? '✅' : '❌'} Cancelado: ${cancelacion.Cancelacion ? 'Sí' : 'No'}\n`);
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
  console.log('  Servicio: Sabor Andino (Restaurante)');
  console.log('  Endpoint: https://saborandino.runasp.net/Ws_IntegracionRestaurante.asmx');
  console.log('  Operaciones: 7 (buscar, detalle, verificar, cotizar, pre-reserva, confirmar, cancelar)');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// ============================================================================
// EJECUTAR TEST
// ============================================================================

testSaborAndino().catch(error => {
  console.error('\n💥 Error fatal en el test:', error);
  process.exit(1);
});
