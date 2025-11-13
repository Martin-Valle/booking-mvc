/**
 * WeWorkHub - Test Rápido con Datos de Quito
 */

import { WeWorkHubIntegracionSoapAdapter } from './gateway/weworkhub-integracion.adapter';
import { getESBConfig } from './utils/config';

async function quickTest() {
  console.log('🔍 TEST RÁPIDO: WeWorkHub Integración - Quito\n');
  
  const config = getESBConfig();
  const adapter = new WeWorkHubIntegracionSoapAdapter(config.endpoints.weWorkHubIntegracion);
  
  try {
    const filtros = {
      serviceType: 'HOTEL' as const,
      ciudad: 'Quito',
      fechaInicio: '2025-11-01',
      fechaFin: '2025-11-03',
      precioMin: 30,
      precioMax: 120,
      amenities: ['WiFi', 'Desayuno'],
      clasificacionMin: 3,
      adultos: 2,
      ninos: 0
    };

    console.log('📤 Buscando hoteles en Quito...');
    console.log('   Fechas: 2025-11-01 → 2025-11-03');
    console.log('   Precio: $30 - $120');
    console.log('   Amenities: WiFi, Desayuno');
    console.log('   Clasificación mínima: 3 ⭐\n');

    const servicios = await adapter.buscarServicios(filtros);
    
    console.log(`✅ Resultado: ${servicios.length} hoteles encontrados\n`);
    
    if (servicios.length > 0) {
      console.log('📋 HOTELES ENCONTRADOS:\n');
      servicios.forEach((s, i) => {
        console.log(`${i + 1}. ${s.nombre}`);
        console.log(`   Ciudad: ${s.ciudad}`);
        console.log(`   Precio desde: ${s.moneda} ${s.precioDesde}`);
        console.log(`   Clasificación: ${s.clasificacion} ⭐`);
        console.log(`   Amenities: ${s.amenities.join(', ')}`);
        console.log(`   Disponible: ${s.disponible ? '✅ Sí' : '❌ No'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron hoteles con esos criterios');
      console.log('   Posibles causas:');
      console.log('   - Base de datos vacía para Quito');
      console.log('   - No hay hoteles en el rango de precio $30-$120');
      console.log('   - No hay hoteles con clasificación 3⭐ o superior');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Respuesta del servidor:', error.response.status);
    }
  }
}

quickTest().catch(console.error);
