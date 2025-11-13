/**
 * ✈️ Test del servicio SOAP de SkyAndes - Vuelos
 * Prueba todas las operaciones del servicio de vuelos
 */

import { ESB } from './index';

async function testSkyAndes() {
  console.log('\n✈️ ===== PRUEBAS DEL SERVICIO DE SKYANDES VUELOS =====\n');
  console.log('🔗 Endpoint: http://skyandesintegracion.runasp.net/WS_Integracion.asmx');
  console.log('🔖 Namespace: http://skyandes.com/integracion/\n');

  try {
    // ==================== 1️⃣ BUSCAR VUELOS ====================
    console.log('1️⃣ BUSCAR VUELOS DISPONIBLES...');
    const originId = 1; // Quito
    const destinationId = 2; // Guayaquil
    const fecha = new Date('2025-12-15');
    const cabinClass = 'Economy';
    
    const vuelos = await ESB.skyandes.buscarServicios(originId, destinationId, fecha, cabinClass);
    console.log(`✅ Encontrados ${vuelos.length} vuelos:`);
    vuelos.forEach(vuelo => {
      console.log(`   - ${vuelo.Airline} ${vuelo.FlightNumber}`);
      console.log(`     Salida: ${vuelo.DepartureTime.toLocaleString()}`);
      console.log(`     Llegada: ${vuelo.ArrivalTime.toLocaleString()}`);
      console.log(`     Duración: ${vuelo.Duration}`);
      console.log(`     Cabina: ${vuelo.CabinClass}`);
    });

    if (vuelos.length === 0) {
      console.log('⚠️  No hay vuelos disponibles, usando ID de prueba...');
      return;
    }

    // ==================== 2️⃣ OBTENER DETALLE ====================
    const primerVuelo = vuelos[0];
    console.log(`\n2️⃣ OBTENER DETALLE DEL VUELO ID: ${primerVuelo.FlightId}...`);
    const detalle = await ESB.skyandes.obtenerDetalle(primerVuelo.FlightId);
    console.log('✅ Detalle obtenido:');
    console.log(`   Vuelo: ${detalle.Airline} ${detalle.FlightNumber}`);
    console.log(`   Origen ID: ${detalle.OriginId}`);
    console.log(`   Destino ID: ${detalle.DestinationId}`);
    console.log(`   Salida: ${detalle.DepartureTime.toLocaleString()}`);
    console.log(`   Llegada: ${detalle.ArrivalTime.toLocaleString()}`);
    console.log(`   Duración: ${detalle.Duration}`);
    console.log(`   Política de cancelación: ${detalle.CancellationPolicy}`);
    console.log(`   Avión ID: ${detalle.AircraftId}`);

    // ==================== 3️⃣ VERIFICAR DISPONIBILIDAD ====================
    const inicio = new Date('2025-12-15');
    const fin = new Date('2025-12-15');
    console.log(`\n3️⃣ VERIFICAR DISPONIBILIDAD (${inicio.toLocaleDateString()})...`);
    const disponible = await ESB.skyandes.verificarDisponibilidad(primerVuelo.FlightId, inicio, fin, 2);
    console.log(`✅ Disponibilidad: ${disponible ? '✓ Disponible' : '✗ No disponible'}`);

    // ==================== 4️⃣ COTIZAR RESERVA ====================
    console.log('\n4️⃣ COTIZAR RESERVA (2 pasajeros)...');
    const cotizacion = await ESB.skyandes.cotizar(primerVuelo.FlightId, 2);
    console.log('✅ Cotización:');
    console.log(`   Precio base: $${cotizacion.BasePrice}`);
    console.log(`   Impuestos: $${cotizacion.Impuestos}`);
    console.log(`   Descuento promo: $${cotizacion.PromoDiscount}`);
    console.log(`   Total: $${cotizacion.Total}`);

    // ==================== 5️⃣ CREAR PRE-RESERVA ====================
    console.log('\n5️⃣ CREAR PRE-RESERVA...');
    const preReserva = await ESB.skyandes.crearPreReserva(
      1, // userId
      primerVuelo.FlightId,
      15, // holdMinutes
      `TEST-${Date.now()}` // idemKey
    );
    console.log(`✅ Pre-reserva creada: ${preReserva.PreBookingId}`);
    console.log(`   Expira en: ${preReserva.ExpiraEn.toLocaleString()}`);

    // ==================== 6️⃣ CONFIRMAR RESERVA ====================
    console.log('\n6️⃣ CONFIRMAR RESERVA...');
    const reserva = await ESB.skyandes.confirmarReserva(
      preReserva.PreBookingId,
      'Tarjeta de crédito',
      cotizacion.Total,
      'XXXX-XXXX-XXXX-1234'
    );
    console.log(`✅ Reserva confirmada:`);
    console.log(`   Booking ID: ${reserva.BookingId}`);
    console.log(`   Estado: ${reserva.Estado}`);

    // ==================== 7️⃣ CANCELAR RESERVA ====================
    console.log('\n7️⃣ CANCELAR RESERVA...');
    const cancelado = await ESB.skyandes.cancelar(
      reserva.BookingId,
      'Prueba de integración - cancelación automática'
    );
    console.log(`✅ Reserva cancelada: ${cancelado ? '✓ Éxito' : '✗ Error'}`);

    console.log('\n✅ ===== TODAS LAS PRUEBAS COMPLETADAS =====\n');

  } catch (error: any) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message);
    if (error.response?.data) {
      const errorData = typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 500)
        : JSON.stringify(error.response.data).substring(0, 500);
      console.error('Respuesta del servidor:', errorData);
    }
    console.log('\n📊 ESTADO: Error detectado en el servicio SOAP\n');
  }
}

// Ejecutar pruebas
testSkyAndes();
