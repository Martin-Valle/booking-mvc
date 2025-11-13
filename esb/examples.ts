/**
 * Ejemplo de Integración del ESB con el Frontend
 * 
 * Este archivo muestra cómo usar el ESB desde tu aplicación booking-mvc
 */

import ESB from '../esb';
import type { FiltrosBusqueda, Servicio } from '../esb';

// ==================== EJEMPLO 1: Búsqueda de Servicios ====================

export async function buscarServiciosEjemplo() {
  try {
    const filtros: FiltrosBusqueda = {
      serviceType: ['hotel', 'flight', 'car'],
      ciudad: 'Quito',
      fechaInicio: new Date('2025-12-01'),
      fechaFin: new Date('2025-12-10'),
      adults: 2,
      children: 0,
      precioMin: 50,
      precioMax: 500,
      clasificacion: 4 // mínimo 4 estrellas
    };

    console.log('Buscando servicios...', filtros);
    const servicios = await ESB.buscarServicios(filtros);
    
    console.log(`✅ Encontrados ${servicios.length} servicios`);
    servicios.forEach(s => {
      console.log(`- ${s.nombre} (${s.serviceType}): $${s.precio} ${s.currency}`);
    });
    
    return servicios;
  } catch (error) {
    console.error('❌ Error al buscar servicios:', error);
    throw error;
  }
}

// ==================== EJEMPLO 2: Flujo Completo de Reserva ====================

export async function flujoReservaCompleto() {
  try {
    // 1. Buscar hoteles
    console.log('🔍 Paso 1: Buscando hoteles...');
    const hoteles = await ESB.buscarServicios({
      serviceType: ['hotel'],
      ciudad: 'Quito',
      fechaInicio: new Date('2025-12-15'),
      fechaFin: new Date('2025-12-20'),
      adults: 2,
      precioMax: 200
    });

    if (hoteles.length === 0) {
      throw new Error('No se encontraron hoteles disponibles');
    }

    const hotelSeleccionado = hoteles[0];
    console.log(`✅ Hotel seleccionado: ${hotelSeleccionado.nombre}`);

    // 2. Obtener detalle del hotel
    console.log('📋 Paso 2: Obteniendo detalles del hotel...');
    const detalle = await ESB.obtenerDetalleServicio(
      hotelSeleccionado.idServicio!,
      'hotel'
    );
    console.log(`✅ Detalles: ${detalle.descripcion}`);

    // 3. Verificar disponibilidad
    console.log('✓ Paso 3: Verificando disponibilidad...');
    const disponible = await ESB.verificarDisponibilidad(
      hotelSeleccionado.idServicio!,
      'hotel',
      new Date('2025-12-15'),
      new Date('2025-12-20'),
      1
    );

    if (!disponible) {
      throw new Error('El hotel no tiene disponibilidad');
    }
    console.log('✅ Hotel disponible');

    // 4. Crear itinerario
    const itinerario = [{
      idReserva: '',
      tipoServicio: 'hotel' as const,
      idServicio: hotelSeleccionado.idServicio!,
      cantidad: 1,
      precioUnitario: hotelSeleccionado.precio,
      subtotal: hotelSeleccionado.precio * 5, // 5 noches
      noches: 5
    }];

    // 5. Cotizar
    console.log('💰 Paso 4: Cotizando reserva...');
    const cotizacion = await ESB.cotizarReserva(itinerario);
    console.log(`✅ Total: $${cotizacion.total} ${cotizacion.currency}`);
    console.log(`   Subtotal: $${cotizacion.breakdown.subtotal}`);
    console.log(`   Impuestos: $${cotizacion.breakdown.impuestos}`);
    console.log(`   Fees: $${cotizacion.breakdown.fees}`);

    // 6. Crear pre-reserva
    console.log('🔒 Paso 5: Creando pre-reserva...');
    const preReserva = await ESB.crearPreReserva(
      itinerario,
      {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '+593 99 999 9999'
      },
      30, // 30 minutos de espera
      `idem-${Date.now()}` // Key de idempotencia
    );
    console.log(`✅ Pre-reserva creada: ${preReserva.preBookingId}`);
    console.log(`   Expira: ${preReserva.expiraEn}`);

    // 7. Confirmar reserva (simular pago)
    console.log('💳 Paso 6: Confirmando reserva...');
    const reservaConfirmada = await ESB.confirmarReserva(
      preReserva.preBookingId!,
      'tarjeta',
      {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiry: '12/26'
      }
    );
    console.log(`✅ Reserva confirmada: ${reservaConfirmada.idReserva}`);

    return reservaConfirmada;
  } catch (error) {
    console.error('❌ Error en el flujo de reserva:', error);
    throw error;
  }
}

// ==================== EJEMPLO 3: Gestión de Usuarios ====================

export async function gestionUsuariosEjemplo() {
  try {
    // Crear usuario
    console.log('👤 Creando usuario...');
    const nuevoUsuario = await ESB.usuarios.crear({
      nombre: 'María',
      apellido: 'González',
      email: 'maria@example.com',
      telefono: '+593 98 888 8888',
      activo: true
    });
    console.log(`✅ Usuario creado: ${nuevoUsuario.idUsuario}`);

    // Obtener todos los usuarios
    const usuarios = await ESB.usuarios.obtenerTodos();
    console.log(`✅ Total de usuarios: ${usuarios.length}`);

    // Actualizar usuario
    await ESB.usuarios.actualizar(nuevoUsuario.idUsuario!, {
      telefono: '+593 98 777 7777'
    });
    console.log('✅ Usuario actualizado');

    return nuevoUsuario;
  } catch (error) {
    console.error('❌ Error en gestión de usuarios:', error);
    throw error;
  }
}

// ==================== EJEMPLO 4: Procesamiento de Pagos ====================

export async function procesoPagoEjemplo(idReserva: string) {
  try {
    // Crear pago
    console.log('💳 Creando pago...');
    const idPago = await ESB.pagos.crear({
      idReserva,
      monto: 500,
      currency: 'USD',
      metodoPago: 'tarjeta',
      estado: 'PENDIENTE',
      fechaPago: new Date()
    });
    console.log(`✅ Pago creado: ${idPago}`);

    // Capturar pago (después de autorización)
    console.log('💰 Capturando pago...');
    const pagoCaptured = await ESB.pagos.capturar(idPago);
    console.log(`✅ Pago capturado: ${pagoCaptured.estado}`);

    // Calcular total pagado
    const totalPagado = await ESB.pagos.calcularTotalPagado(idReserva);
    console.log(`✅ Total pagado para reserva: $${totalPagado}`);

    return pagoCaptured;
  } catch (error) {
    console.error('❌ Error en procesamiento de pago:', error);
    throw error;
  }
}

// ==================== EJEMPLO 5: Cancelación de Reserva ====================

export async function cancelarReservaEjemplo(idReserva: string) {
  try {
    console.log(`🚫 Cancelando reserva ${idReserva}...`);
    
    const exito = await ESB.cancelarReserva(
      idReserva,
      'Cliente solicitó cancelación'
    );

    if (exito) {
      console.log('✅ Reserva cancelada exitosamente');
    } else {
      console.log('⚠️ No se pudo cancelar la reserva');
    }

    return exito;
  } catch (error) {
    console.error('❌ Error al cancelar reserva:', error);
    throw error;
  }
}

// ==================== EJEMPLO 6: Integración con Componentes Existentes ====================

/**
 * Adaptador para usar ESB con los componentes existentes de booking-mvc
 */
export class ESBFrontendAdapter {
  
  /**
   * Convierte servicios del ESB al formato esperado por ResultCard
   */
  static convertirAResultados(servicios: Servicio[]): any[] {
    return servicios.map(s => {
      if (s.serviceType === 'hotel') {
        const hotel = s.datosEspecificos as any;
        return {
          kind: 'hotel',
          item: {
            id: s.idServicio,
            name: s.nombre,
            city: s.ciudad || '',
            price: s.precio,
            rating: s.rating || 0,
            photo: s.fotos?.[0] || '/default-hotel.jpg'
          }
        };
      } else if (s.serviceType === 'flight') {
        const flight = s.datosEspecificos as any;
        return {
          kind: 'flight',
          item: {
            id: s.idServicio,
            from: flight.origin,
            to: flight.destination,
            date: flight.departureTime,
            price: s.precio,
            airline: flight.airline
          }
        };
      } else if (s.serviceType === 'car') {
        const car = s.datosEspecificos as any;
        return {
          kind: 'car',
          item: {
            id: s.idServicio,
            brand: car.marca,
            model: car.modelo,
            pricePerDay: s.precio,
            photo: s.fotos?.[0] || '/default-car.jpg'
          }
        };
      }
    }).filter(Boolean);
  }

  /**
   * Busca servicios y los convierte al formato del frontend
   */
  static async buscarYConvertir(filtros: FiltrosBusqueda) {
    const servicios = await ESB.buscarServicios(filtros);
    return this.convertirAResultados(servicios);
  }
}

// ==================== EXPORTAR TODO ====================

export default {
  buscarServiciosEjemplo,
  flujoReservaCompleto,
  gestionUsuariosEjemplo,
  procesoPagoEjemplo,
  cancelarReservaEjemplo,
  ESBFrontendAdapter
};
