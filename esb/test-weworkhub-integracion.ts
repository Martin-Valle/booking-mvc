/**
 * WeWorkHub Integración - Test Suite
 * Servicio 11: Hub de Integración Multi-Servicio
 * Endpoint: http://inegracion.runasp.net/WS_Integracion.asmx
 */

import { WeWorkHubIntegracionSoapAdapter } from './gateway/weworkhub-integracion.adapter';
import { getESBConfig } from './utils/config';
import type {
  FiltrosBusquedaSoapDto,
  ItemItinerarioSoapDto,
  UsuarioSoapDto
} from './gateway/weworkhub-integracion.adapter';

// ============================================================================
// TEST RUNNER
// ============================================================================

async function testWeWorkHubIntegracion() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WEWORKHUB INTEGRACIÓN - TEST DE TODAS LAS OPERACIONES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const config = getESBConfig();
  const adapter = new WeWorkHubIntegracionSoapAdapter(config.endpoints.weWorkHubIntegracion);

  let testServicio: any = null;
  let testItems: ItemItinerarioSoapDto[] = [];
  let preBookingId: string = '';
  let reservaId: string = '';

  // ============================================================================
  // 1. BUSCAR SERVICIOS
  // ============================================================================
  console.log('🔍 1. BUSCAR SERVICIOS (Hoteles)');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const filtros: FiltrosBusquedaSoapDto = {
      serviceType: 'HOTEL',
      fechaInicio: '2025-11-01',
      fechaFin: '2025-11-05',
      precioMin: 50,
      precioMax: 200,
      adultos: 2,
      ninos: 0
    };

    console.log('📤 Request:');
    console.log(JSON.stringify(filtros, null, 2));

    const servicios = await adapter.buscarServicios(filtros);
    
    console.log(`\n✅ Servicios encontrados: ${servicios.length}\n`);
    
    if (servicios.length > 0) {
      testServicio = servicios[0];
      console.log('📋 Primer servicio:');
      console.log(`   ID: ${testServicio.idServicio}`);
      console.log(`   Tipo: ${testServicio.serviceType}`);
      console.log(`   Nombre: ${testServicio.nombre}`);
      console.log(`   Ciudad: ${testServicio.ciudad}`);
      console.log(`   Precio desde: ${testServicio.moneda} ${testServicio.precioDesde}`);
      console.log(`   Clasificación: ${testServicio.clasificacion} ⭐`);
      console.log(`   Amenities: ${testServicio.amenities.join(', ')}`);
      console.log(`   Disponible: ${testServicio.disponible ? '✅ Sí' : '❌ No'}\n`);
    }
  } catch (error: any) {
    console.error('❌ Error en buscarServicios:', error.message);
    console.error('Stack:', error.stack);
    console.log('⚠️  No se puede continuar sin servicios. Abortando tests.\n');
    return;
  }

  // ============================================================================
  // 2. OBTENER DETALLE DEL SERVICIO (UUID real: 6a8a0a7c-f00c-4650-9df4-fd6f4f98c017)
  // ============================================================================
  console.log('\n🔍 2. OBTENER DETALLE DEL SERVICIO');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    // Usar UUID real conocido: habitación 101
    const idServicioReal = '6a8a0a7c-f00c-4650-9df4-fd6f4f98c017';
    console.log(`📤 Request: idServicio = ${idServicioReal} (Habitación 101)`);
    
    const detalle = await adapter.obtenerDetalleServicio(idServicioReal);
    
    console.log('\n✅ Detalle obtenido:');
    console.log(`   ID: ${detalle.idServicio}`);
    console.log(`   Nombre: ${detalle.nombre}`);
    console.log(`   Ciudad: ${detalle.ciudad}`);
    console.log(`   Precio: ${detalle.moneda} ${detalle.precioDesde}`);
    console.log(`   Clasificación: ${detalle.clasificacion} ⭐`);
    console.log(`   Disponible: ${detalle.disponible ? '✅ Sí' : '❌ No'}\n`);
    
    // Usar este servicio para pruebas posteriores
    testServicio = detalle;
  } catch (error: any) {
    console.error('❌ Error en obtenerDetalleServicio:', error.message);
    console.error('Stack:', error.stack);
  }

  // ============================================================================
  // 3. VERIFICAR DISPONIBILIDAD (SKU real: 101)
  // ============================================================================
  console.log('\n🔍 3. VERIFICAR DISPONIBILIDAD');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    const sku = '101'; // SKU real de habitación 101
    const inicio = '2025-11-01';
    const fin = '2025-11-05';
    const unidades = 1;

    console.log('📤 Request:');
    console.log(`   SKU: ${sku} (Habitación 101)`);
    console.log(`   Fecha inicio: ${inicio}`);
    console.log(`   Fecha fin: ${fin}`);
    console.log(`   Unidades: ${unidades}`);
    
    const disponible = await adapter.verificarDisponibilidad(sku, inicio, fin, unidades);
    
    console.log(`\n${disponible ? '✅' : '❌'} Disponible: ${disponible ? 'Sí' : 'No'}\n`);

    if (disponible || testServicio) {
      testItems = [{
        sku: '101',
        serviceType: 'HOTEL',
        fechaInicio: inicio,
        fechaFin: fin,
        unidades,
        precioUnitario: 75.00 // Precio real de habitación 101
      }];
    }
  } catch (error: any) {
    console.error('❌ Error en verificarDisponibilidad:', error.message);
    console.error('Stack:', error.stack);
  }

  // ============================================================================
  // 4. COTIZAR RESERVA
  // ============================================================================
  console.log('\n💰 4. COTIZAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (testItems.length === 0) {
    console.log('⚠️  No hay items para cotizar. Saltando...\n');
  } else {
    try {
      console.log('📤 Request:');
      console.log(`   Items: ${testItems.length}`);
      testItems.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        console.log(`      SKU: ${item.sku}`);
        console.log(`      Tipo: ${item.serviceType}`);
        console.log(`      Unidades: ${item.unidades}`);
        console.log(`      Precio unitario: ${item.precioUnitario}`);
      });
      
      const cotizacion = await adapter.cotizarReserva(testItems);
      
      console.log('\n✅ Cotización obtenida:');
      console.log(`   Subtotal: ${cotizacion.moneda} ${cotizacion.subtotal.toFixed(2)}`);
      console.log(`   Impuestos: ${cotizacion.moneda} ${cotizacion.impuestos.toFixed(2)}`);
      console.log(`   Fees: ${cotizacion.moneda} ${cotizacion.fees.toFixed(2)}`);
      console.log(`   TOTAL: ${cotizacion.moneda} ${cotizacion.total.toFixed(2)}`);
      if (cotizacion.breakdown && cotizacion.breakdown.length > 0) {
        console.log('\n   Desglose:');
        cotizacion.breakdown.forEach(line => {
          console.log(`      • ${line}`);
        });
      }
      console.log();
    } catch (error: any) {
      console.error('❌ Error en cotizarReserva:', error.message);
    }
  }

  // ============================================================================
  // 5. CREAR PRE-RESERVA (Cliente y datos reales)
  // ============================================================================
  console.log('\n📝 5. CREAR PRE-RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (testItems.length === 0) {
    console.log('⚠️  No hay items para pre-reservar. Creando items de prueba con datos reales...');
    // Usar datos reales: habitación 102
    testItems = [{
      sku: '102',
      serviceType: 'HOTEL',
      fechaInicio: '2025-11-15',
      fechaFin: '2025-11-18',
      unidades: 1,
      precioUnitario: 75.00
    }];
  }
  
  try {
    const cliente: UsuarioSoapDto = {
      NumeroIdentificacion: '0987654321', // CI real del ejemplo
      TipoIdentificacion: 'CI',
      Email: 'cliente1@email.com',
      Nombres: 'María José',
      Apellidos: 'González López',
      Telefono: '0999123456',
      Nacionalidad: 'ECUATORIANA'
    };

    const holdMinutes = 30;
    const idemKey = `test-prereserva-api-${Date.now()}`;

    console.log('📤 Request:');
    console.log(`   Cliente: ${cliente.Nombres} ${cliente.Apellidos}`);
    console.log(`   Email: ${cliente.Email}`);
    console.log(`   CI: ${cliente.NumeroIdentificacion}`);
    console.log(`   Hold: ${holdMinutes} minutos`);
    console.log(`   Idempotency Key: ${idemKey}`);
    console.log(`   Items: ${testItems.length}`);
    
    const preReserva = await adapter.crearPreReserva(testItems, cliente, holdMinutes, idemKey);
    
    preBookingId = preReserva.preBookingId;
    
    console.log('\n✅ Pre-reserva creada:');
    console.log(`   Pre-Booking ID: ${preReserva.preBookingId}`);
    console.log(`   Expira en: ${preReserva.expiraEn}`);
    console.log(`   Monto bloqueo: ${preReserva.montoBloqueo}`);
    console.log(`   Estado: ${preReserva.estado}\n`);
  } catch (error: any) {
    console.error('❌ Error en crearPreReserva:', error.message);
    console.error('Stack:', error.stack);
  }

  // ============================================================================
  // 6. CONFIRMAR RESERVA (Pre-reserva real: PRE-TEST-001)
  // ============================================================================
  console.log('\n✅ 6. CONFIRMAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (!preBookingId) {
    console.log('⚠️  No hay pre-reserva creada. Usando pre-reserva real conocida: PRE-TEST-001\n');
    preBookingId = 'PRE-TEST-001';
  }
  
  try {
    const metodoPago = 'TARJETA_CREDITO';
    const datosPago = JSON.stringify({
      numero: '4111111111111111',
      exp: '12/26',
      cvv: '123'
    });

    console.log('📤 Request:');
    console.log(`   Pre-Booking ID: ${preBookingId}`);
    console.log(`   Método de pago: ${metodoPago}`);
    
    const reserva = await adapter.confirmarReserva(preBookingId, metodoPago, datosPago);
    
    reservaId = reserva.CodigoReserva;
    
    console.log('\n✅ Reserva confirmada:');
    console.log(`   ID Reserva: ${reserva.IdReserva}`);
    console.log(`   UUID: ${reserva.UuidReserva}`);
    console.log(`   Código: ${reserva.CodigoReserva}`);
    console.log(`   Estado: ${reserva.EstadoReserva}`);
    console.log(`   Check-in: ${reserva.FechaCheckin}`);
    console.log(`   Check-out: ${reserva.FechaCheckout}`);
    console.log(`   Total: ${reserva.Moneda} ${reserva.TotalReserva || reserva.Subtotal}\n`);
  } catch (error: any) {
    console.error('❌ Error en confirmarReserva:', error.message);
    console.error('Stack:', error.stack);
  }

  // ============================================================================
  // 7. CANCELAR RESERVA (Reserva real: RES-20251027-001)
  // ============================================================================
  console.log('\n🚫 7. CANCELAR RESERVA');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  if (!reservaId) {
    console.log('⚠️  No hay reserva creada. Usando reserva real conocida: RES-20251027-001\n');
    reservaId = 'RES-20251027-001';
  }
  
  try {
    const motivo = 'Prueba de cancelación desde API externa - Test automatizado';

    console.log('📤 Request:');
    console.log(`   Booking ID: ${reservaId}`);
    console.log(`   Motivo: ${motivo}`);
    
    const cancelado = await adapter.cancelarReservaIntegracion(reservaId, motivo);
    
    console.log(`\n${cancelado ? '✅' : '❌'} Cancelado: ${cancelado ? 'Sí' : 'No'}\n`);
  } catch (error: any) {
    console.error('❌ Error en cancelarReservaIntegracion:', error.message);
    console.error('Stack:', error.stack);
  }

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESUMEN DEL TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Servicio: WeWorkHub Integración (Hub Multi-Servicio)');
  console.log('  Endpoint: http://inegracion.runasp.net/WS_Integracion.asmx');
  console.log('  Operaciones: 7 (buscar, detalle, verificar, cotizar, pre-reserva, confirmar, cancelar)');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// ============================================================================
// EJECUTAR TEST
// ============================================================================

testWeWorkHubIntegracion().catch(error => {
  console.error('\n💥 Error fatal en el test:', error);
  process.exit(1);
});
