/**
 * ESB - BLL - Servicio de Pagos
 * Lógica de negocio para procesamiento de pagos
 */

import { pagoRepository, reservaRepository } from '../dal';
import type { Pago } from '../models/entities';
import { ESBLogger } from '../utils/soap-utils';

const logger = ESBLogger.getInstance();

export class PagoService {
  async obtenerPagos(idReserva?: string): Promise<Pago[]> {
    logger.info('Obteniendo pagos', { idReserva });
    
    if (idReserva) {
      return pagoRepository.findByReserva(idReserva);
    }
    
    return pagoRepository.findAll();
  }

  async obtenerPagoPorId(idPago: string): Promise<Pago> {
    logger.info(`Obteniendo pago ${idPago}`);
    
    const pago = await pagoRepository.findById(idPago);
    if (!pago) {
      throw new Error(`Pago con ID ${idPago} no encontrado`);
    }
    
    return pago;
  }

  async crearPago(pago: Pago): Promise<string> {
    logger.info('Creando nuevo pago', { idReserva: pago.idReserva });

    // Validaciones
    if (!pago.idReserva) {
      throw new Error('El ID de reserva es requerido');
    }

    if (pago.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }

    // Verificar que la reserva exista
    const reserva = await reservaRepository.findById(pago.idReserva);
    if (!reserva) {
      throw new Error(`Reserva con ID ${pago.idReserva} no encontrada`);
    }

    // No permitir pagos en reservas canceladas
    if (reserva.estado === 'CANCELADA') {
      throw new Error('No se pueden procesar pagos para reservas canceladas');
    }

    const nuevoPago: Pago = {
      ...pago,
      fechaPago: new Date(),
      estado: 'PENDIENTE'
    };

    // Simular procesamiento de pago
    const procesado = await this.procesarPago(nuevoPago);
    
    const creado = await pagoRepository.create(procesado);
    logger.info(`Pago creado exitosamente: ${creado.idPago}`);
    
    return creado.idPago!;
  }

  async actualizarPago(idPago: string, pago: Partial<Pago>): Promise<Pago> {
    logger.info(`Actualizando pago ${idPago}`);

    const existente = await pagoRepository.findById(idPago);
    if (!existente) {
      throw new Error(`Pago con ID ${idPago} no encontrado`);
    }

    return pagoRepository.update(idPago, pago);
  }

  async eliminarPago(idPago: string): Promise<boolean> {
    logger.info(`Eliminando pago ${idPago}`);

    const pago = await pagoRepository.findById(idPago);
    if (!pago) {
      throw new Error(`Pago con ID ${idPago} no encontrado`);
    }

    // Solo permitir eliminar pagos pendientes o rechazados
    if (pago.estado === 'CAPTURADO' || pago.estado === 'AUTORIZADO') {
      throw new Error('No se puede eliminar un pago autorizado o capturado. Use reembolso en su lugar');
    }

    return pagoRepository.delete(idPago);
  }

  async capturarPago(idPago: string): Promise<Pago> {
    logger.info(`Capturando pago ${idPago}`);

    const pago = await pagoRepository.findById(idPago);
    if (!pago) {
      throw new Error(`Pago con ID ${idPago} no encontrado`);
    }

    if (pago.estado !== 'AUTORIZADO') {
      throw new Error('Solo se pueden capturar pagos autorizados');
    }

    return pagoRepository.update(idPago, { estado: 'CAPTURADO' });
  }

  async reembolsarPago(idPago: string): Promise<Pago> {
    logger.info(`Reembolsando pago ${idPago}`);

    const pago = await pagoRepository.findById(idPago);
    if (!pago) {
      throw new Error(`Pago con ID ${idPago} no encontrado`);
    }

    if (pago.estado !== 'CAPTURADO') {
      throw new Error('Solo se pueden reembolsar pagos capturados');
    }

    return pagoRepository.update(idPago, { estado: 'REEMBOLSADO' });
  }

  /**
   * Simula el procesamiento de pago con un gateway externo
   * En producción, aquí se integraría con Stripe, PayPal, etc.
   */
  private async procesarPago(pago: Pago): Promise<Pago> {
    logger.info('Procesando pago con gateway externo');

    // Simulación de procesamiento
    const exito = Math.random() > 0.1; // 90% de éxito

    if (exito) {
      return {
        ...pago,
        estado: 'AUTORIZADO',
        transaccionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        ...pago,
        estado: 'RECHAZADO',
        metadata: {
          ...pago.metadata,
          errorCode: 'INSUFFICIENT_FUNDS',
          errorMessage: 'Fondos insuficientes'
        }
      };
    }
  }

  async calcularTotalPagado(idReserva: string): Promise<number> {
    return pagoRepository.calcularTotalPagado(idReserva);
  }
}

export const pagoService = new PagoService();
