/**
 * Script de Prueba Completa de Todas las APIs Integradas al ESB
 * Verifica la conectividad y funcionamiento de cada servicio SOAP
 */

import { EasyCarSoapAdapter } from './gateway/easy-car.adapter';
import { BackendCuencaSoapAdapter } from './gateway/backend-cuenca.adapter';
import { CuencaCarRentalSoapAdapter } from './gateway/cuenca-car.adapter';
import { AutosRentCarSoapAdapter } from './gateway/autos-rentcar.adapter';
import { restaurantSoapAdapter } from './gateway/restaurant.adapter';
import { CafeteriaSoapAdapter } from './gateway/cafeteria.adapter';
import { SkyAndesFlightSoapAdapter } from './gateway/skyandes.adapter';
import { ElCangrejoFelizSoapAdapter } from './gateway/cangrejo-feliz.adapter';
import { HotelBoutiqueSoapAdapter } from './gateway/hotel-boutique.adapter';
import { KM25MadridHotelSoapAdapter } from './gateway/km25madrid-hotel.adapter';
import { RealCuencaHotelSoapAdapter } from './gateway/real-cuenca-hotel.adapter';
import { getESBConfig } from './utils/config';

interface TestResult {
  service: string;
  category: string;
  status: 'OK' | 'ERROR' | 'TIMEOUT';
  message: string;
  responseTime?: number;
  details?: any;
}

const results: TestResult[] = [];

// Configuración
const config = getESBConfig();
const TIMEOUT_MS = 10000; // 10 segundos

/**
 * Ejecuta una prueba con timeout
 */
async function testWithTimeout<T>(
  serviceName: string,
  category: string,
  testFn: () => Promise<T>,
  timeoutMs: number = TIMEOUT_MS
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    
    const result = await Promise.race([testFn(), timeoutPromise]);
    const responseTime = Date.now() - startTime;
    
    return {
      service: serviceName,
      category,
      status: 'OK',
      message: '✅ Servicio funcionando correctamente',
      responseTime,
      details: result
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.message === 'Timeout') {
      return {
        service: serviceName,
        category,
        status: 'TIMEOUT',
        message: `⏱️ Timeout después de ${timeoutMs}ms`,
        responseTime
      };
    }
    
    return {
      service: serviceName,
      category,
      status: 'ERROR',
      message: `❌ Error: ${error.message}`,
      responseTime,
      details: error.stack
    };
  }
}

/**
 * Prueba servicios de autos
 */
async function testCarServices() {
  console.log('\n🚗 ========== PROBANDO SERVICIOS DE AUTOS ==========\n');
  
  // 1. Easy Car
  console.log('1️⃣ Probando Easy Car...');
  const easyCar = new EasyCarSoapAdapter(config.endpoints.easyCar);
  const easyCarResult = await testWithTimeout(
    'Easy Car',
    'Autos',
    async () => {
      const response = await easyCar.buscarServicios();
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(easyCarResult);
  console.log(`   ${easyCarResult.status} - ${easyCarResult.message} (${easyCarResult.responseTime}ms)`);
  
  // 2. Backend Cuenca
  console.log('2️⃣ Probando Backend Cuenca...');
  const backendCuenca = new BackendCuencaSoapAdapter(config.endpoints.backendCuenca);
  const backendCuencaResult = await testWithTimeout(
    'Backend Cuenca',
    'Autos',
    async () => {
      const response = await backendCuenca.buscarServicios();
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(backendCuencaResult);
  console.log(`   ${backendCuencaResult.status} - ${backendCuencaResult.message} (${backendCuencaResult.responseTime}ms)`);
  
  // 3. Cuenca Car Rental
  console.log('3️⃣ Probando Cuenca Car Rental...');
  const cuencaCar = new CuencaCarRentalSoapAdapter(config.endpoints.cuencaCar);
  const cuencaCarResult = await testWithTimeout(
    'Cuenca Car Rental',
    'Autos',
    async () => {
      const response = await cuencaCar.buscarServicios('');
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(cuencaCarResult);
  console.log(`   ${cuencaCarResult.status} - ${cuencaCarResult.message} (${cuencaCarResult.responseTime}ms)`);
  
  // 4. Autos RentCar
  console.log('4️⃣ Probando Autos RentCar...');
  const autosRentCar = new AutosRentCarSoapAdapter(config.endpoints.autosRentCar);
  const autosRentCarResult = await testWithTimeout(
    'Autos RentCar',
    'Autos',
    async () => {
      const response = await autosRentCar.buscarServicios();
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(autosRentCarResult);
  console.log(`   ${autosRentCarResult.status} - ${autosRentCarResult.message} (${autosRentCarResult.responseTime}ms)`);
}

/**
 * Prueba servicios de hoteles
 */
async function testHotelServices() {
  console.log('\n🏨 ========== PROBANDO SERVICIOS DE HOTELES ==========\n');
  
  // 1. Hotel Boutique
  console.log('1️⃣ Probando Hotel Boutique...');
  const hotelBoutique = new HotelBoutiqueSoapAdapter(config.endpoints.hotelBoutique);
  const hotelBoutiqueResult = await testWithTimeout(
    'Hotel Boutique',
    'Hoteles',
    async () => {
      const response = await hotelBoutique.buscarServicios('');
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(hotelBoutiqueResult);
  console.log(`   ${hotelBoutiqueResult.status} - ${hotelBoutiqueResult.message} (${hotelBoutiqueResult.responseTime}ms)`);
  
  // 2. KM25 Madrid Hotel
  console.log('2️⃣ Probando KM25 Madrid Hotel...');
  const km25Madrid = new KM25MadridHotelSoapAdapter(config.endpoints.km25Madrid);
  const km25MadridResult = await testWithTimeout(
    'KM25 Madrid Hotel',
    'Hoteles',
    async () => {
      const response = await km25Madrid.buscarServicios();
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(km25MadridResult);
  console.log(`   ${km25MadridResult.status} - ${km25MadridResult.message} (${km25MadridResult.responseTime}ms)`);
  
  // 3. Real Cuenca Hotel
  console.log('3️⃣ Probando Real Cuenca Hotel...');
  const realCuenca = new RealCuencaHotelSoapAdapter(config.endpoints.realCuenca);
  const realCuencaResult = await testWithTimeout(
    'Real Cuenca Hotel',
    'Hoteles',
    async () => {
      const response = await realCuenca.buscarServicios('');
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(realCuencaResult);
  console.log(`   ${realCuencaResult.status} - ${realCuencaResult.message} (${realCuencaResult.responseTime}ms)`);
}

/**
 * Prueba servicios de restaurantes
 */
async function testRestaurantServices() {
  console.log('\n🍽️ ========== PROBANDO SERVICIOS DE RESTAURANTES ==========\n');
  
  // 1. Restaurant GH
  console.log('1️⃣ Probando Restaurant GH...');
  const restaurantResult = await testWithTimeout(
    'Restaurant GH',
    'Restaurantes',
    async () => {
      const response = await restaurantSoapAdapter.buscarServicios('');
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(restaurantResult);
  console.log(`   ${restaurantResult.status} - ${restaurantResult.message} (${restaurantResult.responseTime}ms)`);
  
  // 2. Cafeteria
  console.log('2️⃣ Probando Cafeteria...');
  const cafeteria = new CafeteriaSoapAdapter(config.endpoints.cafeteria);
  const cafeteriaResult = await testWithTimeout(
    'Cafeteria',
    'Restaurantes',
    async () => {
      const response = await cafeteria.buscarServicios();
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(cafeteriaResult);
  console.log(`   ${cafeteriaResult.status} - ${cafeteriaResult.message} (${cafeteriaResult.responseTime}ms)`);
  
  // 3. El Cangrejo Feliz
  console.log('3️⃣ Probando El Cangrejo Feliz...');
  const cangrejoFeliz = new ElCangrejoFelizSoapAdapter(config.endpoints.cangrejoFeliz);
  const cangrejoFelizResult = await testWithTimeout(
    'El Cangrejo Feliz',
    'Restaurantes',
    async () => {
      const response = await cangrejoFeliz.buscarServicios('');
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(cangrejoFelizResult);
  console.log(`   ${cangrejoFelizResult.status} - ${cangrejoFelizResult.message} (${cangrejoFelizResult.responseTime}ms)`);
}

/**
 * Prueba servicios de vuelos
 */
async function testFlightServices() {
  console.log('\n✈️ ========== PROBANDO SERVICIOS DE VUELOS ==========\n');
  
  // 1. Sky Andes
  console.log('1️⃣ Probando Sky Andes...');
  const skyAndes = new SkyAndesFlightSoapAdapter(config.endpoints.skyandes);
  const skyAndesResult = await testWithTimeout(
    'Sky Andes',
    'Vuelos',
    async () => {
      const response = await skyAndes.buscarServicios(1, 2, new Date(), 'Economy');
      return { count: response.length, sample: response[0] };
    }
  );
  results.push(skyAndesResult);
  console.log(`   ${skyAndesResult.status} - ${skyAndesResult.message} (${skyAndesResult.responseTime}ms)`);
}

/**
 * Genera reporte final
 */
function generateReport() {
  console.log('\n\n📊 ========== REPORTE FINAL ==========\n');
  
  const byCategory: Record<string, TestResult[]> = {};
  
  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  });
  
  let totalOK = 0;
  let totalError = 0;
  let totalTimeout = 0;
  
  Object.entries(byCategory).forEach(([category, categoryResults]) => {
    console.log(`\n${getCategoryIcon(category)} ${category.toUpperCase()}`);
    console.log('━'.repeat(50));
    
    categoryResults.forEach(result => {
      const icon = result.status === 'OK' ? '✅' : result.status === 'TIMEOUT' ? '⏱️' : '❌';
      console.log(`${icon} ${result.service.padEnd(25)} - ${result.status.padEnd(8)} (${result.responseTime}ms)`);
      
      if (result.status === 'OK') totalOK++;
      else if (result.status === 'TIMEOUT') totalTimeout++;
      else totalError++;
    });
  });
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n📈 RESUMEN GENERAL:');
  console.log(`   Total de servicios probados: ${results.length}`);
  console.log(`   ✅ Funcionando:  ${totalOK}`);
  console.log(`   ❌ Con errores:  ${totalError}`);
  console.log(`   ⏱️ Timeout:      ${totalTimeout}`);
  console.log(`   📊 Tasa de éxito: ${((totalOK / results.length) * 100).toFixed(1)}%`);
  
  // Servicios con problemas
  if (totalError > 0 || totalTimeout > 0) {
    console.log('\n\n⚠️ ========== SERVICIOS CON PROBLEMAS ==========\n');
    
    results
      .filter(r => r.status !== 'OK')
      .forEach(result => {
        console.log(`\n🔴 ${result.service} (${result.category})`);
        console.log(`   Estado: ${result.status}`);
        console.log(`   Mensaje: ${result.message}`);
        if (result.details && typeof result.details === 'string') {
          console.log(`   Detalles: ${result.details.substring(0, 200)}...`);
        }
      });
  }
  
  // Promedio de tiempos de respuesta por categoría
  console.log('\n\n⚡ ========== TIEMPOS DE RESPUESTA ==========\n');
  
  Object.entries(byCategory).forEach(([category, categoryResults]) => {
    const avgTime = categoryResults
      .filter(r => r.status === 'OK' && r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
      categoryResults.filter(r => r.status === 'OK').length;
    
    if (!isNaN(avgTime)) {
      console.log(`${getCategoryIcon(category)} ${category}: ${avgTime.toFixed(0)}ms promedio`);
    }
  });
  
  console.log('\n' + '═'.repeat(50) + '\n');
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Autos': return '🚗';
    case 'Hoteles': return '🏨';
    case 'Restaurantes': return '🍽️';
    case 'Vuelos': return '✈️';
    default: return '📦';
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  PRUEBA COMPLETA DE APIS INTEGRADAS AL ESB               ║');
  console.log('║  Sistema de Booking Multi-Servicio                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`⏰ Inicio: ${new Date().toLocaleString()}`);
  console.log(`⚙️ Timeout por servicio: ${TIMEOUT_MS}ms`);
  
  try {
    await testCarServices();
    await testHotelServices();
    await testRestaurantServices();
    await testFlightServices();
    
    generateReport();
    
    console.log(`\n⏰ Finalizado: ${new Date().toLocaleString()}\n`);
    
    // Exit code basado en resultados
    const hasErrors = results.some(r => r.status === 'ERROR' || r.status === 'TIMEOUT');
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Error fatal en la ejecución:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
