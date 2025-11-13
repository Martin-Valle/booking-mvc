/**
 * ESB - DAL - Repositorio de Pagos
 */

import { BaseRepository } from './base.repository';
import type { Pago } from '../models/entities';

export class PagoRepository extends BaseRepository<Pago> {
  constructor() {
    super(
      'idPago',
      'pago',
      ['idPago','idReserva','monto','currency','metodoPago','estado','fechaPago','transaccionId','metadata']
    );
  }

  async findByReserva(idReserva: string) {
    return this.findByField('idReserva', idReserva);
  }

  async findByTransaccionId(transaccionId: string): Promise<Pago | null> {
    const pagos = await this.findByField('transaccionId', transaccionId);
    return pagos[0] ?? null;
  }

  async findByEstado(estado: 'PENDIENTE' | 'AUTORIZADO' | 'CAPTURADO' | 'RECHAZADO' | 'REEMBOLSADO'): Promise<Pago[]> {
    return this.findByField('estado', estado);
  }

  async calcularTotalPagado(idReserva: string): Promise<number> {
    const pagos = await this.findByReserva(idReserva);
    return pagos
      .filter(p => p.estado === 'CAPTURADO' || p.estado === 'AUTORIZADO')
      .reduce((t, p) => t + p.monto, 0);
  }
}

export const pagoRepository = new PagoRepository();
