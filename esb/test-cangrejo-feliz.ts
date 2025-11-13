/**
 * 🦀 Test Suite - El Cangrejo Feliz Restaurant SOAP Service
 * Testing 7 operations of the booking workflow
 */

import { ESB } from './index';

console.log('🦀 ========================================');
console.log('   EL CANGREJO FELIZ - TEST DE SERVICIO  ');
console.log('   https://elcangrejofeliz.runasp.net    ');
console.log('========================================\n');

async function testCangrejoFeliz() {
  try {
    // 1️⃣ Buscar Servicios
    console.log('1️⃣ Probando buscarServicios...');
    const servicios = await ESB.cangrejoFeliz.buscarServicios('');
    console.log(`✅ Encontrados ${servicios.length} servicios`);
    if (servicios.length > 0) {
      console.log(`   Primer servicio: ${servicios[0].Nombre} (ID: ${servicios[0].IdServicio})`);
      console.log(`   Tipo: ${servicios[0].Tipo}, Ciudad: ${servicios[0].Ciudad}`);
      console.log(`   Precio: ${servicios[0].Precio}`);
    }
    console.log('');

    // Si no hay servicios, usamos un ID de prueba
    const testServiceId = servicios.length > 0 ? servicios[0].IdServicio : 1;
    console.log(`📌 Usando ID de servicio: ${testServiceId}\n`);

    // 2️⃣ Obtener Detalle del Servicio
    console.log('2️⃣ Probando obtenerDetalleServicio...');
    const detalle = await ESB.cangrejoFeliz.obtenerDetalle(testServiceId);
    console.log(`✅ Detalle obtenido: ${detalle.Nombre}`);
    console.log(`   Descripción: ${detalle.Descripcion}`);
    console.log(`   Políticas: ${detalle.Politicas}`);
    console.log(`   Reglas: ${detalle.Reglas}`);
    console.log('');

    // 3️⃣ Verificar Disponibilidad
    console.log('3️⃣ Probando verificarDisponibilidad...');
    const fechaInicio = new Date('2025-12-20T12:00:00');
    const fechaFin = new Date('2025-12-20T14:00:00');
    const disponible = await ESB.cangrejoFeliz.verificarDisponibilidad(
      testServiceId,
      fechaInicio,
      fechaFin,
      4 // 4 personas
    );
    console.log(`✅ Disponible: ${disponible ? 'Sí' : 'No'}`);
    console.log('');

    // 4️⃣ Cotizar Reserva
    console.log('4️⃣ Probando cotizarReserva...');
    const items = [
      { Nombre: 'Almuerzo Ejecutivo', Cantidad: 2, PrecioUnitario: 15.00, PrecioTotal: 30.00 },
      { Nombre: 'Ceviche de Camarón', Cantidad: 1, PrecioUnitario: 18.50, PrecioTotal: 18.50 },
      { Nombre: 'Limonada', Cantidad: 2, PrecioUnitario: 3.00, PrecioTotal: 6.00 }
    ];
    const cotizacion = await ESB.cangrejoFeliz.cotizar(items);
    console.log(`✅ Total cotizado: $${cotizacion.Total.toFixed(2)}`);
    console.log(`   Desglose:`);
    cotizacion.Breakdown.forEach(item => {
      console.log(`   - ${item.Nombre}: ${item.Cantidad} x $${item.PrecioUnitario} = $${item.PrecioTotal}`);
    });
    console.log('');

    // 5️⃣ Crear Pre-Reserva
    console.log('5️⃣ Probando crearPreReserva...');
    const itinerarioJson = JSON.stringify({
      servicioId: testServiceId,
      fecha: '2025-12-20T12:00:00',
      personas: 4,
      items: items
    });
    const clienteJson = JSON.stringify({
      nombre: 'Juan Test',
      email: 'juan@test.com',
      telefono: '0999999999'
    });
    const preReserva = await ESB.cangrejoFeliz.crearPreReserva(
      itinerarioJson,
      clienteJson,
      30, // 30 minutos de bloqueo
      `CANGREJO-${Date.now()}` // Idempotency key
    );
    console.log(`✅ Pre-reserva creada: ${preReserva.PreBookingId}`);
    console.log(`   Expira en: ${preReserva.ExpiraEn}`);
    console.log('');

    // 6️⃣ Confirmar Reserva
    console.log('6️⃣ Probando confirmarReserva...');
    const datosPagoJson = JSON.stringify({
      tarjeta: '4111111111111111',
      titular: 'Juan Test',
      cvv: '123'
    });
    const reserva = await ESB.cangrejoFeliz.confirmarReserva(
      preReserva.PreBookingId,
      'CreditCard',
      datosPagoJson
    );
    console.log(`✅ Reserva confirmada: ${reserva.BookingId}`);
    console.log(`   Estado: ${reserva.Estado}`);
    console.log('');

    // 7️⃣ Cancelar Reserva
    console.log('7️⃣ Probando cancelarReserva...');
    const cancelado = await ESB.cangrejoFeliz.cancelar(
      reserva.BookingId,
      'Prueba de integración - cancelación automática'
    );
    console.log(`✅ Cancelación exitosa: ${cancelado ? 'Sí' : 'No'}`);
    console.log('');

    // ✅ Resumen Final
    console.log('🎉 ========================================');
    console.log('   ✅ TODOS LOS TESTS COMPLETADOS          ');
    console.log('   🦀 El Cangrejo Feliz funciona OK        ');
    console.log('========================================');

  } catch (error: any) {
    console.error('\n❌ Error durante las pruebas:');
    console.error(`   Mensaje: ${error.message}`);
    if (error.response) {
      console.error(`   HTTP Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.stack) {
      console.error(`\n   Stack Trace:\n${error.stack}`);
    }
  }
}

testCangrejoFeliz();
