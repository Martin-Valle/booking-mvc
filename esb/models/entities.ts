/**
 * ESB - Modelos de Entidades
 * Basado en la especificación de APIs SOAP para integración
 */

// ==================== USUARIO ====================
export interface Usuario {
  idUsuario?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaRegistro?: Date;
  activo: boolean;
}

// ==================== TIPO DE SERVICIO ====================
export interface TipoServicio {
  id?: string;
  nombre: string;
  subtipo?: string;
  descripcion?: string;
  activo: boolean;
}

// ==================== IMAGEN SERVICIO ====================
export interface ImagenServicio {
  idImagen?: string;
  idServicio: string;
  url: string;
  descripcion?: string;
  orden?: number;
}

// ==================== HOTEL/ROOM ====================
export interface Hotel {
  hotelId?: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  roomType: 'Standard' | 'Deluxe' | 'Suite' | 'Executive' | 'Presidential';
  numberBeds: number;
  occupancy: {
    adults: number;
    children: number;
  };
  board: 'BB' | 'MP' | 'AI' | 'RO'; // Bed & Breakfast, Media Pensión, All Inclusive, Room Only
  checkIn: Date;
  checkOut: Date;
  amenities: string[]; // Wi-Fi, TV, aire acondicionado, etc.
  breakfastIncluded: boolean;
  pricePerNight: number;
  currency: string;
  rating?: number; // estrellas del hotel
  photos?: string[];
}

// ==================== CAR/VEHICLE ====================
export interface Car {
  carId?: string;
  agencyId: string;
  agencyName?: string;
  city: string;
  hotel?: string;
  marca: string;
  modelo: string;
  category: 'economy' | 'suv' | 'luxury' | 'van' | 'sport';
  gearbox: 'AT' | 'MT'; // Automático o Manual
  pickupOffice: string;
  dropoffOffice: string;
  pickupAt: Date;
  dropoffAt: Date;
  driverAge: number;
  pricePerDay: number;
  currency: string;
  photo?: string;
}

// ==================== RESTAURANT ====================
export interface Restaurant {
  restaurantId?: string;
  name: string;
  cuisineType: string; // italiana, japonesa, ecuatoriana, etc.
  location: string;
  tableType: 'indoor' | 'outdoor';
  reservationDate: Date;
  reservationTime: string;
  status: 'disponible' | 'ocupado' | 'reservado';
  priceRange: string; // $, $$, $$$
  rating?: number;
  amenities?: string[];
}

// ==================== FLIGHT/LEG ====================
export interface Flight {
  flightId?: string;
  origin: string; // Código IATA
  destination: string; // Código IATA
  airline: string;
  flightNumber: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: string; // formato HH:MM
  cancellationPolicy: string;
  cabinClass: 'Economy' | 'Business' | 'First';
  seatType: 'window' | 'aisle' | 'middle';
  price: number;
  currency: string;
  availableSeats?: number;
}

// ==================== PACKAGE/BUNDLE ====================
export interface Package {
  packageId?: string;
  packageName: string;
  includedServices: {
    HOTEL?: string[];
    FLIGHT?: string[];
    CAR?: string[];
    RESTAURANT?: string[];
  };
  durationDays: number;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  currency: string;
  agencyName: string;
  cancellationPolicy: string;
  highlights: string[];
  description: string;
}

// ==================== RESERVA ====================
export interface Reserva {
  idReserva?: string;
  idUsuario: string;
  fechaReserva: Date;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';
  totalPrice: number;
  currency: string;
  detalles: DetalleReserva[];
  pagos?: Pago[];
}

export interface DetalleReserva {
  idDetalle?: string;
  idReserva: string;
  tipoServicio: 'hotel' | 'car' | 'flight' | 'restaurant' | 'package';
  idServicio: string; // ID del hotel, car, flight, etc.
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  noches?: number; // para hoteles
  dias?: number; // para autos
  tramos?: number; // para vuelos
}

// ==================== PAGO ====================
export interface Pago {
  idPago?: string;
  idReserva: string;
  monto: number;
  currency: string;
  metodoPago: 'tarjeta' | 'transferencia' | 'efectivo' | 'paypal';
  estado: 'PENDIENTE' | 'AUTORIZADO' | 'CAPTURADO' | 'RECHAZADO' | 'REEMBOLSADO';
  fechaPago: Date;
  transaccionId?: string;
  metadata?: Record<string, any>;
}

// ==================== PRE-RESERVA ====================
export interface PreReserva {
  preBookingId?: string;
  itinerario: DetalleReserva[];
  cliente: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  holdMinutes: number; // tiempo de bloqueo
  expiraEn: Date;
  idemKey?: string; // para idempotencia
  estado: 'BLOQUEADO' | 'EXPIRADO' | 'CONFIRMADO';
}

// ==================== COTIZACIÓN ====================
export interface Cotizacion {
  total: number;
  currency: string;
  breakdown: {
    subtotal: number;
    impuestos: number;
    fees: number;
    descuentos?: number;
  };
  items: DetalleReserva[];
}

// ==================== SERVICIO GENÉRICO ====================
export interface Servicio {
  idServicio?: string;
  serviceType: 'hotel' | 'car' | 'flight' | 'restaurant' | 'package';
  nombre: string;
  descripcion?: string;
  ciudad?: string;
  precio: number;
  currency: string;
  rating?: number;
  amenities?: string[];
  clasificacion?: string;
  fotos?: string[];
  politicas?: string;
  disponible: boolean;
  datosEspecificos?: Hotel | Car | Flight | Restaurant | Package;
}
