/**
 * ESB - Enterprise Service Bus
 * Punto de entrada principal para integración con servicios SOAP
 * 
 * Arquitectura en capas:
 * - DAL (Data Access Layer): Repositorios y acceso a datos
 * - BLL (Business Logic Layer): Servicios con lógica de negocio
 * - Gateway: Adaptadores SOAP para servicios externos
 * - Orchestration: Orquestación y coordinación de servicios
 */

// Exportar modelos
export * from './models/entities';
export * from './models/dtos';

// Exportar utilidades
export * from './utils/soap-utils';
export * from './utils/config';

// Exportar repositorios (DAL)
export * from './dal';

// Exportar servicios de negocio (BLL)
export * from './bll';

// Exportar adaptadores SOAP (Gateway)
export * from './gateway';

// Exportar orquestador
export { ESBOrchestrator, esbOrchestrator } from './orchestration/orchestrator';

/**
 * API Principal del ESB
 * Esta es la interfaz recomendada para usar el ESB desde tu frontend
 */
import { esbOrchestrator } from './orchestration/orchestrator';
import { usuarioService, reservaService, pagoService } from './bll';
import { restaurantSoapAdapter } from './gateway';
import { CafeteriaSoapAdapter } from './gateway/cafeteria.adapter';
import { CuencaCarRentalSoapAdapter } from './gateway/cuenca-car.adapter';
import { SkyAndesFlightSoapAdapter } from './gateway/skyandes.adapter';
import { ElCangrejoFelizSoapAdapter } from './gateway/cangrejo-feliz.adapter';
import { SaborAndinoSoapAdapter } from './gateway/sabor-andino.adapter';
import { HotelBoutiqueSoapAdapter } from './gateway/hotel-boutique.adapter';
import { AutosRentCarSoapAdapter } from './gateway/autos-rentcar.adapter';
import { KM25MadridHotelSoapAdapter } from './gateway/km25madrid-hotel.adapter';
import { RealCuencaHotelSoapAdapter } from './gateway/real-cuenca-hotel.adapter';
import { EasyCarSoapAdapter } from './gateway/easy-car.adapter';
import { BackendCuencaSoapAdapter } from './gateway/backend-cuenca.adapter';
import { WeWorkHubIntegracionSoapAdapter } from './gateway/weworkhub-integracion.adapter';
import { AlquilerAugyeSoapAdapter } from './gateway/alquiler-augye.adapter';
import { getESBConfig } from './utils/config';
import type { FiltrosBusqueda } from './models/dtos';
import type { Usuario, Reserva, Pago } from './models/entities';
import type {
  PreReservaRequest,
  ConfirmarReservaRequest,
  VerificarDisponibilidadRequest,
  ItemDetalle,
  CancelarReservaRequest
} from './gateway/restaurant.adapter';

// Instanciar servicios
const config = getESBConfig();
const cafeteriaSoapAdapter = new CafeteriaSoapAdapter(config.endpoints.cafeteria);
const cuencaCarSoapAdapter = new CuencaCarRentalSoapAdapter(config.endpoints.cuencaCar);
const skyandesSoapAdapter = new SkyAndesFlightSoapAdapter(config.endpoints.skyandes);
const cangrejoFelizSoapAdapter = new ElCangrejoFelizSoapAdapter(config.endpoints.cangrejoFeliz);
const saborAndinoSoapAdapter = new SaborAndinoSoapAdapter(config.endpoints.saborAndino);
const hotelBoutiqueSoapAdapter = new HotelBoutiqueSoapAdapter(config.endpoints.hotelBoutique);
const autosRentCarSoapAdapter = new AutosRentCarSoapAdapter(config.endpoints.autosRentCar);
const km25MadridSoapAdapter = new KM25MadridHotelSoapAdapter(config.endpoints.km25Madrid);
const realCuencaSoapAdapter = new RealCuencaHotelSoapAdapter(config.endpoints.realCuenca);
const easyCarSoapAdapter = new EasyCarSoapAdapter(config.endpoints.easyCar);
const backendCuencaSoapAdapter = new BackendCuencaSoapAdapter(config.endpoints.backendCuenca);
const weWorkHubSoapAdapter = new WeWorkHubIntegracionSoapAdapter(config.endpoints.weWorkHubIntegracion);
const alquilerAugyeSoapAdapter = new AlquilerAugyeSoapAdapter(config.endpoints.alquilerAugye);

export const ESB = {
  // ==================== Búsqueda e Integración ====================
  
  /**
   * Busca servicios (hoteles, vuelos, autos) en todos los proveedores
   */
  buscarServicios: (filtros: FiltrosBusqueda) => 
    esbOrchestrator.buscarServicios(filtros),
  
  /**
   * Obtiene detalle completo de un servicio
   */
  obtenerDetalleServicio: (idServicio: string, tipo: 'hotel' | 'car' | 'flight' | 'restaurant' | 'package') =>
    esbOrchestrator.obtenerDetalleServicio(idServicio, tipo),
  
  /**
   * Verifica disponibilidad de un servicio
   */
  verificarDisponibilidad: (sku: string, tipo: string, inicio: Date, fin: Date, unidades: number) =>
    esbOrchestrator.verificarDisponibilidad(sku, tipo, inicio, fin, unidades),
  
  /**
   * Cotiza una reserva
   */
  cotizarReserva: (items: any[]) =>
    esbOrchestrator.cotizarReserva(items),
  
  /**
   * Crea una pre-reserva (bloqueo temporal)
   */
  crearPreReserva: (
    itinerario: any[], 
    cliente: { nombre: string; email: string; telefono?: string },
    holdMinutes?: number,
    idemKey?: string
  ) => esbOrchestrator.crearPreReserva(itinerario, cliente, holdMinutes, idemKey),
  
  /**
   * Confirma una reserva
   */
  confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: any) =>
    esbOrchestrator.confirmarReserva(preBookingId, metodoPago, datosPago),
  
  /**
   * Cancela una reserva
   */
  cancelarReserva: (bookingId: string, motivo: string) =>
    esbOrchestrator.cancelarReservaIntegracion(bookingId, motivo),
  
  // ==================== Gestión de Usuarios ====================
  
  usuarios: {
    obtenerTodos: () => usuarioService.obtenerUsuarios(),
    obtenerPorId: (id: string) => usuarioService.obtenerUsuarioPorId(id),
    crear: (usuario: Usuario) => usuarioService.crearUsuario(usuario),
    actualizar: (id: string, usuario: Partial<Usuario>) => usuarioService.actualizarUsuario(id, usuario),
    eliminar: (id: string) => usuarioService.eliminarUsuario(id)
  },
  
  // ==================== Gestión de Reservas ====================
  
  reservas: {
    obtenerTodas: (idUsuario?: string) => reservaService.obtenerReservas(idUsuario),
    obtenerPorId: (id: string) => reservaService.obtenerReservaPorId(id),
    crear: (reserva: Reserva) => reservaService.crearReserva(reserva),
    actualizar: (id: string, reserva: Partial<Reserva>) => reservaService.actualizarReserva(id, reserva),
    cancelar: (id: string) => reservaService.cancelarReserva(id),
    confirmar: (id: string) => reservaService.confirmarReserva(id),
    obtenerDetalles: (idReserva: string) => reservaService.obtenerDetallesReserva(idReserva)
  },
  
  // ==================== Gestión de Pagos ====================
  
  pagos: {
    obtenerTodos: (idReserva?: string) => pagoService.obtenerPagos(idReserva),
    obtenerPorId: (id: string) => pagoService.obtenerPagoPorId(id),
    crear: (pago: Pago) => pagoService.crearPago(pago),
    capturar: (id: string) => pagoService.capturarPago(id),
    reembolsar: (id: string) => pagoService.reembolsarPago(id),
    calcularTotalPagado: (idReserva: string) => pagoService.calcularTotalPagado(idReserva)
  },

  // ==================== Servicio de Restaurante ====================
  
  restaurante: {
    /**
     * Busca servicios de restaurante según filtros
     */
    buscarServicios: (filtros: string) => 
      restaurantSoapAdapter.buscarServicios(filtros),
    
    /**
     * Obtiene el detalle de un servicio de restaurante
     */
    obtenerDetalle: (idServicio: number) =>
      restaurantSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica disponibilidad de un servicio
     */
    verificarDisponibilidad: (request: VerificarDisponibilidadRequest) =>
      restaurantSoapAdapter.verificarDisponibilidad(request),
    
    /**
     * Cotiza una reserva (calcula precio total con impuestos)
     */
    cotizar: (items: ItemDetalle[]) =>
      restaurantSoapAdapter.cotizarReserva(items),
    
    /**
     * Crea una pre-reserva (bloquea disponibilidad)
     */
    crearPreReserva: (request: PreReservaRequest) =>
      restaurantSoapAdapter.crearPreReserva(request),
    
    /**
     * Confirma y emite la reserva
     */
    confirmarReserva: (request: ConfirmarReservaRequest) =>
      restaurantSoapAdapter.confirmarReserva(request),
    
    /**
     * Cancela una reserva
     */
    cancelar: (request: CancelarReservaRequest) =>
      restaurantSoapAdapter.cancelarReservaIntegracion(request)
  },

  // ==================== Servicio de Cafetería ====================
  
  cafeteria: {
    /**
     * Busca todos los servicios de cafetería (cafés, postres, desayunos)
     */
    buscarServicios: () => 
      cafeteriaSoapAdapter.buscarServicios(),
    
    /**
     * Obtiene el detalle de un tipo de servicio por ID
     */
    obtenerDetalle: (id: number) =>
      cafeteriaSoapAdapter.obtenerDetalleServicio(id),
    
    /**
     * Verifica disponibilidad de un producto
     */
    verificarDisponibilidad: (idServicio: number, unidades: number) =>
      cafeteriaSoapAdapter.verificarDisponibilidad(idServicio, unidades),
    
    /**
     * Cotiza una reserva/compra
     */
    cotizar: (precioUnitario: number, cantidad: number) =>
      cafeteriaSoapAdapter.cotizarReserva(precioUnitario, cantidad),
    
    /**
     * Crea una pre-reserva temporal
     */
    crearPreReserva: (cliente: string, producto: string, minutos: number) =>
      cafeteriaSoapAdapter.crearPreReserva(cliente, producto, minutos),
    
    /**
     * Confirma reserva y genera comprobante
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, monto: number) =>
      cafeteriaSoapAdapter.confirmarReserva(preBookingId, metodoPago, monto),
    
    /**
     * Cancela una reserva
     */
    cancelar: (bookingId: string, motivo: string) =>
      cafeteriaSoapAdapter.cancelarReserva(bookingId, motivo)
  },

  // ==================== Servicio de Autos Cuenca ====================
  
  cuencaCar: {
    /**
     * Busca autos disponibles por ciudad y categoría
     */
    buscarServicios: (ciudad?: string, categoria?: string) => 
      cuencaCarSoapAdapter.buscarServicios(ciudad, categoria),
    
    /**
     * Obtiene el detalle completo de un vehículo
     */
    obtenerDetalle: (idServicio: number) =>
      cuencaCarSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica disponibilidad de un vehículo
     */
    verificarDisponibilidad: (idVehiculo: number, inicio: Date, fin: Date, unidades: number) =>
      cuencaCarSoapAdapter.verificarDisponibilidad(idVehiculo, inicio, fin, unidades),
    
    /**
     * Cotiza una reserva de auto (calcula total con IVA)
     */
    cotizar: (idVehiculo: number, inicio: Date, fin: Date) =>
      cuencaCarSoapAdapter.cotizarReserva(idVehiculo, inicio, fin),
    
    /**
     * Crea una pre-reserva temporal
     */
    crearPreReserva: (idVehiculo: number, idUsuario: number) =>
      cuencaCarSoapAdapter.crearPreReserva(idVehiculo, idUsuario),
    
    /**
     * Confirma reserva de auto y genera comprobante
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, monto: number) =>
      cuencaCarSoapAdapter.confirmarReserva(preBookingId, metodoPago, monto),
    
    /**
     * Cancela una reserva de auto
     */
    cancelar: (bookingId: string, motivo: string) =>
      cuencaCarSoapAdapter.cancelarReservaIntegracion(bookingId, motivo)
  },

  // ==================== Alquiler Augye - Autos (AGQ/AGG) ====================
  alquilerAugye: {
    /**
     * Busca autos disponibles por filtros (ciudad, categoría, transmisión, precio)
     */
    buscarServicios: (filtros: any) =>
      alquilerAugyeSoapAdapter.buscarServicios(filtros),
    
    /**
     * Obtiene el detalle completo de un vehículo
     */
    obtenerDetalle: (idServicio: number) =>
      alquilerAugyeSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica disponibilidad de un vehículo por fechas
     */
    verificarDisponibilidad: (sku: number, inicio: string, fin: string, unidades: number) =>
      alquilerAugyeSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Cotiza una reserva de auto (calcula total con impuestos)
     */
    cotizar: (items: any[]) =>
      alquilerAugyeSoapAdapter.cotizarReserva(items),
    
    /**
     * Crea una pre-reserva temporal
     */
    crearPreReserva: (itinerario: any[], clienteId: number, holdMinutes: number, idemKey: string, pickupAt: string, dropoffAt: string, autoId: number) =>
      alquilerAugyeSoapAdapter.crearPreReserva(itinerario, clienteId, holdMinutes, idemKey, pickupAt, dropoffAt, autoId),
    
    /**
     * Confirma reserva de auto y genera comprobante
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: any) =>
      alquilerAugyeSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela una reserva de auto
     */
    cancelar: (bookingId: string, motivo: string) =>
      alquilerAugyeSoapAdapter.cancelarReservaIntegracion(bookingId, motivo)
  },

  // ==================== SkyAndes - Vuelos ====================
  skyandes: {
    /**
     * Busca vuelos disponibles por origen, destino, fecha y cabina
     */
    buscarServicios: (originId: number, destinationId: number, fecha: Date, cabinClass: string) =>
      skyandesSoapAdapter.buscarServicios(originId, destinationId, fecha, cabinClass),
    
    /**
     * Obtiene el detalle completo de un vuelo
     */
    obtenerDetalle: (idServicio: number) =>
      skyandesSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Valida la disponibilidad de asientos para un vuelo
     */
    verificarDisponibilidad: (sku: number, inicio: Date, fin: Date, unidades: number) =>
      skyandesSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Calcula el total estimado (impuestos y promo) para una reserva de vuelo
     */
    cotizar: (flightId: number, passengers: number) =>
      skyandesSoapAdapter.cotizarReserva(flightId, passengers),
    
    /**
     * Crea una pre-reserva temporal de vuelo
     */
    crearPreReserva: (userId: number, flightId: number, holdMinutes: number, idemKey: string) =>
      skyandesSoapAdapter.crearPreReserva(userId, flightId, holdMinutes, idemKey),
    
    /**
     * Confirma reserva de vuelo y registra pago
     */
    confirmarReserva: (preBookingId: number, metodoPago: string, monto: number, datosPago: string) =>
      skyandesSoapAdapter.confirmarReserva(preBookingId, metodoPago, monto, datosPago),
    
    /**
     * Cancela una reserva de vuelo y marca el pago como Refunded
     */
    cancelar: (bookingId: number, motivo: string) =>
      skyandesSoapAdapter.cancelarReserva(bookingId, motivo)
  },

  // ==================== El Cangrejo Feliz - Restaurante 🦀 ====================
  cangrejoFeliz: {
    /**
     * Búsqueda unificada por tipo, ciudad, fechas, precio, amenities, clasificación
     */
    buscarServicios: (filtros?: string) =>
      cangrejoFelizSoapAdapter.buscarServicios(filtros),
    
    /**
     * Detalle completo del servicio (fotos, políticas, reglas)
     */
    obtenerDetalle: (idServicio: number) =>
      cangrejoFelizSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Valida cupo/stock por fechas
     */
    verificarDisponibilidad: (sku: number, inicio: Date, fin: Date, unidades: number) =>
      cangrejoFelizSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Calcula precio total (impuestos/fees) para un itinerario
     */
    cotizar: (items: any[]) =>
      cangrejoFelizSoapAdapter.cotizarReserva(items),
    
    /**
     * Bloquea disponibilidad temporalmente
     */
    crearPreReserva: (itinerario: string, cliente: string, holdMinutes: number, idemKey: string) =>
      cangrejoFelizSoapAdapter.crearPreReserva(itinerario, cliente, holdMinutes, idemKey),
    
    /**
     * Confirma y emite la reserva
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: string) =>
      cangrejoFelizSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela con reglas tarifarias
     */
    cancelar: (bookingId: string, motivo: string) =>
      cangrejoFelizSoapAdapter.cancelarReserva(bookingId, motivo)
  },

  // ==================== Sabor Andino - Restaurante 🌮 ====================
  saborAndino: {
    /**
     * Búsqueda unificada por filtros
     */
    buscarServicios: (filtros: string) =>
      saborAndinoSoapAdapter.buscarServicios(filtros),
    
    /**
     * Obtiene el detalle completo de un servicio/mesa
     */
    obtenerDetalle: (idServicio: number) =>
      saborAndinoSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica disponibilidad de mesa por fechas y personas
     */
    verificarDisponibilidad: (sku: number, inicio: Date, fin: Date, unidades: number) =>
      saborAndinoSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Cotiza una reserva (calcula precio total con impuestos)
     */
    cotizar: (items: any[]) =>
      saborAndinoSoapAdapter.cotizarReserva(items),
    
    /**
     * Crea una pre-reserva temporal
     */
    crearPreReserva: (itinerario: string, cliente: string, holdMinutes: number, idemKey: string) =>
      saborAndinoSoapAdapter.crearPreReserva(itinerario, cliente, holdMinutes, idemKey),
    
    /**
     * Confirma y emite la reserva
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: any) =>
      saborAndinoSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela una reserva
     */
    cancelar: (bookingId: string, motivo: string) =>
      saborAndinoSoapAdapter.cancelarReservaIntegracion(bookingId, motivo)
  },

  // ==================== Hotel Boutique Paris 🏨 ====================
  hotelBoutique: {
    /**
     * Búsqueda unificada por ciudad, fechas, precio, amenities, clasificación
     */
    buscarServicios: (ciudad?: string, inicio?: Date, fin?: Date, precioMin?: number, precioMax?: number, amenities?: string) =>
      hotelBoutiqueSoapAdapter.buscarServicios(ciudad, inicio, fin, precioMin, precioMax, amenities),
    
    /**
     * Devuelve el detalle completo de un servicio/habitación
     */
    obtenerDetalle: (idServicio: number) =>
      hotelBoutiqueSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica la disponibilidad de una habitación por fechas
     */
    verificarDisponibilidad: (sku: number, inicio: Date, fin: Date, unidades: number) =>
      hotelBoutiqueSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Calcula el total de una reserva (precio + impuestos)
     */
    cotizar: (roomIds: number[]) =>
      hotelBoutiqueSoapAdapter.cotizarReserva(roomIds),
    
    /**
     * Crea una pre-reserva temporal que expira automáticamente
     */
    crearPreReserva: (roomId: number, userId: number, holdMinutes: number) =>
      hotelBoutiqueSoapAdapter.crearPreReserva(roomId, userId, holdMinutes),
    
    /**
     * Confirma una pre-reserva y la convierte en reserva final
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: string) =>
      hotelBoutiqueSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela una reserva confirmada con reglas tarifarias
     */
    cancelar: (bookingId: string, motivo: string) =>
      hotelBoutiqueSoapAdapter.cancelarReserva(bookingId, motivo)
  },

  // ==================== Autos RentCar 🚗 ====================
  autosRentCar: {
    /**
     * Búsqueda unificada por filtros avanzados
     */
    buscarServicios: (filtros?: any) =>
      autosRentCarSoapAdapter.buscarServicios(filtros),
    
    /**
     * Detalle completo del auto (marca, modelo, imágenes, políticas)
     */
    obtenerDetalle: (idServicio: number) =>
      autosRentCarSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Valida disponibilidad por fechas
     */
    verificarDisponibilidad: (sku: number, inicio: Date, fin: Date, unidades: number) =>
      autosRentCarSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Calcula precio total (impuestos/fees)
     */
    cotizar: (items: any[]) =>
      autosRentCarSoapAdapter.cotizarReserva(items),
    
    /**
     * Crea pre-reserva y bloquea temporalmente
     */
    crearPreReserva: (itinerario: any[], clienteId: number, holdMinutes: number, idemKey: string, pickupAt: Date, dropoffAt: Date, autoId: number) =>
      autosRentCarSoapAdapter.crearPreReserva(itinerario, clienteId, holdMinutes, idemKey, pickupAt, dropoffAt, autoId),
    
    /**
     * Confirma y emite reserva
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: any) =>
      autosRentCarSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela con reglas tarifarias
     */
    cancelar: (bookingId: string, motivo: string) =>
      autosRentCarSoapAdapter.cancelarReserva(bookingId, motivo)
  },

  // ==================== 🏨 KM25 Madrid Hotel ====================
  
  /**
   * KM25 Madrid Hotel - 8 operaciones
   * URL: http://km25madrid.runasp.net/Services/HotelService.asmx
   * Namespace: http://mio.hotel/booking
   */
  km25Madrid: {
    /**
     * Busca hoteles por nombre/ciudad, precio o fecha
     */
    buscarServicios: (filtros?: { filtro?: string; precio?: number; fecha?: Date }) =>
      km25MadridSoapAdapter.buscarServicios(filtros),
    
    /**
     * Obtiene detalle completo del hotel
     */
    obtenerDetalleServicio: (idHotel: number) =>
      km25MadridSoapAdapter.obtenerDetalleServicio(idHotel),
    
    /**
     * Verifica disponibilidad de habitación
     */
    verificarDisponibilidad: (idHabitacion: number, fechaInicio: Date, fechaFin: Date) =>
      km25MadridSoapAdapter.verificarDisponibilidad({ idHabitacion, fechaInicio, fechaFin }),
    
    /**
     * Calcula costo total con impuestos
     */
    cotizarReserva: (idHabitacion: number, fechaInicio: Date, fechaFin: Date) =>
      km25MadridSoapAdapter.cotizarReserva({ idHabitacion, fechaInicio, fechaFin }),
    
    /**
     * Crea pre-reserva (estado PENDIENTE)
     */
    crearPreReserva: (idCliente: number, idHabitacion: number, fechaCheckin: Date, fechaCheckout: Date) =>
      km25MadridSoapAdapter.crearPreReserva({ idCliente, idHabitacion, fechaCheckin, fechaCheckout }),
    
    /**
     * Confirma reserva con pago
     */
    confirmarReserva: (idReserva: number, idMetodoPago: number) =>
      km25MadridSoapAdapter.confirmarReserva({ idReserva, idMetodoPago }),
    
    /**
     * Cancela reserva y libera disponibilidad
     */
    cancelarReservaIntegracion: (bookingId: number, motivo?: string) =>
      km25MadridSoapAdapter.cancelarReservaIntegracion({ bookingId, motivo }),
    
    /**
     * Obtiene factura de la reserva
     */
    obtenerFactura: (idReserva: number) =>
      km25MadridSoapAdapter.obtenerFactura(idReserva)
  },

  // ==================== 🏨 Real de Cuenca Hotel ====================
  
  /**
   * Real de Cuenca Hotel - 11 operaciones
   * URL: https://realdecuencaintegracion-abachrhfgzcrb0af.canadacentral-01.azurewebsites.net/WS_GestionIntegracionDetalleEspacio.asmx
   * Namespace: http://tempuri.org/
   */
  realCuenca: {
    /**
     * Busca espacios disponibles con filtros
     */
    buscarServicios: (ubicacion?: string, hotel?: string, fechaInicio?: Date, fechaFin?: Date) =>
      realCuencaSoapAdapter.buscarServicios(ubicacion, hotel, fechaInicio, fechaFin),
    
    /**
     * Obtiene espacio por ID
     */
    seleccionarEspacioDetalladoPorId: (id: number) =>
      realCuencaSoapAdapter.seleccionarEspacioDetalladoPorId(id),
    
    /**
     * Verifica disponibilidad de espacio
     */
    verificarDisponibilidad: (espacioId: number, fechaInicio: Date, fechaFin: Date) =>
      realCuencaSoapAdapter.verificarDisponibilidad(espacioId, fechaInicio, fechaFin),
    
    /**
     * Cotiza reserva con detalles
     */
    cotizarReserva: (espacioId: number, checkIn: Date, checkOut: Date) =>
      realCuencaSoapAdapter.cotizarReserva(espacioId, checkIn, checkOut),
    
    /**
     * Crea pre-reserva con bloqueo temporal
     */
    crearPreReserva: (espacioId: number, usuarioId: number, checkIn: Date, checkOut: Date, holdMinutes: number) =>
      realCuencaSoapAdapter.crearPreReserva(espacioId, usuarioId, checkIn, checkOut, holdMinutes),
    
    /**
     * Confirma reserva con pago
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: string) =>
      realCuencaSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela reserva
     */
    cancelarReservaIntegracion: (bookingId: string, motivo: string) =>
      realCuencaSoapAdapter.cancelarReservaIntegracion(bookingId, motivo),
    
    /**
     * Obtiene catálogo de hoteles
     */
    obtenerHoteles: () =>
      realCuencaSoapAdapter.obtenerHoteles(),
    
    /**
     * Obtiene catálogo de ubicaciones
     */
    obtenerUbicaciones: () =>
      realCuencaSoapAdapter.obtenerUbicaciones(),
    
    /**
     * Búsqueda paginada de espacios
     */
    seleccionarEspaciosDetalladosPorPaginas: (pagina: number, tamanoPagina: number) =>
      realCuencaSoapAdapter.seleccionarEspaciosDetalladosPorPaginas(pagina, tamanoPagina),
    
    /**
     * Búsqueda con filtros y paginación
     */
    seleccionarEspaciosDetalladosConFiltro: (ubicacion: string, hotel: string, fechaInicio: Date, fechaFin: Date, pagina: number, tamanoPagina: number) =>
      realCuencaSoapAdapter.seleccionarEspaciosDetalladosConFiltro(ubicacion, hotel, fechaInicio, fechaFin, pagina, tamanoPagina)
  },

  // ==================== Servicio Easy Car (100% Funcional) ====================
  
  easyCar: {
    /**
     * Busca vehículos disponibles con filtros
     */
    buscarServicios: (categoria?: string, transmision?: string) =>
      easyCarSoapAdapter.buscarServicios(categoria, transmision),
    
    /**
     * Obtiene detalle de un vehículo
     */
    obtenerDetalleServicio: (idVehiculo: number) =>
      easyCarSoapAdapter.obtenerDetalleServicio(idVehiculo),
    
    /**
     * Verifica disponibilidad de un vehículo
     */
    verificarDisponibilidad: (idVehiculo: number, inicio: string, fin: string) =>
      easyCarSoapAdapter.verificarDisponibilidad(idVehiculo, inicio, fin),
    
    /**
     * Cotiza alquiler de vehículo
     */
    cotizarReserva: (idVehiculo: number, dias: number) =>
      easyCarSoapAdapter.cotizarReserva(idVehiculo, dias),
    
    /**
     * Crea pre-reserva
     */
    crearPreReserva: (idVehiculo: number, idCliente: number, inicio: string, fin: string, edadConductor: number) =>
      easyCarSoapAdapter.crearPreReserva(idVehiculo, idCliente, inicio, fin, edadConductor),
    
    /**
     * Confirma reserva
     */
    confirmarReserva: (idReserva: number) =>
      easyCarSoapAdapter.confirmarReserva(idReserva),
    
    /**
     * Cancela reserva
     */
    cancelarReservaIntegracion: (idReserva: number, motivo: string) =>
      easyCarSoapAdapter.cancelarReservaIntegracion(idReserva, motivo)
  },

  // ==================== Servicio Backend Cuenca (100% Funcional) ====================
  
  backendCuenca: {
    /**
     * Busca paquetes turísticos con filtros
     */
    buscarServicios: (minPrecio?: number, maxPrecio?: number) =>
      backendCuencaSoapAdapter.buscarServicios({ minPrecio, maxPrecio }),
    
    /**
     * Obtiene detalle de un paquete turístico
     */
    obtenerDetalleServicio: (idServicio: string) =>
      backendCuencaSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica disponibilidad de un paquete
     */
    verificarDisponibilidad: (sku: string, inicio: string | undefined, fin: string | undefined, unidades: number) =>
      backendCuencaSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Cotiza reserva de paquete turístico
     */
    cotizarReserva: (items: any[]) =>
      backendCuencaSoapAdapter.cotizarReserva(items),
    
    /**
     * Crea pre-reserva
     */
    crearPreReserva: (itinerario?: string, cliente?: string, holdMinutes?: number, idemKey?: string) =>
      backendCuencaSoapAdapter.crearPreReserva(itinerario, cliente, holdMinutes, idemKey),
    
    /**
     * Confirma reserva
     */
    confirmarReserva: (preBookingId: string, datosPago: any) =>
      backendCuencaSoapAdapter.confirmarReserva(preBookingId, datosPago),
    
    /**
     * Cancela reserva
     */
    cancelarReservaIntegracion: (bookingId: string, motivo: string) =>
      backendCuencaSoapAdapter.cancelarReservaIntegracion(bookingId, motivo)
  },

  // ==================== 🏨 WeWorkHub Integración (Multi-Servicio Cuenca) ====================
  
  /**
   * WeWorkHub Integración - Hub multi-servicio de Cuenca
   * URL: http://inegracion.runasp.net/WS_Integracion.asmx
   * Namespace: http://weworkhub/integracion
   * Servicios: HOTEL, FLIGHT, CAR, RESTAURANT, PACKAGE
   */
  weWorkHub: {
    /**
     * Busca servicios (principalmente hoteles) con filtros avanzados
     */
    buscarServicios: (filtros: {
      serviceType?: string;
      ciudad?: string;
      fechaInicio?: string;
      fechaFin?: string;
      precioMin?: number;
      precioMax?: number;
      amenities?: string[];
      clasificacionMin?: number;
      adultos?: number;
      ninos?: number;
    }) => weWorkHubSoapAdapter.buscarServicios(filtros),
    
    /**
     * Obtiene detalle completo de un servicio por UUID
     */
    obtenerDetalleServicio: (idServicio: string) =>
      weWorkHubSoapAdapter.obtenerDetalleServicio(idServicio),
    
    /**
     * Verifica disponibilidad de habitación/servicio
     */
    verificarDisponibilidad: (sku: string, inicio: string, fin: string, unidades: number) =>
      weWorkHubSoapAdapter.verificarDisponibilidad(sku, inicio, fin, unidades),
    
    /**
     * Calcula cotización con desglose (subtotal, impuestos, fees)
     */
    cotizarReserva: (items: any[]) =>
      weWorkHubSoapAdapter.cotizarReserva(items),
    
    /**
     * Crea pre-reserva con hold temporal (minutos configurables)
     */
    crearPreReserva: (itinerario: any[], cliente: any, holdMinutes: number, idemKey: string) =>
      weWorkHubSoapAdapter.crearPreReserva(itinerario, cliente, holdMinutes, idemKey),
    
    /**
     * Confirma reserva y procesa pago
     */
    confirmarReserva: (preBookingId: string, metodoPago: string, datosPago: string) =>
      weWorkHubSoapAdapter.confirmarReserva(preBookingId, metodoPago, datosPago),
    
    /**
     * Cancela reserva con motivo
     */
    cancelarReservaIntegracion: (bookingId: string, motivo: string) =>
      weWorkHubSoapAdapter.cancelarReservaIntegracion(bookingId, motivo)
  }
};

// Exportar por defecto
export default ESB;
