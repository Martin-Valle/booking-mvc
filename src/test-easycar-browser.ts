/**
 * Test directo de Easy Car desde el navegador
 * Abrir DevTools Console y pegar este código
 */

// Test 1: Verificar que ESB está habilitado
console.log("🔍 Test 1: Verificando ESB...");
console.log("VITE_USE_ESB:", import.meta.env.VITE_USE_ESB);

// Test 2: Probar búsqueda
console.log("\n🔍 Test 2: Probando búsqueda Easy Car...");

async function testEasyCar() {
  try {
    // Importar el adapter directamente
    const { EasyCarSoapAdapter } = await import('../esb/gateway/easy-car.adapter');
    const { getESBConfig } = await import('../esb/utils/config');
    
    console.log("✅ Imports exitosos");
    
    const config = getESBConfig();
    console.log("📋 Config:", config.endpoints.easyCar);
    
    const adapter = new EasyCarSoapAdapter(config.endpoints.easyCar);
    console.log("✅ Adapter creado");
    
    console.log("🔄 Llamando buscarServicios...");
    const vehiculos = await adapter.buscarServicios();
    
    console.log(`✅ Respuesta recibida: ${vehiculos.length} vehículos`);
    console.log("📦 Vehículos:", vehiculos);
    
    if (vehiculos.length > 0) {
      console.log("\n🚗 Primer vehículo:");
      console.log(vehiculos[0]);
    }
    
    return vehiculos;
  } catch (error: any) {
    console.error("❌ Error en test:", error);
    console.error("Stack:", error?.stack);
    throw error;
  }
}

// Ejecutar test
testEasyCar();

export { testEasyCar };
