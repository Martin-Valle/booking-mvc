/**
 * ✈️ Test del parser regex de SkyAndes
 * Verifica que el parser funciona correctamente con datos simulados
 */

import { SkyAndesFlightSoapAdapter } from './gateway/skyandes.adapter';
import { getESBConfig } from './utils/config';

const config = getESBConfig();

// XML de prueba simulando respuesta con vuelos
const mockXmlWithFlights = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
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
        <DTOFlight>
          <FlightId>102</FlightId>
          <OriginId>1</OriginId>
          <DestinationId>2</DestinationId>
          <Airline>SkyAndes</Airline>
          <FlightNumber>SA456</FlightNumber>
          <DepartureTime>2025-12-15T14:00:00</DepartureTime>
          <ArrivalTime>2025-12-15T15:30:00</ArrivalTime>
          <Duration>1h 30m</Duration>
          <CancellationPolicy>Sin reembolso</CancellationPolicy>
          <CabinClass>Business</CabinClass>
          <AircraftId>2</AircraftId>
        </DTOFlight>
      </buscarServiciosResult>
    </buscarServiciosResponse>
  </soap:Body>
</soap:Envelope>`;

async function testParser() {
  console.log('\n✈️ ===== TEST DEL PARSER REGEX DE SKYANDES =====\n');
  
  try {
    // Crear instancia del adaptador
    const adapter = new SkyAndesFlightSoapAdapter(config.endpoints.skyandes);
    
    // Acceder al método privado parseFlightListFromXml a través de reflection
    const parseMethod = (adapter as any).parseFlightListFromXml.bind(adapter);
    
    console.log('📝 Parseando XML simulado con 2 vuelos...\n');
    const flights = parseMethod(mockXmlWithFlights);
    
    console.log(`✅ Vuelos parseados: ${flights.length}`);
    
    if (flights.length === 2) {
      console.log('\n🎉 ¡PARSER FUNCIONANDO CORRECTAMENTE!\n');
      
      console.log('--- Vuelo 1 ---');
      console.log(`ID: ${flights[0].FlightId}`);
      console.log(`Aerolínea: ${flights[0].Airline}`);
      console.log(`Número: ${flights[0].FlightNumber}`);
      console.log(`Origen ID: ${flights[0].OriginId}`);
      console.log(`Destino ID: ${flights[0].DestinationId}`);
      console.log(`Salida: ${flights[0].DepartureTime}`);
      console.log(`Llegada: ${flights[0].ArrivalTime}`);
      console.log(`Duración: ${flights[0].Duration}`);
      console.log(`Cabina: ${flights[0].CabinClass}`);
      console.log(`Política: ${flights[0].CancellationPolicy}`);
      
      console.log('\n--- Vuelo 2 ---');
      console.log(`ID: ${flights[1].FlightId}`);
      console.log(`Aerolínea: ${flights[1].Airline}`);
      console.log(`Número: ${flights[1].FlightNumber}`);
      console.log(`Origen ID: ${flights[1].OriginId}`);
      console.log(`Destino ID: ${flights[1].DestinationId}`);
      console.log(`Salida: ${flights[1].DepartureTime}`);
      console.log(`Llegada: ${flights[1].ArrivalTime}`);
      console.log(`Duración: ${flights[1].Duration}`);
      console.log(`Cabina: ${flights[1].CabinClass}`);
      console.log(`Política: ${flights[1].CancellationPolicy}`);
      
      console.log('\n✅ ===== TEST COMPLETADO EXITOSAMENTE =====\n');
    } else {
      console.log('\n❌ ERROR: Se esperaban 2 vuelos pero se obtuvieron', flights.length);
    }
    
  } catch (error: any) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.log(error.stack);
  }
}

// Ejecutar test
testParser();
