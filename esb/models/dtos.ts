/**
 * ESB - DTOs para Requests y Responses SOAP
 */

import type {
  Usuario, TipoServicio, ImagenServicio,
  Reserva, DetalleReserva, Pago, PreReserva, Cotizacion, Servicio
} from './entities';

// ==================== FILTROS DE BÚSQUEDA ====================
export interface FiltrosBusqueda {
  serviceType?: ('hotel' | 'car' | 'flight' | 'restaurant' | 'package')[];
  ciudad?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  precioMin?: number;
  precioMax?: number;
  amenities?: string[];
  clasificacion?: number; // rating mínimo
  adults?: number;
  children?: number;
}

// ==================== USUARIO SOAP APIs ====================
export interface ObtenerUsuariosRequest {}
export interface ObtenerUsuariosResponse {
  usuarios: Usuario[];
}

export interface ObtenerUsuarioPorIdRequest {
  idUsuario: string;
}
export interface ObtenerUsuarioPorIdResponse {
  usuario: Usuario;
}

export interface CrearUsuarioRequest {
  usuario: Usuario;
}
export interface CrearUsuarioResponse {
  usuario: Usuario;
}

export interface ActualizarUsuarioRequest {
  idUsuario: string;
  usuario: Usuario;
}
export interface ActualizarUsuarioResponse {
  usuario: Usuario;
}

export interface EliminarUsuarioRequest {
  idUsuario: string;
}
export interface EliminarUsuarioResponse {
  success: boolean;
}

// ==================== TIPO SERVICIO SOAP APIs ====================
export interface ObtenerTiposServicioRequest {}
export interface ObtenerTiposServicioResponse {
  tipos: TipoServicio[];
}

export interface CrearTipoServicioRequest {
  tipo: TipoServicio;
}
export interface CrearTipoServicioResponse {
  id: string;
}

// ==================== IMÁGENES SOAP APIs ====================
export interface ObtenerImagenesServicioRequest {
  idServicio: string;
}
export interface ObtenerImagenesServicioResponse {
  imagenes: ImagenServicio[];
}

export interface AgregarImagenServicioRequest {
  imagen: ImagenServicio;
}
export interface AgregarImagenServicioResponse {
  id: string;
}

// ==================== RESERVA SOAP APIs ====================
export interface ObtenerReservasRequest {
  idUsuario?: string;
}
export interface ObtenerReservasResponse {
  reservas: Reserva[];
}

export interface ObtenerReservaPorIdRequest {
  idReserva: string;
}
export interface ObtenerReservaPorIdResponse {
  reserva: Reserva;
}

export interface CrearReservaRequest {
  reserva: Reserva;
}
export interface CrearReservaResponse {
  id: string;
}

export interface ActualizarReservaRequest {
  id: string;
  reserva: Partial<Reserva>;
}
export interface ActualizarReservaResponse {
  reserva: Reserva;
}

export interface CancelarReservaRequest {
  id: string;
}
export interface CancelarReservaResponse {
  success: boolean;
}

// ==================== DETALLE RESERVA SOAP APIs ====================
export interface ObtenerDetallesReservaRequest {
  idReserva: string;
}
export interface ObtenerDetallesReservaResponse {
  detalles: DetalleReserva[];
}

// ==================== PAGO SOAP APIs ====================
export interface ObtenerPagosRequest {
  idReserva?: string;
}
export interface ObtenerPagosResponse {
  pagos: Pago[];
}

export interface CrearPagoRequest {
  pago: Pago;
}
export interface CrearPagoResponse {
  id: string;
}

// ==================== INTEGRACIÓN EXTERNA ====================
export interface BuscarServiciosRequest {
  filtros: FiltrosBusqueda;
}
export interface BuscarServiciosResponse {
  servicios: Servicio[];
}

export interface ObtenerDetalleServicioRequest {
  idServicio: string;
  serviceType: 'hotel' | 'car' | 'flight' | 'restaurant' | 'package';
}
export interface ObtenerDetalleServicioResponse {
  servicio: Servicio;
}

export interface VerificarDisponibilidadRequest {
  sku: string;
  inicio: Date;
  fin: Date;
  unidades: number;
}
export interface VerificarDisponibilidadResponse {
  disponible: boolean;
  mensaje?: string;
}

export interface CotizarReservaRequest {
  items: DetalleReserva[];
}
export interface CotizarReservaResponse {
  cotizacion: Cotizacion;
}

export interface CrearPreReservaRequest {
  itinerario: DetalleReserva[];
  cliente: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  holdMinutes?: number;
  idemKey?: string;
}
export interface CrearPreReservaResponse {
  preReserva: PreReserva;
}

export interface ConfirmarReservaRequest {
  preBookingId: string;
  metodoPago: string;
  datosPago: Record<string, any>;
}
export interface ConfirmarReservaResponse {
  reserva: Reserva;
}

export interface CancelarReservaIntegracionRequest {
  bookingId: string;
  motivo: string;
}
export interface CancelarReservaIntegracionResponse {
  success: boolean;
  mensaje?: string;
}

// ==================== RESPONSE GENÉRICO ====================
export interface SoapResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
