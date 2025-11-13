/**
 * ESB - DAL - Repositorio de Servicios (Hotel, Car, Flight, etc.)
 * Cache local de servicios obtenidos de APIs externas
 */

import { BaseRepository } from './base.repository';
import type { Servicio } from '../models/entities';

export class ServicioRepository extends BaseRepository<Servicio> {
  constructor() {
    super(
      'idServicio',
      'servicio',
      ['idServicio','serviceType','nombre','descripcion','ciudad','precio','currency','rating','amenities','clasificacion','fotos','politicas','disponible','datosEspecificos']
    );
  }

  async findByTipo(serviceType: 'hotel'|'car'|'flight'|'restaurant'|'package'): Promise<Servicio[]> {
    return this.findByField('serviceType', serviceType);
  }

  async findByCiudad(ciudad: string): Promise<Servicio[]> {
    const servicios = await this.findAll();
    return servicios.filter(s => s.ciudad?.toLowerCase().includes(ciudad.toLowerCase()));
  }

  async findByPrecioRange(min: number, max: number): Promise<Servicio[]> {
    const servicios = await this.findAll();
    return servicios.filter(s => s.precio >= min && s.precio <= max);
  }

  async findDisponibles(): Promise<Servicio[]> {
    const servicios = await this.findAll();
    return servicios.filter(s => s.disponible);
  }

  async buscarConFiltros(filtros: {
    serviceType?: string[];
    ciudad?: string;
    precioMin?: number;
    precioMax?: number;
    ratingMin?: number;
  }): Promise<Servicio[]> {
    let servicios = await this.findAll();

    if (filtros.serviceType && filtros.serviceType.length > 0) {
      servicios = servicios.filter(s => filtros.serviceType!.includes(s.serviceType));
    }

    if (filtros.ciudad) {
      servicios = servicios.filter(s => 
        s.ciudad?.toLowerCase().includes(filtros.ciudad!.toLowerCase())
      );
    }

    if (filtros.precioMin !== undefined) {
      servicios = servicios.filter(s => s.precio >= filtros.precioMin!);
    }

    if (filtros.precioMax !== undefined) {
      servicios = servicios.filter(s => s.precio <= filtros.precioMax!);
    }

    if (filtros.ratingMin !== undefined) {
      servicios = servicios.filter(s => (s.rating || 0) >= filtros.ratingMin!);
    }

    return servicios;
  }
}

export const servicioRepository = new ServicioRepository();
