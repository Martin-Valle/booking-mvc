/**
 * Test Alquiler Augye - Sin Filtros
 * Para ver todos los autos disponibles en el sistema
 */

import { AlquilerAugyeSoapAdapter } from './gateway/alquiler-augye.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new AlquilerAugyeSoapAdapter(config.endpoints.alquilerAugye);

async function testSimple() {
  console.log('\n🚗 ALQUILER AUGYE - Prueba Simple (Sin Filtros)\n');
  
  try {
    // Test 1: Buscar SIN filtros (todos los autos)
    console.log('📋 TEST 1: buscarServicios SIN filtros');
    console.log('─'.repeat(60));
    
    const servicios = await adapter.buscarServicios({
      page: 1,
      pageSize: 20
    });
    
    console.log(`✅ Respuesta recibida: ${servicios.length} autos encontrados\n`);
    
    if (servicios.length > 0) {
      console.log('AUTOS DISPONIBLES:');
      servicios.forEach((auto, index) => {
        console.log(`\n${index + 1}. ${auto.marca} ${auto.modelo}`);
        console.log(`   SKU: ${auto.sku}`);
        console.log(`   Categoría: ${auto.categoria}`);
        console.log(`   Transmisión: ${auto.gearbox}`);
        console.log(`   Precio/Día: $${auto.precioDia.toFixed(2)}`);
        console.log(`   Ciudad: ${auto.ciudad}`);
        console.log(`   Imagen: ${auto.imagen || 'N/A'}`);
      });
      
      // Test 2: Obtener detalle del primer auto
      console.log('\n\n📋 TEST 2: obtenerDetalleServicio (primer auto)');
      console.log('─'.repeat(60));
      
      const detalle = await adapter.obtenerDetalleServicio(servicios[0].sku);
      console.log(`\n✅ Detalle del ${detalle.marca} ${detalle.modelo}:`);
      console.log(`   SKU: ${detalle.sku}`);
      console.log(`   Categoría: ${detalle.categoria}`);
      console.log(`   Transmisión: ${detalle.gearbox}`);
      console.log(`   Ciudad: ${detalle.ciudad}`);
      console.log(`   Hotel: ${detalle.hotel || 'N/A'}`);
      console.log(`   Oficina Retiro: ${detalle.pickupOffice}`);
      console.log(`   Oficina Devolución: ${detalle.dropoffOffice}`);
      console.log(`   Precio/Día: $${detalle.precioDia.toFixed(2)}`);
      console.log(`   Imágenes: ${detalle.imagenes.length}`);
      detalle.imagenes.forEach((img, i) => console.log(`     ${i + 1}. ${img}`));
      console.log(`   Políticas: ${detalle.politicas}`);
      console.log(`   Reglas: ${detalle.reglas}`);
      
    } else {
      console.log('⚠️  No hay autos en la base de datos');
      console.log('\n💡 SOLUCIÓN: Necesitas insertar datos en la DB:');
      console.log('   INSERT INTO dbo.Autos(Marca,Modelo,Anio,Categoria,Gearbox,');
      console.log('                         Placa,AgencyId,City,Hotel,PrecioDia,Disponible)');
      console.log('   VALUES');
      console.log('   (\'Toyota\',\'Yaris\',2021,\'ECONOMY\',\'AT\',\'PBA-1010\',');
      console.log('    \'AGQ1\',\'Quito\',NULL,30,1);');
    }
    
    console.log('\n✅ Pruebas completadas\n');
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimple().catch(console.error);
