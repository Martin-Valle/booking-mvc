/**
 * Script de Prueba para el Servicio de Restaurante
 * Prueba la conexión con http://sanctumcortejo.runasp.net/Ws_IntegracionRestaurante.asmx
 */

import { RestaurantSoapAdapter } from './gateway/restaurant.adapter';
import type { 
  ServicioDTO, 
  VerificarDisponibilidadRequest,
  PreReservaRequest,
  ConfirmarReservaRequest,
  ItemDetalle,
  CancelarReservaRequest
} from './gateway/restaurant.adapter';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string, error?: any) {
  log(`✗ ${message}`, colors.red);
  if (error) {
    console.error(error);
  }
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Prueba 1: Buscar servicios
 */
async function test1_BuscarServicios(adapter: RestaurantSoapAdapter) {
  logSection('TEST 1: Buscar Servicios');
  
  try {
    logInfo('Buscando servicios de restaurante con filtro "ecuatoriano"...');
    
    const servicios = await adapter.buscarServicios('ecuatoriano');
    
    if (servicios && servicios.length > 0) {
      logSuccess(`Se encontraron ${servicios.length} servicios`);
      
      servicios.forEach((servicio, index) => {
        console.log(`\n  Servicio ${index + 1}:`);
        console.log(`    ID: ${servicio.IdServicio}`);
        console.log(`    Nombre: ${servicio.Nombre}`);
        console.log(`    Tipo: ${servicio.Tipo}`);
        console.log(`    Ciudad: ${servicio.Ciudad}`);
        console.log(`    Precio: ${servicio.Precio}`);
        console.log(`    Clasificación: ${servicio.Clasificacion}`);
      });
      
      return servicios[0]; // Retornar el primero para usar en otras pruebas
    } else {
      logInfo('No se encontraron servicios');
      return null;
    }
  } catch (error: any) {
    logError('Error al buscar servicios', error.message);
    return null;
  }
}

/**
 * Prueba 2: Obtener detalle de un servicio
 */
async function test2_ObtenerDetalle(adapter: RestaurantSoapAdapter, servicio: ServicioDTO | null) {
  logSection('TEST 2: Obtener Detalle de Servicio');
  
  if (!servicio) {
    logInfo('Saltando prueba (no hay servicio disponible)');
    return;
  }
  
  try {
    logInfo(`Obteniendo detalle del servicio ID: ${servicio.IdServicio}...`);
    
    const detalle = await adapter.obtenerDetalleServicio(servicio.IdServicio);
    
    logSuccess('Detalle obtenido correctamente');
    console.log('\n  Información completa:');
    console.log(`    Nombre: ${detalle.Nombre}`);
    console.log(`    Descripción: ${detalle.Descripcion}`);
    console.log(`    Políticas: ${detalle.Politicas}`);
    console.log(`    Reglas: ${detalle.Reglas}`);
    console.log(`    Imagen: ${detalle.ImagenURL}`);
  } catch (error: any) {
    logError('Error al obtener detalle', error.message);
  }
}

/**
 * Prueba 3: Verificar disponibilidad
 */
async function test3_VerificarDisponibilidad(adapter: RestaurantSoapAdapter, servicio: ServicioDTO | null) {
  logSection('TEST 3: Verificar Disponibilidad');
  
  if (!servicio) {
    logInfo('Saltando prueba (no hay servicio disponible)');
    return;
  }
  
  try {
    const request: VerificarDisponibilidadRequest = {
      sku: servicio.IdServicio,
      inicio: new Date().toISOString(),
      fin: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
      unidades: 2
    };
    
    logInfo(`Verificando disponibilidad para SKU: ${request.sku}, Unidades: ${request.unidades}...`);
    
    const resultado = await adapter.verificarDisponibilidad(request);
    
    if (resultado.Disponible) {
      logSuccess(`Disponible: ${resultado.Mensaje}`);
    } else {
      log(`⚠ No disponible: ${resultado.Mensaje}`, colors.yellow);
    }
  } catch (error: any) {
    logError('Error al verificar disponibilidad', error.message);
  }
}

/**
 * Prueba 4: Cotizar reserva
 */
async function test4_CotizarReserva(adapter: RestaurantSoapAdapter) {
  logSection('TEST 4: Cotizar Reserva');
  
  try {
    const items: ItemDetalle[] = [
      {
        Nombre: 'Menú Ejecutivo',
        Cantidad: 2,
        PrecioUnitario: 12.50,
        PrecioTotal: 25.00
      },
      {
        Nombre: 'Bebida',
        Cantidad: 2,
        PrecioUnitario: 3.00,
        PrecioTotal: 6.00
      }
    ];
    
    logInfo('Cotizando reserva para 2 menús ejecutivos y 2 bebidas...');
    
    const cotizacion = await adapter.cotizarReserva(items);
    
    logSuccess(`Total cotizado: $${cotizacion.Total}`);
    console.log('\n  Desglose:');
    cotizacion.Breakdown.forEach(item => {
      console.log(`    ${item.Nombre}: ${item.Cantidad} x $${item.PrecioUnitario} = $${item.PrecioTotal}`);
    });
  } catch (error: any) {
    logError('Error al cotizar reserva', error.message);
  }
}

/**
 * Prueba 5: Crear pre-reserva
 */
async function test5_CrearPreReserva(adapter: RestaurantSoapAdapter) {
  logSection('TEST 5: Crear Pre-Reserva');
  
  try {
    const request: PreReservaRequest = {
      itinerario: JSON.stringify({
        fecha: new Date().toISOString(),
        personas: 4,
        hora: '19:00'
      }),
      cliente: JSON.stringify({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '0987654321'
      }),
      holdMinutes: 15,
      idemKey: `TEST-${Date.now()}`
    };
    
    logInfo('Creando pre-reserva (hold por 15 minutos)...');
    
    const resultado = await adapter.crearPreReserva(request);
    
    logSuccess(`Pre-reserva creada: ${resultado.PreBookingId}`);
    console.log(`  Expira en: ${resultado.ExpiraEn}`);
    
    return resultado.PreBookingId;
  } catch (error: any) {
    logError('Error al crear pre-reserva', error.message);
    return null;
  }
}

/**
 * Prueba 6: Confirmar reserva
 */
async function test6_ConfirmarReserva(adapter: RestaurantSoapAdapter, preBookingId: string | null) {
  logSection('TEST 6: Confirmar Reserva');
  
  if (!preBookingId) {
    logInfo('Saltando prueba (no hay pre-reserva disponible)');
    return null;
  }
  
  try {
    const request: ConfirmarReservaRequest = {
      preBookingId: preBookingId,
      metodoPago: 'TARJETA_CREDITO',
      datosPago: JSON.stringify({
        numeroTarjeta: '**** **** **** 1234',
        titular: 'Juan Pérez',
        cvv: '***'
      })
    };
    
    logInfo(`Confirmando pre-reserva: ${preBookingId}...`);
    
    const resultado = await adapter.confirmarReserva(request);
    
    logSuccess(`Reserva confirmada: ${resultado.BookingId}`);
    console.log(`  Estado: ${resultado.Estado}`);
    
    return resultado.BookingId;
  } catch (error: any) {
    logError('Error al confirmar reserva', error.message);
    return null;
  }
}

/**
 * Prueba 7: Cancelar reserva
 */
async function test7_CancelarReserva(adapter: RestaurantSoapAdapter, bookingId: string | null) {
  logSection('TEST 7: Cancelar Reserva');
  
  if (!bookingId) {
    logInfo('Saltando prueba (no hay reserva para cancelar)');
    return;
  }
  
  try {
    const request: CancelarReservaRequest = {
      bookingId: bookingId,
      motivo: 'Prueba de integración - Cancelación de prueba'
    };
    
    logInfo(`Cancelando reserva: ${bookingId}...`);
    
    const resultado = await adapter.cancelarReservaIntegracion(request);
    
    if (resultado.Cancelacion) {
      logSuccess('Reserva cancelada exitosamente');
    } else {
      log('⚠ No se pudo cancelar la reserva', colors.yellow);
    }
  } catch (error: any) {
    logError('Error al cancelar reserva', error.message);
  }
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  console.clear();
  log('\n🧪 PRUEBAS DE INTEGRACIÓN - SERVICIO DE RESTAURANTE', colors.bright + colors.cyan);
  log('Endpoint: http://sanctumcortejo.runasp.net/Ws_IntegracionRestaurante.asmx\n', colors.blue);
  
  const adapter = new RestaurantSoapAdapter();
  
  try {
    // Prueba 1: Buscar servicios
    const servicio = await test1_BuscarServicios(adapter);
    
    // Prueba 2: Obtener detalle
    await test2_ObtenerDetalle(adapter, servicio);
    
    // Prueba 3: Verificar disponibilidad
    await test3_VerificarDisponibilidad(adapter, servicio);
    
    // Prueba 4: Cotizar reserva
    await test4_CotizarReserva(adapter);
    
    // Prueba 5: Crear pre-reserva
    const preBookingId = await test5_CrearPreReserva(adapter);
    
    // Prueba 6: Confirmar reserva
    const bookingId = await test6_ConfirmarReserva(adapter, preBookingId);
    
    // Prueba 7: Cancelar reserva
    await test7_CancelarReserva(adapter, bookingId);
    
    logSection('RESUMEN');
    logSuccess('Todas las pruebas completadas');
    logInfo('Revisa los resultados arriba para ver el estado de cada prueba');
    
  } catch (error: any) {
    logError('Error general en las pruebas', error);
  }
}

// Ejecutar pruebas
runAllTests().catch(console.error);
