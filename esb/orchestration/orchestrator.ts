/**
 * ESB - Orchestration - Orquestador Principal
 * Coordina llamadas a múltiples servicios SOAP y unifica resultados
 */

import { hotelSoapAdapter, flightSoapAdapter, carSoapAdapter } from '../gateway';
import { servicioRepository, reservaRepository, preReservaRepository } from '../dal';
import { ESBLogger, retryOperation } from '../utils/soap-utils';
import type { Servicio, PreReserva, Reserva, Cotizacion, DetalleReserva } from '../models/entities';
import type { FiltrosBusqueda } from '../models/dtos';

const logger = ESBLogger.getInstance();

/**
 * Orquestador principal del ESB
 * Gestiona la integración con múltiples servicios SOAP
 */
export class ESBOrchestrator {
  
  /**
   * Búsqueda unificada en todos los servicios habilitados
   */
  async buscarServicios(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    logger.info('Iniciando búsqueda unificada de servicios', filtros);
    
    const resultados: Servicio[] = [];
    const serviceTypes = filtros.serviceType || ['hotel', 'car', 'flight'];
    
    // Ejecutar búsquedas en paralelo
    const promesas: Promise<Servicio[]>[] = [];
    
    if (serviceTypes.includes('hotel')) {
      promesas.push(this.buscarHoteles(filtros));
    }
    
    if (serviceTypes.includes('flight')) {
      promesas.push(this.buscarVuelos(filtros));
    }
    
    if (serviceTypes.includes('car')) {
      promesas.push(this.buscarAutos(filtros));
    }
    
    // Esperar todas las búsquedas
    const resultadosPorServicio = await Promise.allSettled(promesas);
    
    // Consolidar resultados
    for (const resultado of resultadosPorServicio) {
      if (resultado.status === 'fulfilled') {
        resultados.push(...resultado.value);
      } else {
        logger.error('Error en búsqueda de servicio', resultado.reason);
      }
    }
    
    // Guardar en cache
    for (const servicio of resultados) {
      await servicioRepository.create(servicio);
    }
    
    logger.info(`Búsqueda completada: ${resultados.length} servicios encontrados`);
    return resultados;
  }
  
  /**
   * Obtiene detalle completo de un servicio
   */
  async obtenerDetalleServicio(
    idServicio: string, 
    serviceType: 'hotel' | 'car' | 'flight' | 'restaurant' | 'package'
  ): Promise<Servicio> {
    logger.info(`Obteniendo detalle de servicio: ${serviceType}/${idServicio}`);
    
    let servicio: Servicio;
    
    try {
      // Intentar obtener del adaptador correspondiente
      switch (serviceType) {
        case 'hotel':
          servicio = await retryOperation(() => hotelSoapAdapter.obtenerDetalleHotel(idServicio));
          break;
        case 'flight':
          servicio = await retryOperation(() => flightSoapAdapter.obtenerDetalleVuelo(idServicio));
          break;
        case 'car':
          servicio = await retryOperation(() => carSoapAdapter.obtenerDetalleAuto(idServicio));
          break;
        default:
          throw new Error(`Tipo de servicio no soportado: ${serviceType}`);
      }
      
      // Actualizar cache
      const existente = await servicioRepository.findById(idServicio);
      if (existente) {
        await servicioRepository.update(idServicio, servicio);
      } else {
        await servicioRepository.create(servicio);
      }
      
      return servicio;
    } catch (error) {
      logger.warn('Error al obtener servicio de API externa, buscando en cache', error);
      
      // Fallback: buscar en cache local
      const cached = await servicioRepository.findById(idServicio);
      if (cached) {
        return cached;
      }
      
      throw error;
    }
  }
  
  /**
   * Verifica disponibilidad en el servicio externo
   */
  async verificarDisponibilidad(
    sku: string,
    serviceType: string,
    inicio: Date,
    fin: Date,
    unidades: number
  ): Promise<boolean> {
    logger.info(`Verificando disponibilidad: ${serviceType}/${sku}`);
    
    try {
      switch (serviceType) {
        case 'hotel':
          return await hotelSoapAdapter.verificarDisponibilidad(sku, 'Standard', inicio, fin, unidades);
        case 'flight':
          return await flightSoapAdapter.verificarDisponibilidad(sku, unidades);
        case 'car':
          return await carSoapAdapter.verificarDisponibilidad(sku, inicio, fin);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error al verificar disponibilidad', error);
      return false;
    }
  }
  
  /**
   * Cotiza una reserva completa
   */
  async cotizarReserva(items: DetalleReserva[]): Promise<Cotizacion> {
    logger.info('Cotizando reserva', { items: items.length });
    
    let subtotal = 0;
    
    for (const item of items) {
      subtotal += item.subtotal;
    }
    
    // Calcular impuestos (ejemplo: 10%)
    const impuestos = subtotal * 0.10;
    
    // Calcular fees (ejemplo: 5% de fee de servicio)
    const fees = subtotal * 0.05;
    
    // Total
    const total = subtotal + impuestos + fees;
    
    const cotizacion: Cotizacion = {
      total,
      currency: 'USD',
      breakdown: {
        subtotal,
        impuestos,
        fees
      },
      items
    };
    
    logger.info('Cotización generada', { total });
    return cotizacion;
  }
  
  /**
   * Crea una pre-reserva (bloqueo temporal)
   */
  async crearPreReserva(
    itinerario: DetalleReserva[],
    cliente: { nombre: string; email: string; telefono?: string },
    holdMinutes: number = 30,
    idemKey?: string
  ): Promise<PreReserva> {
    logger.info('Creando pre-reserva', { cliente: cliente.email, items: itinerario.length });
    
    // Verificar idempotencia
    if (idemKey) {
      const existente = await preReservaRepository.findByIdemKey(idemKey);
      if (existente) {
        logger.info('Pre-reserva ya existe (idempotencia)', { preBookingId: existente.preBookingId });
        return existente;
      }
    }
    
    const expiraEn = new Date(Date.now() + holdMinutes * 60 * 1000);
    
    const preReserva: PreReserva = {
      itinerario,
      cliente,
      holdMinutes,
      expiraEn,
      idemKey,
      estado: 'BLOQUEADO'
    };
    
    // Guardar pre-reserva
    const creada = await preReservaRepository.create(preReserva);
    
    // TODO: Crear pre-reservas en cada servicio externo
    // Por ahora solo guardamos localmente
    
    logger.info('Pre-reserva creada', { preBookingId: creada.preBookingId });
    return creada;
  }
  
  /**
   * Confirma una reserva a partir de una pre-reserva
   */
  async confirmarReserva(
    preBookingId: string,
    _metodoPago: string,
    _datosPago: Record<string, any>
  ): Promise<Reserva> {
    logger.info('Confirmando reserva', { preBookingId });
    
    // Obtener pre-reserva
    const preReserva = await preReservaRepository.findById(preBookingId);
    if (!preReserva) {
      throw new Error(`Pre-reserva ${preBookingId} no encontrada`);
    }
    
    if (preReserva.estado !== 'BLOQUEADO') {
      throw new Error(`Pre-reserva ${preBookingId} no está en estado BLOQUEADO`);
    }
    
    // Verificar que no haya expirado
    if (new Date() > new Date(preReserva.expiraEn)) {
      await preReservaRepository.update(preBookingId, { estado: 'EXPIRADO' });
      throw new Error(`Pre-reserva ${preBookingId} ha expirado`);
    }
    
    // Calcular total
    const total = preReserva.itinerario.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Crear reserva
    const reserva: Reserva = {
      idUsuario: 'guest', // TODO: obtener del contexto
      fechaReserva: new Date(),
      estado: 'CONFIRMADA',
      totalPrice: total,
      currency: 'USD',
      detalles: preReserva.itinerario,
      pagos: []
    };
    
    const reservaCreada = await reservaRepository.create(reserva);
    
    // Marcar pre-reserva como confirmada
    await preReservaRepository.update(preBookingId, { estado: 'CONFIRMADO' });
    
    logger.info('Reserva confirmada', { idReserva: reservaCreada.idReserva });
    return reservaCreada;
  }
  
  /**
   * Cancela una reserva en todos los servicios
   */
  async cancelarReservaIntegracion(bookingId: string, motivo: string): Promise<boolean> {
    logger.info('Cancelando reserva en integración', { bookingId, motivo });
    
    // Obtener reserva local
    const reserva = await reservaRepository.findById(bookingId);
    if (!reserva) {
      throw new Error(`Reserva ${bookingId} no encontrada`);
    }
    
    // Cancelar en cada servicio externo
    const promesas: Promise<boolean>[] = [];
    
    for (const detalle of reserva.detalles) {
      switch (detalle.tipoServicio) {
        case 'hotel':
          promesas.push(hotelSoapAdapter.cancelarReservaHotel(detalle.idServicio, motivo));
          break;
        case 'flight':
          promesas.push(flightSoapAdapter.cancelarReservaVuelo(detalle.idServicio, motivo));
          break;
        case 'car':
          promesas.push(carSoapAdapter.cancelarReservaAuto(detalle.idServicio, motivo));
          break;
      }
    }
    
    const resultados = await Promise.allSettled(promesas);
    
    // Verificar si al menos una cancelación fue exitosa
    const algunaCancelada = resultados.some(r => r.status === 'fulfilled' && r.value);
    
    if (algunaCancelada) {
      // Actualizar estado local
      await reservaRepository.update(bookingId, { estado: 'CANCELADA' });
      logger.info('Reserva cancelada exitosamente', { bookingId });
      return true;
    } else {
      logger.error('No se pudo cancelar ningún servicio', { bookingId });
      return false;
    }
  }
  
  // ==================== Métodos Privados de Búsqueda ====================
  
  private async buscarHoteles(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    logger.info('Buscando hoteles');
    try {
      return await retryOperation(() => hotelSoapAdapter.buscarHoteles(filtros), 2, 500);
    } catch (error) {
      logger.error('Error al buscar hoteles', error);
      return [];
    }
  }
  
  private async buscarVuelos(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    logger.info('Buscando vuelos');
    try {
      return await retryOperation(() => flightSoapAdapter.buscarVuelos(filtros), 2, 500);
    } catch (error) {
      logger.error('Error al buscar vuelos', error);
      return [];
    }
  }
  
  private async buscarAutos(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    logger.info('Buscando autos');
    try {
      return await retryOperation(() => carSoapAdapter.buscarAutos(filtros), 2, 500);
    } catch (error) {
      logger.error('Error al buscar autos', error);
      return [];
    }
  }
}

export const esbOrchestrator = new ESBOrchestrator();
