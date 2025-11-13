/**
 * TEST SIN FILTROS - WeWorkHub
 * Intentar obtener TODAS las habitaciones sin filtros
 */

import http from 'http';

const ENDPOINT = 'inegracion.runasp.net';
const PATH = '/WS_Integracion.asmx';
const NAMESPACE = 'http://weworkhub/integracion';

console.log('🔍 TEST SIN FILTROS - Todas las habitaciones\n');

// Varios formatos de búsqueda para probar
const tests = [
  {
    name: 'Test 1: Sin filtros (vacío)',
    xml: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:buscarServicios>
      <tns:filtros />
    </tns:buscarServicios>
  </soap:Body>
</soap:Envelope>`
  },
  {
    name: 'Test 2: Solo serviceType',
    xml: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:buscarServicios>
      <tns:filtros>
        <serviceType>HOTEL</serviceType>
      </tns:filtros>
    </tns:buscarServicios>
  </soap:Body>
</soap:Envelope>`
  },
  {
    name: 'Test 3: Sin nodos internos',
    xml: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${NAMESPACE}">
  <soap:Body>
    <tns:buscarServicios />
  </soap:Body>
</soap:Envelope>`
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🧪 ${test.name}`);
    console.log('─'.repeat(60));
    
    const options = {
      hostname: ENDPOINT,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(test.xml),
        'SOAPAction': `${NAMESPACE}/buscarServicios`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const habitaciones = data.match(/<ServicioSoapDto>/g);
        const count = habitaciones ? habitaciones.length : 0;
        
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Habitaciones: ${count}`);
        
        if (count > 0) {
          console.log('\n   ✅ ENCONTRÓ RESULTADOS!');
          console.log(data.substring(0, 500));
        } else if (data.includes('faultstring')) {
          const fault = data.match(/<faultstring>([^<]+)<\/faultstring>/);
          console.log(`   ❌ Error: ${fault ? fault[1] : 'SOAP Fault'}`);
        } else {
          console.log('   ⚠️  Respuesta vacía');
        }
        
        resolve(count);
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ Error:', error.message);
      resolve(0);
    });

    req.write(test.xml);
    req.end();
  });
}

async function runAllTests() {
  console.log('═'.repeat(60));
  
  for (const test of tests) {
    await runTest(test);
    await new Promise(r => setTimeout(r, 500)); // Esperar entre tests
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('Pruebas completadas');
  console.log('═'.repeat(60));
}

runAllTests();
