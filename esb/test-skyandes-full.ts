/**
 * ✈️ Test completo de SkyAndes con datos simulados
 * Prueba todas las operaciones del servicio
 */

import { SkyAndesFlightSoapAdapter } from './gateway/skyandes.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();

// XML simulados para cada operación
const mockXMLs = {
  buscarServicios: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <buscarServiciosResponse xmlns="http://skyandes.com/integracion/">
          <buscarServiciosResult>
            <DTOFlight>
              <FlightId>101</FlightId>
              <OriginId>1</OriginId>
              <DestinationId>2</DestinationId>
              <Airline>SkyAndes</Airline>
              <FlightNumber>SA123</FlightNumber>
              <DepartureTime>2025-12-15T08:00:00</DepartureTime>
              <ArrivalTime>2025-12-15T09:30:00</ArrivalTime>
              <Duration>1h 30m</Duration>
              <CancellationPolicy>Cancelación gratuita hasta 24h antes</CancellationPolicy>
              <CabinClass>Economy</CabinClass>
              <AircraftId>1</AircraftId>
            </DTOFlight>
          </buscarServiciosResult>
        </buscarServiciosResponse>
      </soap:Body>
    </soap:Envelope>`,
  
  obtenerDetalle: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <obtenerDetalleServicioResponse xmlns="http://skyandes.com/integracion/">
          <obtenerDetalleServicioResult>
            <DTOFlight>
              <FlightId>101</FlightId>
              <OriginId>1</OriginId>
              <DestinationId>2</DestinationId>
              <Airline>SkyAndes</Airline>
              <FlightNumber>SA123</FlightNumber>
              <DepartureTime>2025-12-15T08:00:00</DepartureTime>
              <ArrivalTime>2025-12-15T09:30:00</ArrivalTime>
              <Duration>1h 30m</Duration>
              <CancellationPolicy>Cancelación gratuita hasta 24h antes</CancellationPolicy>
              <CabinClass>Economy</CabinClass>
              <AircraftId>1</AircraftId>
            </DTOFlight>
          </obtenerDetalleServicioResult>
        </obtenerDetalleServicioResponse>
      </soap:Body>
    </soap:Envelope>`,
  
  verificarDisponibilidad: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <verificarDisponibilidadResponse xmlns="http://skyandes.com/integracion/">
          <verificarDisponibilidadResult>true</verificarDisponibilidadResult>
        </verificarDisponibilidadResponse>
      </soap:Body>
    </soap:Envelope>`,
  
  cotizarReserva: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <cotizarReservaResponse xmlns="http://skyandes.com/integracion/">
          <cotizarReservaResult>
            <Total>250.50</Total>
            <Impuestos>30.50</Impuestos>
            <BasePrice>200.00</BasePrice>
            <PromoDiscount>20.00</PromoDiscount>
          </cotizarReservaResult>
        </cotizarReservaResponse>
      </soap:Body>
    </soap:Envelope>`,
  
  crearPreReserva: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <crearPreReservaResponse xmlns="http://skyandes.com/integracion/">
          <crearPreReservaResult>
            <PreBookingId>5001</PreBookingId>
            <ExpiraEn>2025-12-15T10:00:00</ExpiraEn>
          </crearPreReservaResult>
        </crearPreReservaResponse>
      </soap:Body>
    </soap:Envelope>`,
  
  confirmarReserva: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <confirmarReservaResponse xmlns="http://skyandes.com/integracion/">
          <confirmarReservaResult>
            <BookingId>6001</BookingId>
            <Estado>Confirmed</Estado>
          </confirmarReservaResult>
        </confirmarReservaResponse>
      </soap:Body>
    </soap:Envelope>`,
  
  cancelarReserva: `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <cancelarReservaIntegracionResponse xmlns="http://skyandes.com/integracion/">
          <cancelarReservaIntegracionResult>true</cancelarReservaIntegracionResult>
        </cancelarReservaIntegracionResponse>
      </soap:Body>
    </soap:Envelope>`
};

async function testAllMethods() {
  console.log('\n✈️ ===== TEST COMPLETO DE SKYANDES (SIMULADO) =====\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    const adapter = new SkyAndesFlightSoapAdapter(config.endpoints.skyandes);
    
    // Test 1: buscarServicios
    console.log('1️⃣ TEST: buscarServicios...');
    const parseFlights = (adapter as any).parseFlightListFromXml.bind(adapter);
    const flights = parseFlights(mockXMLs.buscarServicios);
    if (flights.length === 1 && flights[0].FlightId === 101) {
      console.log('   ✅ PASÓ: Encontró 1 vuelo con ID 101');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No parseó correctamente');
      testsFailed++;
    }
    
    // Test 2: obtenerDetalleServicio
    console.log('\n2️⃣ TEST: obtenerDetalleServicio...');
    const detalle = parseFlights(mockXMLs.obtenerDetalle);
    if (detalle.length === 1 && detalle[0].Airline === 'SkyAndes') {
      console.log('   ✅ PASÓ: Obtuvo detalle con aerolínea SkyAndes');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No obtuvo el detalle');
      testsFailed++;
    }
    
    // Test 3: verificarDisponibilidad
    console.log('\n3️⃣ TEST: verificarDisponibilidad...');
    const extractValue = (adapter as any).extractXmlValue.bind(adapter);
    const disponible = extractValue(mockXMLs.verificarDisponibilidad, 'verificarDisponibilidadResult');
    if (disponible === 'true') {
      console.log('   ✅ PASÓ: Disponibilidad = true');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No extrajo disponibilidad');
      testsFailed++;
    }
    
    // Test 4: cotizarReserva
    console.log('\n4️⃣ TEST: cotizarReserva...');
    const total = extractValue(mockXMLs.cotizarReserva, 'Total');
    const impuestos = extractValue(mockXMLs.cotizarReserva, 'Impuestos');
    const basePrice = extractValue(mockXMLs.cotizarReserva, 'BasePrice');
    if (total === '250.50' && impuestos === '30.50' && basePrice === '200.00') {
      console.log('   ✅ PASÓ: Total=$250.50, Impuestos=$30.50, Base=$200.00');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No extrajo cotización correctamente');
      testsFailed++;
    }
    
    // Test 5: crearPreReserva
    console.log('\n5️⃣ TEST: crearPreReserva...');
    const preBookingId = extractValue(mockXMLs.crearPreReserva, 'PreBookingId');
    const expiraEn = extractValue(mockXMLs.crearPreReserva, 'ExpiraEn');
    if (preBookingId === '5001' && expiraEn) {
      console.log('   ✅ PASÓ: PreBookingId=5001, ExpiraEn=' + expiraEn);
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No extrajo pre-reserva');
      testsFailed++;
    }
    
    // Test 6: confirmarReserva
    console.log('\n6️⃣ TEST: confirmarReserva...');
    const bookingId = extractValue(mockXMLs.confirmarReserva, 'BookingId');
    const estado = extractValue(mockXMLs.confirmarReserva, 'Estado');
    if (bookingId === '6001' && estado === 'Confirmed') {
      console.log('   ✅ PASÓ: BookingId=6001, Estado=Confirmed');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No extrajo confirmación');
      testsFailed++;
    }
    
    // Test 7: cancelarReserva
    console.log('\n7️⃣ TEST: cancelarReserva...');
    const cancelado = extractValue(mockXMLs.cancelarReserva, 'cancelarReservaIntegracionResult');
    if (cancelado === 'true') {
      console.log('   ✅ PASÓ: Cancelación = true');
      testsPassed++;
    } else {
      console.log('   ❌ FALLÓ: No extrajo cancelación');
      testsFailed++;
    }
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log(`   ✅ Pasadas: ${testsPassed}/7 (${(testsPassed/7*100).toFixed(1)}%)`);
    console.log(`   ❌ Falladas: ${testsFailed}/7`);
    console.log('='.repeat(60));
    
    if (testsPassed === 7) {
      console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Parser regex 100% funcional\n');
    } else {
      console.log('\n⚠️  Algunos tests fallaron\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ ERROR EN LOS TESTS:', error.message);
    console.log(error.stack);
  }
}

// Ejecutar tests
testAllMethods();
