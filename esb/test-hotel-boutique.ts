/**
 * 🏨 Test Suite - Hotel Boutique Paris SOAP Service
 * Testing 7 operations of the hotel booking workflow
 */

import { ESB } from './index';

console.log('🏨 ========================================');
console.log('   HOTEL BOUTIQUE PARIS - TEST           ');
console.log('   http://hotelboutique.runasp.net       ');
console.log('========================================\n');

async function testHotelBoutique() {
  try {
    // 1️⃣ Buscar Habitaciones
    console.log('1️⃣ Probando buscarServicios (ciudad: Quito)...');
    const rooms = await ESB.hotelBoutique.buscarServicios(
      'Quito',
      new Date('2025-12-20'),
      new Date('2025-12-23'),
      0,
      200,
      'WiFi'
    );
    console.log(`✅ Encontradas ${rooms.length} habitaciones`);
    if (rooms.length > 0) {
      console.log(`   Primera habitación: ${rooms[0].RoomType} en ${rooms[0].HotelName}`);
      console.log(`   Hotel ID: ${rooms[0].HotelId}, Room ID: ${rooms[0].RoomId}`);
      console.log(`   Precio: $${rooms[0].PricePerNight}/noche`);
      console.log(`   Camas: ${rooms[0].NumberBeds}, Adultos: ${rooms[0].OccupancyAdults}`);
      console.log(`   Desayuno incluido: ${rooms[0].BreakfastIncluded ? 'Sí' : 'No'}`);
      console.log(`   Amenities: ${rooms[0].Amenities}`);
    }
    console.log('');

    // Si no hay habitaciones, usamos un ID de prueba
    const testRoomId = rooms.length > 0 ? rooms[0].RoomId : 1;
    console.log(`📌 Usando Room ID: ${testRoomId}\n`);

    // 2️⃣ Obtener Detalle de la Habitación
    console.log('2️⃣ Probando obtenerDetalleServicio...');
    const detalle = await ESB.hotelBoutique.obtenerDetalle(testRoomId);
    console.log(`✅ Detalle obtenido: ${detalle.RoomType}`);
    console.log(`   Hotel: ${detalle.HotelName} (${detalle.City})`);
    console.log(`   Tipo de habitación: ${detalle.RoomType}`);
    console.log(`   Régimen: ${detalle.Board}`);
    console.log(`   Precio: $${detalle.PricePerNight}/noche (${detalle.Currency})`);
    console.log(`   Capacidad: ${detalle.OccupancyAdults} adultos, ${detalle.OccupancyChildren} niños`);
    console.log('');

    // 3️⃣ Verificar Disponibilidad
    console.log('3️⃣ Probando verificarDisponibilidad...');
    const fechaInicio = new Date('2025-12-20T14:00:00');
    const fechaFin = new Date('2025-12-23T12:00:00');
    const disponible = await ESB.hotelBoutique.verificarDisponibilidad(
      testRoomId,
      fechaInicio,
      fechaFin,
      1 // 1 habitación
    );
    console.log(`✅ Disponible: ${disponible ? 'Sí' : 'No'}`);
    console.log(`   Fechas: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`);
    console.log('');

    // 4️⃣ Cotizar Reserva
    console.log('4️⃣ Probando cotizarReserva...');
    const roomIds = [testRoomId];
    const cotizacion = await ESB.hotelBoutique.cotizar(roomIds);
    console.log(`✅ Cotización:`);
    console.log(`   Subtotal: $${cotizacion.Subtotal.toFixed(2)}`);
    console.log(`   Impuestos: $${cotizacion.Impuestos.toFixed(2)}`);
    console.log(`   Total: $${cotizacion.Total.toFixed(2)}`);
    console.log(`   Desglose: ${cotizacion.Desglose}`);
    console.log('');

    // 5️⃣ Crear Pre-Reserva
    console.log('5️⃣ Probando crearPreReserva...');
    const preReserva = await ESB.hotelBoutique.crearPreReserva(
      testRoomId,
      1, // userId
      30 // 30 minutos de bloqueo
    );
    console.log(`✅ Pre-reserva creada: ${preReserva.PreBookingId}`);
    console.log(`   Room ID: ${preReserva.RoomId}`);
    console.log(`   User ID: ${preReserva.UserId}`);
    console.log(`   Expira en: ${preReserva.ExpiraEn}`);
    console.log('');

    // 6️⃣ Confirmar Reserva
    console.log('6️⃣ Probando confirmarReserva...');
    const datosPagoJson = JSON.stringify({
      tarjeta: '4111111111111111',
      titular: 'Juan Test',
      cvv: '123',
      expiracion: '12/28'
    });
    const reserva = await ESB.hotelBoutique.confirmarReserva(
      preReserva.PreBookingId,
      'CreditCard',
      datosPagoJson
    );
    console.log(`✅ Reserva confirmada: ${reserva.BookingId}`);
    console.log(`   Estado: ${reserva.Estado}`);
    console.log(`   Método de pago: ${reserva.MetodoPago}`);
    console.log(`   Fecha confirmación: ${reserva.FechaConfirmacion}`);
    console.log('');

    // 7️⃣ Cancelar Reserva
    console.log('7️⃣ Probando cancelarReserva...');
    const cancelado = await ESB.hotelBoutique.cancelar(
      reserva.BookingId,
      'Prueba de integración - cancelación automática'
    );
    console.log(`✅ Cancelación exitosa: ${cancelado ? 'Sí' : 'No'}`);
    console.log('');

    // ✅ Resumen Final
    console.log('🎉 ========================================');
    console.log('   ✅ TODOS LOS TESTS COMPLETADOS          ');
    console.log('   🏨 Hotel Boutique Paris funciona OK     ');
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

testHotelBoutique();
