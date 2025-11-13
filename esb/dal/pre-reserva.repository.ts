/**
 * ESB - DAL - Repositorio de Pre-Reservas
 */

import { BaseRepository } from './base.repository';
import type { PreReserva } from '../models/entities';

export class PreReservaRepository extends BaseRepository<PreReserva> {
  constructor() {
    super(
      'preBookingId',
      'pre_reserva',
      ['preBookingId','itinerario','cliente','holdMinutes','expiraEn','idemKey','estado']
    );
  }

  async findByEstado(estado: 'BLOQUEADO' | 'EXPIRADO' | 'CONFIRMADO'): Promise<PreReserva[]> {
    return this.findByField('estado', estado);
  }

  async findExpiradas(): Promise<PreReserva[]> {
    const preReservas = await this.findAll();
    const ahora = new Date();
    return preReservas.filter(pr => new Date(pr.expiraEn) < ahora && pr.estado === 'BLOQUEADO');
  }

  async marcarExpiradas(): Promise<number> {
    const expiradas = await this.findExpiradas();
    for (const pr of expiradas) {
      await this.update(pr.preBookingId!, { estado: 'EXPIRADO' });
    }
    return expiradas.length;
  }

  async findByIdemKey(idemKey: string): Promise<PreReserva | null> {
    const preReservas = await this.findAll();
    return preReservas.find(pr => pr.idemKey === idemKey) || null;
  }
}

export const preReservaRepository = new PreReservaRepository();
