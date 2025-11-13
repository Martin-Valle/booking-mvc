/**
 * ESB - DAL - Repositorio de Reservas
 */

import { BaseRepository } from './base.repository';
import type { Reserva } from '../models/entities';

export class ReservaRepository extends BaseRepository<Reserva> {
  constructor() {
    super(
      'idReserva',
      'reserva',
      ['idReserva','idUsuario','fechaReserva','estado','totalPrice','currency'] // OJO: sin 'detalles' ni 'pagos'
    );
  }

  async findByUsuario(idUsuario: string): Promise<Reserva[]> {
    return this.findByField('idUsuario', idUsuario);
  }

  async findByEstado(estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA'): Promise<Reserva[]> {
    return this.findByField('estado', estado);
  }

  async findPendientes(): Promise<Reserva[]> {
    return this.findByEstado('PENDIENTE');
  }

  async findConfirmadas(): Promise<Reserva[]> {
    return this.findByEstado('CONFIRMADA');
  }
}

export const reservaRepository = new ReservaRepository();
