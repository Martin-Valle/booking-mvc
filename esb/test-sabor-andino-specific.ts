/**
 * Sabor Andino - Test de casos específicos que fallaban
 * Test 2: obtenerDetalleServicio con ID 2
 * Test 3: verificarDisponibilidad con SKU 101
 */

import { SaborAndinoSoapAdapter } from './gateway/sabor-andino.adapter';
import { getESBConfig } from './utils/config';

async function testSaborAndinoFallidos() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SABOR ANDINO - TEST DE CASOS ESPECÍFICOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const config = getESBConfig();
  const adapter = new SaborAndinoSoapAdapter(config.endpoints.saborAndino);

  // ============================================================================
  // TEST 2: Obtener Detalle Servicio (ID 2)
  // ============================================================================
  console.log('🔍 TEST 2: obtenerDetalleServicio (ID: 2)');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    console.log('📤 Request:');
    console.log('   ID Servicio: 2\n');
    
    const detalle = await adapter.obtenerDetalleServicio(2);
    
    console.log('✅ Detalle obtenido exitosamente:\n');
    console.log('   📋 Servicio:');
    console.log(`      ID: ${detalle.IdServicio}`);
    console.log(`      Nombre: ${detalle.Nombre}`);
    console.log(`      Tipo: ${detalle.Tipo}`);
    console.log(`      Ciudad: ${detalle.Ciudad}`);
    console.log(`      Descripción: ${detalle.Descripcion}`);
    console.log(`      Precio: ${detalle.Precio}`);
    console.log(`      Clasificación: ${detalle.Clasificacion}`);
    
    console.log(`\n   🖼️  Imagen:`);
    console.log(`      ${detalle.ImagenURL || 'No disponible'}`);
    
    console.log(`\n   📜 Políticas:`);
    console.log(`      ${detalle.Politicas || 'No especificadas'}`);
    
    console.log(`\n   📝 Reglas:`);
    console.log(`      ${detalle.Reglas || 'No especificadas'}`);
    
    console.log('');
  } catch (error: any) {
    console.error('❌ Error en obtenerDetalleServicio:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data?.substring(0, 200));
    }
    console.log('');
  }

  // ============================================================================
  // TEST 3: Verificar Disponibilidad (SKU 101)
  // ============================================================================
  console.log('🔍 TEST 3: verificarDisponibilidad (SKU: 101)');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  try {
    console.log('📤 Request:');
    console.log('   SKU: 101');
    console.log('   Inicio: 2025-10-27T12:00:00');
    console.log('   Fin: 2025-10-27T14:00:00');
    console.log('   Unidades: 2\n');
    
    const resultado = await adapter.verificarDisponibilidad(
      101,
      new Date('2025-10-27T12:00:00'),
      new Date('2025-10-27T14:00:00'),
      2
    );
    
    if (resultado.Disponible) {
      console.log('✅ DISPONIBLE');
      console.log('   El servicio está disponible para las fechas solicitadas');
      console.log('   Se pueden reservar 2 unidades');
    } else {
      console.log('⚠️  NO DISPONIBLE');
      console.log('   El servicio NO está disponible para las fechas solicitadas');
      console.log('   Posibles causas:');
      console.log('   - Mesa/servicio ya reservado');
      console.log('   - Horario fuera del horario de atención');
      console.log('   - Capacidad insuficiente');
    }
    
    console.log('');
  } catch (error: any) {
    console.error('❌ Error en verificarDisponibilidad:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data?.substring(0, 200));
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FIN DE LAS PRUEBAS');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Ejecutar tests
testSaborAndinoFallidos().catch(console.error);
