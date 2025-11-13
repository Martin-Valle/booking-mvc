/**
 * 🚗 Test del servicio SOAP de Arriendo de Autos Cuenca
 * Prueba todas las operaciones del servicio de alquiler de vehículos
 */

import { ESB } from './index';

async function testCuencaCar() {
  console.log('\n🚗 ===== PRUEBAS DEL SERVICIO DE ARRIENDO DE AUTOS CUENCA =====\n');
  console.log('🔗 Endpoint: http://wscuencaarriendoautos.runasp.net/WS_IntegracionServicioAUTOS.asmx');
  console.log('🔖 Namespace: http://arriendoautos.com/integracion\n');

  let errorDetails = {
    buscarServicios: null as any,
    obtenerDetalle: null as any,
    verificarDisponibilidad: null as any,
    cotizar: null as any,
    preReserva: null as any,
    confirmar: null as any,
    cancelar: null as any
  };

  // ==================== 1️⃣ BUSCAR SERVICIOS ====================
  try {
    console.log('1️⃣ BUSCAR AUTOS DISPONIBLES (ciudad: Cuenca, categoría: SUV)...');
    const autos = await ESB.cuencaCar.buscarServicios('Cuenca', 'SUV');
    console.log(`✅ Encontrados ${autos.length} autos:`);
    autos.forEach(auto => {
      console.log(`   - ${auto.Marca} ${auto.Modelo} (${auto.Categoria})`);
      console.log(`     ID: ${auto.IdVehiculo}, Precio/día: $${auto.PrecioDia}`);
      console.log(`     Ciudad: ${auto.Ciudad}, Transmisión: ${auto.Transmision}`);
      console.log(`     Disponible: ${auto.Disponible ? 'Sí' : 'No'}`);
    });

    if (autos.length > 0) {
      const primerAuto = autos[0];

      // ==================== 2️⃣ OBTENER DETALLE ====================
      try {
        console.log(`\n2️⃣ OBTENER DETALLE DEL AUTO ID: ${primerAuto.IdVehiculo}...`);
        const detalle = await ESB.cuencaCar.obtenerDetalle(primerAuto.IdVehiculo);
        console.log('✅ Detalle obtenido:');
        console.log(`   Vehículo: ${detalle.Marca} ${detalle.Modelo}`);
        console.log(`   Categoría: ${detalle.Categoria}`);
        console.log(`   Transmisión: ${detalle.Transmision}`);
        console.log(`   Precio/día: $${detalle.PrecioDia}`);
        console.log(`   Agencia: ${detalle.Agencia}`);
        console.log(`   Ciudad: ${detalle.Ciudad}`);
        console.log(`   Dirección: ${detalle.Direccion}`);
        console.log(`   Imágenes: ${detalle.Imagenes.length} disponibles`);
      } catch (error: any) {
        errorDetails.obtenerDetalle = captureError(error);
        console.log('❌ Error en ObtenerDetalleServicio');
        showErrorDetails(error);
      }

      // ==================== 3️⃣ VERIFICAR DISPONIBILIDAD ====================
      try {
        const inicio = new Date('2025-11-15');
        const fin = new Date('2025-11-20');
        console.log(`\n3️⃣ VERIFICAR DISPONIBILIDAD (${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()})...`);
        const disponible = await ESB.cuencaCar.verificarDisponibilidad(primerAuto.IdVehiculo, inicio, fin, 1);
        console.log(`✅ Disponibilidad: ${disponible ? '✓ Disponible' : '✗ No disponible'}`);
      } catch (error: any) {
        errorDetails.verificarDisponibilidad = captureError(error);
        console.log('❌ Error en VerificarDisponibilidad');
        showErrorDetails(error);
      }

      // ==================== 4️⃣ COTIZAR RESERVA ====================
      try {
        const inicio = new Date('2025-11-15');
        const fin = new Date('2025-11-20');
        console.log('\n4️⃣ COTIZAR RESERVA (5 días)...');
        const cotizacion = await ESB.cuencaCar.cotizar(primerAuto.IdVehiculo, inicio, fin);
        console.log('✅ Cotización:');
        console.log(`   Total: $${cotizacion.Total}`);
        console.log(`   IVA: $${cotizacion.IVA}`);
        console.log(`   Neto: $${cotizacion.Neto}`);
        console.log(`   Desglose:`);
        cotizacion.Detalle.forEach(item => {
          console.log(`     - ${item.Concepto}: $${item.Valor}`);
        });

        // ==================== 5️⃣ CREAR PRE-RESERVA ====================
        try {
          console.log('\n5️⃣ CREAR PRE-RESERVA...');
          const preReserva = await ESB.cuencaCar.crearPreReserva(primerAuto.IdVehiculo, 1);
          console.log(`✅ Pre-reserva creada: ${preReserva.PreBookingId}`);
          console.log(`   Expira en: ${new Date(preReserva.ExpiraEn).toLocaleString()}`);

          // ==================== 6️⃣ CONFIRMAR RESERVA ====================
          try {
            console.log('\n6️⃣ CONFIRMAR RESERVA...');
            const reserva = await ESB.cuencaCar.confirmarReserva(
              preReserva.PreBookingId,
              'Tarjeta de crédito',
              cotizacion.Total
            );
            console.log(`✅ Reserva confirmada:`);
            console.log(`   Booking ID: ${reserva.BookingId}`);
            console.log(`   Estado: ${reserva.Estado}`);

            // ==================== 7️⃣ CANCELAR RESERVA ====================
            try {
              console.log('\n7️⃣ CANCELAR RESERVA...');
              const cancelado = await ESB.cuencaCar.cancelar(
                reserva.BookingId,
                'Prueba de integración - cancelación automática'
              );
              console.log(`✅ Reserva cancelada: ${cancelado ? '✓ Éxito' : '✗ Error'}`);
            } catch (error: any) {
              errorDetails.cancelar = captureError(error);
              console.log('❌ Error en CancelarReserva');
              showErrorDetails(error);
            }
          } catch (error: any) {
            errorDetails.confirmar = captureError(error);
            console.log('❌ Error en ConfirmarReserva');
            showErrorDetails(error);
          }
        } catch (error: any) {
          errorDetails.preReserva = captureError(error);
          console.log('❌ Error en CrearPreReserva');
          showErrorDetails(error);
        }
      } catch (error: any) {
        errorDetails.cotizar = captureError(error);
        console.log('❌ Error en CotizarReserva');
        showErrorDetails(error);
      }
    }
  } catch (error: any) {
    errorDetails.buscarServicios = captureError(error);
    console.log('❌ Error en BuscarServicios');
    showErrorDetails(error);
  }

  // ==================== RESUMEN ====================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE PRUEBAS - ARRIENDO DE AUTOS CUENCA');
  console.log('='.repeat(70));

  const operations = [
    { name: 'BuscarServicios', error: errorDetails.buscarServicios },
    { name: 'ObtenerDetalleServicio', error: errorDetails.obtenerDetalle },
    { name: 'VerificarDisponibilidad', error: errorDetails.verificarDisponibilidad },
    { name: 'CotizarReserva', error: errorDetails.cotizar },
    { name: 'CrearPreReserva', error: errorDetails.preReserva },
    { name: 'ConfirmarReserva', error: errorDetails.confirmar },
    { name: 'CancelarReserva', error: errorDetails.cancelar }
  ];

  let successCount = 0;
  let failCount = 0;

  operations.forEach(op => {
    if (op.error === null) {
      console.log(`✅ ${op.name.padEnd(30)} - Éxito`);
      successCount++;
    } else {
      console.log(`❌ ${op.name.padEnd(30)} - Error: ${op.error.type}`);
      failCount++;
    }
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`Total: ${operations.length} operaciones | ✅ Éxito: ${successCount} | ❌ Error: ${failCount}`);
  console.log(`Tasa de éxito: ${((successCount / operations.length) * 100).toFixed(1)}%`);

  if (errorDetails.buscarServicios) {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 ANÁLISIS DETALLADO DEL ERROR PRINCIPAL');
    console.log('='.repeat(70));
    const err = errorDetails.buscarServicios;
    console.log(`\nTipo de error: ${err.type}`);
    console.log(`HTTP Status: ${err.httpStatus}`);
    
    if (err.rootCause) {
      console.log(`\n🎯 Causa raíz identificada:`);
      console.log(err.rootCause);
    }
    
    if (err.errorLocation) {
      console.log(`\n📍 Ubicación del error:`);
      console.log(err.errorLocation);
    }
    
    if (err.stackTrace) {
      console.log(`\n� Stack trace (primeras líneas):`);
      err.stackTrace.split('\n').forEach((line: string) => {
        if (line.trim()) console.log(`   ${line}`);
      });
    }

    if (err.serverMessage) {
      console.log(`\n📝 Mensaje completo del servidor:`);
      const lines = err.serverMessage.split('\n').slice(0, 15);
      lines.forEach((line: string) => {
        if (line.trim()) console.log(`   ${line.trim()}`);
      });
    }

    console.log('\n💡 Diagnóstico:');
    console.log('   El servicio SOAP de Arriendo de Autos tiene un error de configuración');
    console.log('   en Entity Framework. El ensamblado EntityFramework.SqlServer no está');
    console.log('   correctamente registrado en el archivo de configuración del servidor.');
    console.log('\n🔧 Solución requerida (lado del servidor):');
    console.log('   1. Verificar que EntityFramework.SqlServer esté instalado');
    console.log('   2. Agregar en Web.config o App.config:');
    console.log('      <entityFramework>');
    console.log('        <providers>');
    console.log('          <provider invariantName="System.Data.SqlClient"');
    console.log('            type="System.Data.Entity.SqlServer.SqlProviderServices,');
    console.log('                  EntityFramework.SqlServer" />');
    console.log('        </providers>');
    console.log('      </entityFramework>');
    console.log('   3. Asegurar que el ensamblado esté en la carpeta bin del servidor');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

function captureError(error: any) {
  const captured: any = {
    type: 'Unknown',
    httpStatus: error.response?.status || 'N/A',
    message: error.message || 'No message',
    serverMessage: '',
    rootCause: '',
    stackTrace: '',
    fullSoapFault: ''
  };

  if (error.response?.data) {
    const data = typeof error.response.data === 'string' 
      ? error.response.data 
      : JSON.stringify(error.response.data);
    
    captured.fullSoapFault = data;
    
    // Extraer tipo de error
    if (data.includes('Entity Framework')) {
      captured.type = 'Entity Framework Configuration Error';
    } else if (data.includes('MySQL') || data.includes('database')) {
      captured.type = 'Database Connection Error';
    } else if (data.includes('SqlServer')) {
      captured.type = 'SQL Server Provider Error';
    } else if (data.includes('soap:Fault')) {
      captured.type = 'SOAP Fault';
    }

    // Extraer mensaje del servidor (limpiar HTML entities)
    const faultStringMatch = data.match(/<faultstring>(.*?)<\/faultstring>/s);
    if (faultStringMatch) {
      captured.serverMessage = faultStringMatch[1]
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/\\r\\n/g, '\n')
        .replace(/\r\n/g, '\n');
    }

    // Intentar extraer causa raíz (primera línea del error)
    if (data.includes('System.InvalidOperationException')) {
      const match = data.match(/System\.InvalidOperationException:\s*([^\r\n]+)/);
      if (match) captured.rootCause = match[1].trim();
    }

    // Extraer archivo y línea donde ocurrió el error
    const fileMatch = data.match(/in ([A-Z]:\\[^:]+):line (\d+)/);
    if (fileMatch) {
      captured.errorLocation = `${fileMatch[1]} (línea ${fileMatch[2]})`;
    }

    // Extraer stack trace (primeras líneas relevantes)
    const stackLines = data.match(/at ([^\r\n]+)/g);
    if (stackLines) {
      captured.stackTrace = stackLines
        .slice(0, 5)
        .map((line: string) => line.replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
        .join('\n');
    }
  }

  return captured;
}

function showErrorDetails(error: any) {
  const details = captureError(error);
  console.log(`   Tipo: ${details.type}`);
  console.log(`   HTTP: ${details.httpStatus}`);
  
  if (details.rootCause) {
    console.log(`   Causa: ${details.rootCause.substring(0, 150)}...`);
  }
}

// Ejecutar pruebas
testCuencaCar();
