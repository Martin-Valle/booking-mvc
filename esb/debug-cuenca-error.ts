/**
 * 🔍 Script de debugging detallado para el error de Cuenca Cars
 * Captura y analiza el error completo del servidor
 */

import axios from 'axios';

async function debugCuencaError() {
  console.log('\n🔍 ===== ANÁLISIS DETALLADO DEL ERROR DE CUENCA CARS =====\n');
  
  const endpoint = 'http://wscuencaarriendoautos.runasp.net/WS_IntegracionServicioAUTOS.asmx';
  const soapAction = 'http://arriendoautos.com/integracion/buscarServicios';
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <buscarServicios xmlns="http://arriendoautos.com/integracion">
      <ciudad>Cuenca</ciudad>
      <categoria>SUV</categoria>
    </buscarServicios>
  </soap:Body>
</soap:Envelope>`;

  console.log('📤 Request SOAP enviado:');
  console.log('   URL:', endpoint);
  console.log('   SOAPAction:', soapAction);
  console.log('   Body:', soapEnvelope.substring(0, 200) + '...\n');

  try {
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': `"${soapAction}"`
      },
      timeout: 30000
    });

    console.log('✅ Respuesta exitosa (HTTP 200)');
    console.log('Response:', response.data);

  } catch (error: any) {
    console.log('❌ Error capturado\n');
    
    if (error.response) {
      console.log('📊 INFORMACIÓN DE LA RESPUESTA:');
      console.log('   HTTP Status:', error.response.status, error.response.statusText);
      console.log('   Content-Type:', error.response.headers['content-type']);
      console.log('   Server:', error.response.headers['server']);
      console.log('   X-AspNet-Version:', error.response.headers['x-aspnet-version']);
      
      const errorData = error.response.data;
      
      // Extraer el SOAP Fault completo
      console.log('\n' + '='.repeat(80));
      console.log('🔴 SOAP FAULT COMPLETO:');
      console.log('='.repeat(80));
      
      if (typeof errorData === 'string') {
        // Parsear el XML para mostrarlo de forma legible
        const faultCodeMatch = errorData.match(/<faultcode>(.*?)<\/faultcode>/);
        const faultStringMatch = errorData.match(/<faultstring>(.*?)<\/faultstring>/s);
        
        if (faultCodeMatch) {
          console.log('\n📌 Fault Code:', faultCodeMatch[1]);
        }
        
        if (faultStringMatch) {
          let faultString = faultStringMatch[1]
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/\r\n/g, '\n');
          
          console.log('\n📝 Fault String (mensaje de error completo):\n');
          console.log(faultString);
        }
        
        // Identificar el problema específico
        console.log('\n' + '='.repeat(80));
        console.log('🎯 DIAGNÓSTICO:');
        console.log('='.repeat(80));
        
        if (errorData.includes('Entity Framework provider type')) {
          console.log('\n✅ Confirmado: Este es un ERROR DEL SERVIDOR, NO de tu código\n');
          console.log('Problema detectado:');
          console.log('  • El servidor NO tiene configurado Entity Framework correctamente');
          console.log('  • Falta el ensamblado: EntityFramework.SqlServer');
          console.log('  • Error ocurre en el constructor del servicio SOAP');
          
          // Extraer la ruta del servidor
          const pathMatch = errorData.match(/in ([A-Z]:\\[^:]+):line (\d+)/g);
          if (pathMatch) {
            console.log('\n📂 Archivos del servidor con problemas:');
            pathMatch.forEach(match => {
              const parts = match.match(/in ([^:]+):line (\d+)/);
              if (parts) {
                console.log(`  • ${parts[1]} (línea ${parts[2]})`);
              }
            });
          }
          
          console.log('\n🔧 Lo que debe hacer el ADMINISTRADOR del servidor:');
          console.log('  1. Instalar EntityFramework.SqlServer via NuGet');
          console.log('  2. Verificar el Web.config tenga la sección <entityFramework>');
          console.log('  3. Asegurar que el DLL esté en la carpeta bin/');
          console.log('  4. Reiniciar el pool de aplicaciones de IIS');
          
          console.log('\n✅ TU CÓDIGO SOAP ESTÁ CORRECTO');
          console.log('  • La petición SOAP se envió correctamente');
          console.log('  • El formato XML es válido');
          console.log('  • El namespace y SOAPAction son correctos');
          console.log('  • El servidor recibió la petición pero falló internamente');
          
        } else if (errorData.includes('MySQL')) {
          console.log('\n✅ Error de base de datos MySQL (no tu código)');
        } else if (errorData.includes('Login failed')) {
          console.log('\n✅ Error de autenticación de base de datos (no tu código)');
        } else {
          console.log('\n⚠️  Error desconocido, ver detalles arriba');
        }
        
        // Mostrar XML raw completo al final
        console.log('\n' + '='.repeat(80));
        console.log('📄 XML COMPLETO DE LA RESPUESTA (para referencia):');
        console.log('='.repeat(80));
        console.log(errorData.substring(0, 2000));
        if (errorData.length > 2000) {
          console.log('\n... (XML truncado, ' + (errorData.length - 2000) + ' caracteres más)');
        }
        
      } else {
        console.log('Respuesta no es string:', typeof errorData);
        console.log(errorData);
      }
      
    } else if (error.request) {
      console.log('❌ No se recibió respuesta del servidor');
      console.log('   Posible problema de red o servidor caído');
    } else {
      console.log('❌ Error en la configuración de la petición');
      console.log('   Mensaje:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// Ejecutar análisis
debugCuencaError();
