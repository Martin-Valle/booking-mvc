/**
 * ESB - DAL - Repositorio de Detalles de Reserva
 */

import { BaseRepository } from './base.repository';
import type { DetalleReserva } from '../models/entities';

export class DetalleReservaRepository extends BaseRepository<DetalleReserva> {
  constructor() {
    super(
      'idDetalle',
      'detalle_reserva',
      ['idDetalle','idReserva','tipoServicio','idServicio','cantidad','precioUnitario','subtotal','fechaInicio','fechaFin','noches','dias','tramos']
    );
  }

  async findByReserva(idReserva: string): Promise<DetalleReserva[]> {
    return this.findByField('idReserva', idReserva);
  }

  async findByTipoServicio(tipoServicio: 'hotel' | 'car' | 'flight' | 'restaurant' | 'package'): Promise<DetalleReserva[]> {
    return this.findByField('tipoServicio', tipoServicio);
  }

  async calcularTotalReserva(idReserva: string): Promise<number> {
    const detalles = await this.findByReserva(idReserva);
    return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  }
}

export const detalleReservaRepository = new DetalleReservaRepository();
