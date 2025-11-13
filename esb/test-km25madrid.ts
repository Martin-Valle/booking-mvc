import { KM25MadridHotelSoapAdapter } from './gateway/km25madrid-hotel.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new KM25MadridHotelSoapAdapter(config.endpoints.km25Madrid);

async function testKM25Madrid() {
  console.log('🏨 ========================================');
  console.log('   KM25 MADRID HOTEL - TEST DE SERVICIO  ');
  console.log('   http://km25madrid.runasp.net');
  console.log('========================================\n');

  try {
    // 1. Buscar hoteles
    console.log('1️⃣ Probando buscarServicios (hoteles en Madrid)...');
    const hoteles = await adapter.buscarServicios({ 
      filtro: 'Madrid',
      precio: 200
    });
    console.log(`✅ Encontrados ${hoteles.length} hoteles`);
    if (hoteles.length > 0) {
      const hotel = hoteles[0];
      console.log(`   📌 Hotel ejemplo: ${hotel.nombre}`);
      console.log(`   🏙️ Ciudad: ${hotel.ciudad}`);
      console.log(`   ⭐ Estrellas: ${hotel.estrellas}`);
      console.log(`   📍 Dirección: ${hotel.direccion}`);
      console.log(`   📧 Email: ${hotel.correo}`);

      // 2. Obtener detalle del hotel
      console.log(`\n2️⃣ Probando obtenerDetalleServicio (ID: ${hotel.idHotel})...`);
      const detalle = await adapter.obtenerDetalleServicio(hotel.idHotel);
      console.log(`✅ Detalle obtenido: ${detalle.nombre}`);
      console.log(`   📝 Descripción: ${detalle.descripcion.substring(0, 100)}...`);
      console.log(`   📞 Teléfono: ${detalle.telefono}`);

      // Para las siguientes operaciones, necesitaríamos un idHabitacion real
      // Por ahora usaremos valores de prueba
      const idHabitacionPrueba = 1;
      const fechaInicio = new Date('2025-12-01');
      const fechaFin = new Date('2025-12-05');

      // 3. Verificar disponibilidad
      console.log(`\n3️⃣ Probando verificarDisponibilidad (Habitación ${idHabitacionPrueba})...`);
      try {
        const disponible = await adapter.verificarDisponibilidad({
          idHabitacion: idHabitacionPrueba,
          fechaInicio,
          fechaFin
        });
        console.log(`✅ Disponibilidad: ${disponible ? '🟢 Disponible' : '🔴 No disponible'}`);
      } catch (err: any) {
        console.log(`⚠️ Error al verificar disponibilidad: ${err.message}`);
      }

      // 4. Cotizar reserva
      console.log(`\n4️⃣ Probando cotizarReserva...`);
      try {
        const precio = await adapter.cotizarReserva({
          idHabitacion: idHabitacionPrueba,
          fechaInicio,
          fechaFin
        });
        console.log(`✅ Precio total: $${precio.toFixed(2)}`);
      } catch (err: any) {
        console.log(`⚠️ Error al cotizar: ${err.message}`);
      }

      // 5. Crear pre-reserva
      console.log(`\n5️⃣ Probando crearPreReserva...`);
      try {
        const idCliente = 1; // Cliente de prueba
        const idPreReserva = await adapter.crearPreReserva({
          idCliente,
          idHabitacion: idHabitacionPrueba,
          fechaCheckin: fechaInicio,
          fechaCheckout: fechaFin
        });
        console.log(`✅ Pre-reserva creada con ID: ${idPreReserva}`);

        // 6. Confirmar reserva
        if (idPreReserva > 0) {
          console.log(`\n6️⃣ Probando confirmarReserva (ID: ${idPreReserva})...`);
          try {
            const idMetodoPago = 1; // Tarjeta de crédito
            const confirmado = await adapter.confirmarReserva({
              idReserva: idPreReserva,
              idMetodoPago
            });
            console.log(`✅ Reserva confirmada: ${confirmado ? '🟢 Sí' : '🔴 No'}`);

            if (confirmado) {
              // 7. Obtener factura
              console.log(`\n7️⃣ Probando obtenerFactura...`);
              try {
                const factura = await adapter.obtenerFactura(idPreReserva);
                console.log(`✅ Factura obtenida:`);
                console.log(`   📄 Número: ${factura.numeroFactura}`);
                console.log(`   💰 Subtotal: $${factura.subtotal.toFixed(2)}`);
                console.log(`   💸 Impuestos: $${factura.impuestos.toFixed(2)}`);
                console.log(`   💵 Total: $${factura.total.toFixed(2)}`);
                console.log(`   📅 Emisión: ${factura.fechaEmision.toISOString()}`);
              } catch (err: any) {
                console.log(`⚠️ Error al obtener factura: ${err.message}`);
              }

              // 8. Cancelar reserva
              console.log(`\n8️⃣ Probando cancelarReservaIntegracion...`);
              try {
                const cancelado = await adapter.cancelarReservaIntegracion({
                  bookingId: idPreReserva,
                  motivo: 'Prueba de integración - cancelación automática'
                });
                console.log(`✅ Reserva cancelada: ${cancelado ? '🟢 Sí' : '🔴 No'}`);
              } catch (err: any) {
                console.log(`⚠️ Error al cancelar: ${err.message}`);
              }
            }
          } catch (err: any) {
            console.log(`⚠️ Error al confirmar: ${err.message}`);
          }
        }
      } catch (err: any) {
        console.log(`⚠️ Error al crear pre-reserva: ${err.message}`);
      }

    } else {
      console.log('⚠️ No se encontraron hoteles para probar las demás operaciones');
    }

    console.log('\n========================================');
    console.log('✅ TEST COMPLETADO');
    console.log('========================================');

  } catch (error: any) {
    console.error('\n❌ Error durante las pruebas:');
    console.error('   Mensaje:', error.message);
    if (error.response?.data) {
      console.error('   Respuesta del servidor:', error.response.data);
    }
    if (error.stack) {
      console.error('\n   Stack Trace:');
      console.error(error.stack);
    }
  }
}

// Ejecutar test
testKM25Madrid();
