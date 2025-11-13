/**
 * ESB - BLL - Servicio de Reservas
 * Lógica de negocio para gestión de reservas
 */

import { reservaRepository, detalleReservaRepository, pagoRepository } from '../dal';
import type { Reserva, DetalleReserva } from '../models/entities';
import { ESBLogger } from '../utils/soap-utils';

const logger = ESBLogger.getInstance();

export class ReservaService {
  async obtenerReservas(idUsuario?: string): Promise<Reserva[]> {
    logger.info('Obteniendo reservas', { idUsuario });
    
    if (idUsuario) {
      return reservaRepository.findByUsuario(idUsuario);
    }
    
    return reservaRepository.findAll();
  }

  async obtenerReservaPorId(idReserva: string): Promise<Reserva> {
    logger.info(`Obteniendo reserva ${idReserva}`);
    
    const reserva = await reservaRepository.findById(idReserva);
    if (!reserva) {
      throw new Error(`Reserva con ID ${idReserva} no encontrada`);
    }

    // Cargar detalles
    const detalles = await detalleReservaRepository.findByReserva(idReserva);
    reserva.detalles = detalles;

    // Cargar pagos
    const pagos = await pagoRepository.findByReserva(idReserva);
    reserva.pagos = pagos;

    return reserva;
  }

  async crearReserva(reserva: Reserva): Promise<string> {
    logger.info('Creando nueva reserva', { idUsuario: reserva.idUsuario });

    // Validaciones
    if (!reserva.idUsuario) {
      throw new Error('El ID de usuario es requerido');
    }

    if (!reserva.detalles || reserva.detalles.length === 0) {
      throw new Error('La reserva debe tener al menos un detalle');
    }

    // Calcular total
    const total = reserva.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);

    const nuevaReserva: Reserva = {
      ...reserva,
      fechaReserva: new Date(),
      estado: 'PENDIENTE',
      totalPrice: total
    };

    const creada = await reservaRepository.create(nuevaReserva);
    const idReserva = creada.idReserva!;

    // Crear detalles
    for (const detalle of reserva.detalles) {
      await detalleReservaRepository.create({
        ...detalle,
        idReserva
      });
    }

    logger.info(`Reserva creada exitosamente: ${idReserva}`);
    return idReserva;
  }

  async actualizarReserva(id: string, reserva: Partial<Reserva>): Promise<Reserva> {
    logger.info(`Actualizando reserva ${id}`);

    const existente = await reservaRepository.findById(id);
    if (!existente) {
      throw new Error(`Reserva con ID ${id} no encontrada`);
    }

    // No permitir actualizar reservas confirmadas o completadas
    if (existente.estado === 'CONFIRMADA' || existente.estado === 'COMPLETADA') {
      throw new Error(`No se puede modificar una reserva en estado ${existente.estado}`);
    }

    return reservaRepository.update(id, reserva);
  }

  async cancelarReserva(id: string): Promise<boolean> {
    logger.info(`Cancelando reserva ${id}`);

    const reserva = await reservaRepository.findById(id);
    if (!reserva) {
      throw new Error(`Reserva con ID ${id} no encontrada`);
    }

    if (reserva.estado === 'CANCELADA') {
      throw new Error('La reserva ya está cancelada');
    }

    if (reserva.estado === 'COMPLETADA') {
      throw new Error('No se puede cancelar una reserva completada');
    }

    await reservaRepository.update(id, { estado: 'CANCELADA' });
    logger.info(`Reserva ${id} cancelada exitosamente`);
    return true;
  }

  async confirmarReserva(id: string): Promise<Reserva> {
    logger.info(`Confirmando reserva ${id}`);

    const reserva = await reservaRepository.findById(id);
    if (!reserva) {
      throw new Error(`Reserva con ID ${id} no encontrada`);
    }

    if (reserva.estado !== 'PENDIENTE') {
      throw new Error(`Solo se pueden confirmar reservas en estado PENDIENTE`);
    }

    // Verificar que haya al menos un pago autorizado o capturado
    const pagos = await pagoRepository.findByReserva(id);
    const totalPagado = pagos
      .filter(p => p.estado === 'AUTORIZADO' || p.estado === 'CAPTURADO')
      .reduce((sum, p) => sum + p.monto, 0);

    if (totalPagado < reserva.totalPrice) {
      throw new Error('El monto pagado es insuficiente para confirmar la reserva');
    }

    return reservaRepository.update(id, { estado: 'CONFIRMADA' });
  }

  async obtenerDetallesReserva(idReserva: string): Promise<DetalleReserva[]> {
    logger.info(`Obteniendo detalles de reserva ${idReserva}`);
    return detalleReservaRepository.findByReserva(idReserva);
  }

  async agregarDetalleReserva(detalle: DetalleReserva): Promise<string> {
    logger.info('Agregando detalle a reserva', { idReserva: detalle.idReserva });

    const reserva = await reservaRepository.findById(detalle.idReserva);
    if (!reserva) {
      throw new Error(`Reserva con ID ${detalle.idReserva} no encontrada`);
    }

    if (reserva.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden agregar detalles a reservas pendientes');
    }

    // Calcular subtotal
    const detalleCompleto: DetalleReserva = {
      ...detalle,
      subtotal: detalle.precioUnitario * detalle.cantidad
    };

    const creado = await detalleReservaRepository.create(detalleCompleto);

    // Actualizar total de reserva
    const nuevoTotal = await detalleReservaRepository.calcularTotalReserva(detalle.idReserva);
    await reservaRepository.update(detalle.idReserva, { totalPrice: nuevoTotal });

    return creado.idDetalle!;
  }

  async eliminarDetalleReserva(idDetalle: string): Promise<boolean> {
    logger.info(`Eliminando detalle ${idDetalle}`);

    const detalle = await detalleReservaRepository.findById(idDetalle);
    if (!detalle) {
      throw new Error(`Detalle con ID ${idDetalle} no encontrado`);
    }

    const reserva = await reservaRepository.findById(detalle.idReserva);
    if (reserva && reserva.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden eliminar detalles de reservas pendientes');
    }

    await detalleReservaRepository.delete(idDetalle);

    // Actualizar total de reserva
    if (reserva) {
      const nuevoTotal = await detalleReservaRepository.calcularTotalReserva(detalle.idReserva);
      await reservaRepository.update(detalle.idReserva, { totalPrice: nuevoTotal });
    }

    return true;
  }
}

export const reservaService = new ReservaService();
