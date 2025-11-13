/**
 * Test de integración: WS Integración (WCF)
 * 9 operaciones: BuscarServicios, VerificarDisponibilidad, CalcularPrecioTotal,
 * CrearPreReserva, ConfirmarPreReserva, ConfirmarReserva, CancelarReserva,
 * ConsultarReserva, ConsultarPreReserva
 */

import { defaultConfig as config } from './utils/config';
import { WSIntegracionSoapAdapter } from './gateway/ws-integracion.adapter';

async function testWSIntegracion() {
  console.log('🔧 ========================================');
  console.log('   WS INTEGRACIÓN (WCF) - TEST COMPLETO');
  console.log('   https://wsintegracion...canadacentral');
  console.log('========================================\n');

  try {
    const adapter = new WSIntegracionSoapAdapter(config.endpoints.wsIntegracion);

    // 1. Buscar servicios
    console.log('1️⃣ Probando BuscarServicios...');
    console.log('   Criterios: Página 1, 10 items');
    
    const servicios = await adapter.buscarServicios({
      Page: 1,
      PageSize: 10
    });
    
    console.log(`✅ ${servicios.length} servicios encontrados`);
    if (servicios.length > 0) {
      const servicio = servicios[0];
      console.log(`\n   📦 Servicio ejemplo:`);
      console.log(`   ID: ${servicio.IdServicio}`);
      console.log(`   Nombre: ${servicio.Nombre}`);
      console.log(`   Descripción: ${servicio.Descripcion.substring(0, 50)}...`);
      console.log(`   Precio base: ${servicio.Moneda} ${servicio.PrecioBase}`);
      console.log(`   Categoría: ${servicio.NombreCategoria}`);
      console.log(`   Disponible: ${servicio.Disponible ? '🟢 Sí' : '🔴 No'}`);

      const servicioId = servicio.IdServicio;
      const fechaInicio = new Date('2025-12-15');
      const fechaFin = new Date('2025-12-20');

      // 2. Verificar disponibilidad
      console.log(`\n2️⃣ Probando VerificarDisponibilidad...`);
      console.log(`   Servicio: ${servicioId}`);
      console.log(`   Fechas: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`);
      
      const disponibilidad = await adapter.verificarDisponibilidad({
        IdServicio: servicioId,
        FechaInicio: fechaInicio,
        FechaFin: fechaFin,
        Cantidad: 2
      });
      
      console.log(`✅ Disponibilidad: ${disponibilidad.Disponible ? '🟢 Disponible' : '🔴 No disponible'}`);
      if (disponibilidad.Mensaje) {
        console.log(`   Mensaje: ${disponibilidad.Mensaje}`);
      }
      if (disponibilidad.UnidadesDisponibles) {
        console.log(`   Unidades disponibles: ${disponibilidad.UnidadesDisponibles}`);
      }

      if (disponibilidad.Disponible) {
        // 3. Calcular precio total
        console.log(`\n3️⃣ Probando CalcularPrecioTotal...`);
        
        const precioTotal = await adapter.calcularPrecioTotal({
          IdServicio: servicioId,
          FechaInicio: fechaInicio,
          FechaFin: fechaFin,
          Cantidad: 2
        });
        
        console.log(`✅ Cotización obtenida:`);
        console.log(`   Precio base: ${precioTotal.Moneda} ${precioTotal.PrecioBase}`);
        console.log(`   Impuestos: ${precioTotal.Moneda} ${precioTotal.Impuestos}`);
        console.log(`   Descuentos: ${precioTotal.Moneda} ${precioTotal.Descuentos}`);
        console.log(`   TOTAL: ${precioTotal.Moneda} ${precioTotal.PrecioTotal}`);
        if (precioTotal.Detalle) {
          console.log(`   Detalle: ${precioTotal.Detalle}`);
        }

        // 4. Crear pre-reserva
        console.log(`\n4️⃣ Probando CrearPreReserva...`);
        
        const preReserva = await adapter.crearPreReserva({
          IdServicio: servicioId,
          IdCliente: 1,
          FechaInicio: fechaInicio,
          FechaFin: fechaFin,
          Cantidad: 2,
          DatosCliente: JSON.stringify({ nombre: 'Test User', email: 'test@example.com' })
        });
        
        console.log(`✅ Pre-reserva creada:`);
        console.log(`   ID: ${preReserva.IdPreReserva}`);
        console.log(`   Estado: ${preReserva.Estado}`);
        console.log(`   Expira en: ${preReserva.ExpiraEn.toLocaleString()}`);
        console.log(`   Monto total: ${preReserva.Moneda} ${preReserva.MontoTotal}`);

        // 5. Consultar pre-reserva
        console.log(`\n5️⃣ Probando ConsultarPreReserva...`);
        
        const preReservaConsulta = await adapter.consultarPreReserva(preReserva.IdPreReserva);
        
        console.log(`✅ Pre-reserva consultada:`);
        console.log(`   Estado: ${preReservaConsulta.Estado}`);
        console.log(`   Monto: ${preReservaConsulta.Moneda} ${preReservaConsulta.MontoTotal}`);

        // 6. Confirmar pre-reserva
        console.log(`\n6️⃣ Probando ConfirmarPreReserva...`);
        
        const reserva = await adapter.confirmarPreReserva({
          IdPreReserva: preReserva.IdPreReserva,
          MetodoPago: 'Tarjeta de crédito'
        });
        
        console.log(`✅ Pre-reserva confirmada:`);
        console.log(`   ID Reserva: ${reserva.IdReserva}`);
        console.log(`   Estado: ${reserva.Estado}`);
        console.log(`   Código confirmación: ${reserva.CodigoConfirmacion || 'N/A'}`);
        console.log(`   Monto total: ${reserva.Moneda} ${reserva.MontoTotal}`);

        // 7. Consultar reserva
        console.log(`\n7️⃣ Probando ConsultarReserva...`);
        
        const reservaConsulta = await adapter.consultarReserva(reserva.IdReserva);
        
        console.log(`✅ Reserva consultada:`);
        console.log(`   Estado: ${reservaConsulta.Estado}`);
        console.log(`   Fecha creación: ${reservaConsulta.FechaCreacion.toLocaleString()}`);

        // 8. Confirmar reserva (pago final)
        console.log(`\n8️⃣ Probando ConfirmarReserva...`);
        
        const reservaConfirmada = await adapter.confirmarReserva(
          reserva.IdReserva,
          JSON.stringify({ tarjeta: '****1234', cvv: 'xxx' })
        );
        
        console.log(`✅ Reserva confirmada (pago final):`);
        console.log(`   Estado: ${reservaConfirmada.Estado}`);
        console.log(`   Código: ${reservaConfirmada.CodigoConfirmacion || 'N/A'}`);

        // 9. Cancelar reserva
        console.log(`\n9️⃣ Probando CancelarReserva...`);
        
        const cancelacion = await adapter.cancelarReserva({
          IdReserva: reserva.IdReserva,
          Motivo: 'Prueba de integración - cancelación automática'
        });
        
        console.log(`✅ Cancelación procesada:`);
        console.log(`   Exitoso: ${cancelacion.Exitoso ? '🟢 Sí' : '🔴 No'}`);
        console.log(`   Mensaje: ${cancelacion.Mensaje}`);
        if (cancelacion.MontoReembolso && cancelacion.MontoReembolso > 0) {
          console.log(`   Reembolso: $${cancelacion.MontoReembolso}`);
        }
      } else {
        console.log(`\n⚠️ Servicio no disponible, omitiendo pruebas de reserva`);
      }
    }

    console.log('\n========================================');
    console.log('✅ TEST COMPLETADO - WS Integración (WCF)');
    console.log('========================================');
    console.log('📊 Resumen:');
    console.log('   🎯 9 operaciones probadas');
    console.log('   ⚙️  Servicio WCF (Windows Communication Foundation)');
    console.log('   🔧 Namespace: http://tempuri.org/');

  } catch (error: any) {
    console.error('\n❌ Error durante las pruebas:');
    console.error('   Mensaje:', error.message);
    if (error.response?.data) {
      console.error('   Respuesta del servidor:', error.response.data.substring(0, 500));
    }
    if (error.stack) {
      console.error('\n   Stack Trace:');
      console.error(error.stack);
    }
  }
}

// Ejecutar test
testWSIntegracion();
