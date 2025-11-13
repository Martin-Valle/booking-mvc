/**
 * ESB - DAL - Índice de Repositorios
 * Punto de acceso centralizado a todos los repositorios
 */

export { BaseRepository, type IRepository } from './base.repository';
export { UsuarioRepository, usuarioRepository } from './usuario.repository';
export { ReservaRepository, reservaRepository } from './reserva.repository';
export { DetalleReservaRepository, detalleReservaRepository } from './detalle-reserva.repository';
export { PagoRepository, pagoRepository } from './pago.repository';
export { ServicioRepository, servicioRepository } from './servicio.repository';
export { PreReservaRepository, preReservaRepository } from './pre-reserva.repository';
