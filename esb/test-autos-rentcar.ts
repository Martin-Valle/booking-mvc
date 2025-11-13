/**
 * 🚗 Test Suite - Autos RentCar SOAP Service
 * Testing 7 operations with advanced filters
 */

import { ESB } from './index';

console.log('🚗 ========================================');
console.log('   AUTOS RENTCAR - TEST DE SERVICIO      ');
console.log('   http://autos.runasp.net                ');
console.log('========================================\n');

async function testAutosRentCar() {
  try {
    // 1️⃣ Buscar Autos con Filtros
    console.log('1️⃣ Probando buscarServicios (SUV en Quito)...');
    const autos = await ESB.autosRentCar.buscarServicios({
      ciudad: 'Quito',
      categoria: 'SUV',
      gearbox: 'Automatic',
      precioMin: 0,
      precioMax: 100,
      driverAge: 25,
      page: 1,
      pageSize: 10
    });
    console.log(`✅ Encontrados ${autos.length} autos`);
    if (autos.length > 0) {
      console.log(`   Primer auto: ${autos[0].marca} ${autos[0].modelo}`);
      console.log(`   SKU: ${autos[0].sku}`);
      console.log(`   Categoría: ${autos[0].categoria}`);
      console.log(`   Transmisión: ${autos[0].gearbox}`);
      console.log(`   Precio/día: $${autos[0].precioDia}`);
      console.log(`   Ciudad: ${autos[0].ciudad}`);
    }
    console.log('');

    // Si no hay autos, usamos un ID de prueba
    const testSku = autos.length > 0 ? autos[0].sku : 1;
    console.log(`📌 Usando SKU: ${testSku}\n`);

    // 2️⃣ Obtener Detalle del Auto
    console.log('2️⃣ Probando obtenerDetalleServicio...');
    const detalle = await ESB.autosRentCar.obtenerDetalle(testSku);
    console.log(`✅ Detalle obtenido: ${detalle.marca} ${detalle.modelo}`);
    console.log(`   Categoría: ${detalle.categoria}`);
    console.log(`   Transmisión: ${detalle.gearbox}`);
    console.log(`   Precio/día: $${detalle.precioDia}`);
    console.log(`   Pickup: ${detalle.pickupOffice}`);
    console.log(`   Dropoff: ${detalle.dropoffOffice}`);
    console.log(`   Imágenes: ${detalle.imagenes.length} disponibles`);
    console.log(`   Políticas: ${detalle.politicas}`);
    console.log('');

    // 3️⃣ Verificar Disponibilidad
    console.log('3️⃣ Probando verificarDisponibilidad...');
    const pickupDate = new Date('2025-12-20T10:00:00');
    const dropoffDate = new Date('2025-12-25T10:00:00');
    const disponible = await ESB.autosRentCar.verificarDisponibilidad(
      testSku,
      pickupDate,
      dropoffDate,
      1
    );
    console.log(`✅ Disponible: ${disponible ? 'Sí' : 'No'}`);
    console.log(`   Pickup: ${pickupDate.toLocaleDateString()}`);
    console.log(`   Dropoff: ${dropoffDate.toLocaleDateString()}`);
    const dias = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`   Duración: ${dias} días`);
    console.log('');

    // 4️⃣ Cotizar Reserva
    console.log('4️⃣ Probando cotizarReserva...');
    const precioDia = autos.length > 0 ? autos[0].precioDia : 45;
    const items = [
      { sku: testSku, dias: dias, precioDia: precioDia }
    ];
    const cotizacion = await ESB.autosRentCar.cotizar(items);
    console.log(`✅ Cotización:`);
    console.log(`   Subtotal: $${cotizacion.subtotal.toFixed(2)}`);
    console.log(`   Impuestos: $${cotizacion.impuestos.toFixed(2)}`);
    console.log(`   Total: $${cotizacion.total.toFixed(2)}`);
    console.log(`   Desglose: ${cotizacion.items.length} item(s)`);
    console.log('');

    // 5️⃣ Crear Pre-Reserva
    console.log('5️⃣ Probando crearPreReserva...');
    const preReserva = await ESB.autosRentCar.crearPreReserva(
      items,
      1, // clienteId
      30, // 30 minutos
      `AUTOS-${Date.now()}`, // idemKey
      pickupDate,
      dropoffDate,
      testSku
    );
    console.log(`✅ Pre-reserva creada: ${preReserva.preBookingId}`);
    console.log(`   Expira en: ${preReserva.expiraEn}`);
    console.log('');

    // 6️⃣ Confirmar Reserva
    console.log('6️⃣ Probando confirmarReserva...');
    const datosPago = {
      metodo: 'CreditCard',
      referencia: 'REF-' + Date.now(),
      monto: cotizacion.total
    };
    const reserva = await ESB.autosRentCar.confirmarReserva(
      preReserva.preBookingId,
      'CreditCard',
      datosPago
    );
    console.log(`✅ Reserva confirmada: ${reserva.bookingId}`);
    console.log(`   Estado: ${reserva.estado}`);
    console.log(`   Reserva ID: ${reserva.reservaId}`);
    console.log('');

    // 7️⃣ Cancelar Reserva
    console.log('7️⃣ Probando cancelarReserva...');
    const cancelado = await ESB.autosRentCar.cancelar(
      reserva.bookingId,
      'Prueba de integración - cancelación automática'
    );
    console.log(`✅ Cancelación exitosa: ${cancelado ? 'Sí' : 'No'}`);
    console.log('');

    // ✅ Resumen Final
    console.log('🎉 ========================================');
    console.log('   ✅ TODOS LOS TESTS COMPLETADOS          ');
    console.log('   🚗 Autos RentCar funciona OK            ');
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

testAutosRentCar();
