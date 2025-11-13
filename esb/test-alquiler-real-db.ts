/**
 * Test Alquiler Augye - Con Datos Reales de la DB
 * Basado en los INSERT que proporcionó tu amigo
 */

import { AlquilerAugyeSoapAdapter } from './gateway/alquiler-augye.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();
const adapter = new AlquilerAugyeSoapAdapter(config.endpoints.alquilerAugye);

async function testWithRealData() {
  console.log('\n🚗 ALQUILER AUGYE - Prueba con Datos Reales de la DB\n');
  console.log('═'.repeat(70));
  console.log('DATOS EN LA BASE DE DATOS:');
  console.log('  Auto: Toyota Yaris 2021');
  console.log('  Categoría: ECONOMY');
  console.log('  Transmisión: AT (Automática)');
  console.log('  Placa: PBA-1010');
  console.log('  Agencia: AGQ1 (Quito)');
  console.log('  Ciudad: Quito');
  console.log('  Precio: $30/día');
  console.log('  Disponible: 1 (SÍ)');
  console.log('  ID Auto: 1');
  console.log('═'.repeat(70));
  
  try {
    // TEST 1: Buscar SIN filtros
    console.log('\n📋 TEST 1: buscarServicios (SIN filtros)');
    console.log('─'.repeat(70));
    
    let servicios = await adapter.buscarServicios({
      page: 1,
      pageSize: 20
    });
    
    console.log(`✅ Respuesta: ${servicios.length} autos encontrados`);
    if (servicios.length > 0) {
      servicios.forEach((auto, i) => {
        console.log(`\n  ${i + 1}. ${auto.marca} ${auto.modelo}`);
        console.log(`     SKU: ${auto.sku}`);
        console.log(`     Categoría: ${auto.categoria}`);
        console.log(`     Transmisión: ${auto.gearbox}`);
        console.log(`     Precio: $${auto.precioDia}/día`);
        console.log(`     Ciudad: ${auto.ciudad}`);
      });
    }

    // TEST 2: Buscar por ciudad Quito
    console.log('\n\n📋 TEST 2: buscarServicios (Ciudad = Quito)');
    console.log('─'.repeat(70));
    
    servicios = await adapter.buscarServicios({
      ciudad: 'Quito',
      page: 1,
      pageSize: 20
    });
    
    console.log(`✅ Respuesta: ${servicios.length} autos en Quito`);
    if (servicios.length > 0) {
      servicios.forEach((auto, i) => {
        console.log(`\n  ${i + 1}. ${auto.marca} ${auto.modelo} - ${auto.ciudad}`);
      });
    }

    // TEST 3: Buscar por categoría ECONOMY
    console.log('\n\n📋 TEST 3: buscarServicios (Categoría = ECONOMY)');
    console.log('─'.repeat(70));
    
    servicios = await adapter.buscarServicios({
      categoria: 'ECONOMY',
      page: 1,
      pageSize: 20
    });
    
    console.log(`✅ Respuesta: ${servicios.length} autos ECONOMY`);
    if (servicios.length > 0) {
      servicios.forEach((auto, i) => {
        console.log(`\n  ${i + 1}. ${auto.marca} ${auto.modelo} - ${auto.categoria}`);
      });
    }

    // TEST 4: Buscar por transmisión AT
    console.log('\n\n📋 TEST 4: buscarServicios (Transmisión = AT)');
    console.log('─'.repeat(70));
    
    servicios = await adapter.buscarServicios({
      gearbox: 'AT',
      page: 1,
      pageSize: 20
    });
    
    console.log(`✅ Respuesta: ${servicios.length} autos Automáticos`);
    if (servicios.length > 0) {
      servicios.forEach((auto, i) => {
        console.log(`\n  ${i + 1}. ${auto.marca} ${auto.modelo} - ${auto.gearbox}`);
      });
    }

    // TEST 5: Buscar con filtros combinados
    console.log('\n\n📋 TEST 5: buscarServicios (Quito + ECONOMY + AT)');
    console.log('─'.repeat(70));
    
    servicios = await adapter.buscarServicios({
      ciudad: 'Quito',
      categoria: 'ECONOMY',
      gearbox: 'AT',
      page: 1,
      pageSize: 20
    });
    
    console.log(`✅ Respuesta: ${servicios.length} autos (Quito + ECONOMY + AT)`);
    if (servicios.length > 0) {
      servicios.forEach((auto, i) => {
        console.log(`\n  ${i + 1}. ${auto.marca} ${auto.modelo}`);
        console.log(`     Ciudad: ${auto.ciudad}`);
        console.log(`     Categoría: ${auto.categoria}`);
        console.log(`     Transmisión: ${auto.gearbox}`);
        console.log(`     Precio: $${auto.precioDia}/día`);
      });

      // TEST 6: Obtener detalle del auto encontrado
      console.log('\n\n📋 TEST 6: obtenerDetalleServicio (SKU del auto encontrado)');
      console.log('─'.repeat(70));
      
      const detalle = await adapter.obtenerDetalleServicio(servicios[0].sku);
      console.log(`\n✅ Detalle completo del ${detalle.marca} ${detalle.modelo}:`);
      console.log(`   SKU: ${detalle.sku}`);
      console.log(`   Categoría: ${detalle.categoria}`);
      console.log(`   Transmisión: ${detalle.gearbox}`);
      console.log(`   Ciudad: ${detalle.ciudad}`);
      console.log(`   Hotel: ${detalle.hotel || 'N/A'}`);
      console.log(`   Oficina Retiro: ${detalle.pickupOffice}`);
      console.log(`   Oficina Devolución: ${detalle.dropoffOffice}`);
      console.log(`   Precio/Día: $${detalle.precioDia.toFixed(2)}`);
      console.log(`   Imágenes: ${detalle.imagenes.length}`);
      console.log(`   Políticas: ${detalle.politicas}`);
      console.log(`   Reglas: ${detalle.reglas}`);

      // TEST 7: Verificar disponibilidad (fechas del carrito en la DB)
      console.log('\n\n📋 TEST 7: verificarDisponibilidad (30 oct - 2 nov)');
      console.log('─'.repeat(70));
      
      const disponible = await adapter.verificarDisponibilidad(
        servicios[0].sku,
        '2025-10-30T09:00:00',
        '2025-11-02T09:00:00',
        1
      );
      
      console.log(`✅ Disponibilidad: ${disponible ? '✓ DISPONIBLE' : '✗ NO DISPONIBLE'}`);

      // TEST 8: Cotizar reserva (3 días como en la DB)
      console.log('\n\n📋 TEST 8: cotizarReserva (3 días, $30/día)');
      console.log('─'.repeat(70));
      
      const cotizacion = await adapter.cotizarReserva([{
        sku: servicios[0].sku,
        dias: 3,
        precioDia: 30
      }]);
      
      console.log(`\n✅ Cotización:`);
      console.log(`   Subtotal: $${cotizacion.subtotal.toFixed(2)}`);
      console.log(`   Impuestos: $${cotizacion.impuestos.toFixed(2)}`);
      console.log(`   Total: $${cotizacion.total.toFixed(2)}`);
      console.log(`\n   (Esperado según DB: Subtotal=$90, Impuestos=$10.80, Total=$100.80)`);
    }

    console.log('\n\n═'.repeat(70));
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('═'.repeat(70));
    
    if (servicios.length === 0) {
      console.log('\n⚠️  NO SE ENCONTRARON AUTOS');
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   1. El campo "Disponible" no está en 1');
      console.log('   2. El SOAP busca en otra tabla');
      console.log('   3. Hay un filtro interno que oculta el auto');
      console.log('   4. Los datos están en otra base de datos');
      console.log('\n📞 SOLUCIÓN: Pregúntale a tu amigo si el Toyota Yaris');
      console.log('   aparece cuando hace la búsqueda desde su frontend local\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWithRealData().catch(console.error);
