/**
 * REST API Adapter
 * En desarrollo: Llama al servidor backend (api.js) en localhost:3001
 * En producción (Netlify): Usa Netlify Functions como backend
 */

import type { SearchResult } from "../../models/types";

// Detectar entorno
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const API_URL = isDevelopment 
  ? (import.meta.env.VITE_PROXY_URL || 'http://localhost:3001')
  : '/.netlify/functions'; // En producción usar Netlify Functions

/**
 * Buscar mesas en restaurante Sabor Andino
 */
export async function searchSaborAndinoRest(fecha: string, personas: number, hora?: string): Promise<SearchResult[]> {
  try {
    const url = isDevelopment 
      ? `${API_URL}/api/restaurants/saborandino/search`
      : `${API_URL}/restaurant-search?company=saborandino`;
    
    console.log('[REST Adapter] Llamando a:', url);
    console.log('[REST Adapter] Datos:', { fecha, personas, hora });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, personas, hora })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const mesas = await response.json();
    console.log('[REST Adapter] Mesas recibidas:', mesas.length, mesas);
    
    const results: SearchResult[] = mesas.map((mesa: any) => {
      // Extraer ubicación del nombre (ej: "Mesa Terraza (5 personas)" -> "Terraza")
      const nombreMatch = mesa.nombre?.match(/Mesa\s+(\w+)/);
      const ubicacion = nombreMatch ? nombreMatch[1] : '';
      
      // Extraer capacidad del nombre (ej: "Mesa Terraza (5 personas)" -> 5)
      const capacidadMatch = mesa.nombre?.match(/\((\d+)\s+personas?\)/);
      const capacidad = capacidadMatch ? parseInt(capacidadMatch[1]) : 2;
      
      return {
        kind: 'restaurant' as const,
        item: {
          id: `saborandino-${mesa.id}`,
          name: mesa.nombre || `Mesa #${mesa.numero || mesa.id}`,
          city: mesa.ciudad || 'Cuenca',
          price: mesa.precio || 0,
          rating: parseInt(mesa.clasificacion) || 5,
          photo: mesa.foto || '/assets/restaurant-placeholder.jpg',
          cuisine: 'Ecuatoriana',
          description: mesa.descripcion || `Capacidad: ${capacidad} personas`,
          // Campos extras para filtrado
          tipo: ubicacion, // Ubicación extraída del nombre: Terraza, Afuera, Interior, VIP
          capacidad: capacidad // Capacidad extraída del nombre
        }
      };
    });
    
    console.log('[REST Adapter] Results mapeados:', results.length);
    return results;
  } catch (error: any) {
    console.error('[REST Adapter] Error Sabor Andino:', error.message);
    return [];
  }
}

/**
 * Buscar mesas en El Cangrejo Feliz
 */
export async function searchElCangrejoFelizRest(fecha: string, personas: number, hora?: string): Promise<SearchResult[]> {
  try {
    // En producción, usar ESB directamente
    if (!isDevelopment) {
      const { esbSearchElCangrejoFeliz } = await import('./esb.adapter');
      return await esbSearchElCangrejoFeliz({ fecha, personas, hora });
    }

    const response = await fetch(`${API_URL}/api/restaurants/elcangrejofeliz/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, personas, hora })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const mesas = await response.json();
    
    return mesas.map((mesa: any) => ({
      kind: 'restaurant' as const,
      item: {
        id: `cangrejofeliz-${mesa.id}`,
        name: mesa.nombre || `Mesa #${mesa.numero || mesa.id}`,
        city: 'Guayaquil',
        price: mesa.precio || 0,
        rating: 5,
        photo: mesa.foto || '/assets/restaurant-placeholder.jpg',
        cuisine: 'Mariscos',
        description: mesa.descripcion || `Capacidad: ${mesa.capacidad} personas`
      }
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Cangrejo Feliz:', error.message);
    return [];
  }
}

/**
 * Buscar mesas en Sanctum Cortejo
 */
export async function searchSanctumCortejoRest(fecha: string, personas: number, hora?: string): Promise<SearchResult[]> {
  try {
    console.log('[REST Adapter] 🍷 Buscando mesas Sanctum Cortejo con:', { fecha, personas, hora });
    
    // En desarrollo usa Express API, en producción usa Netlify Functions
    const url = isDevelopment 
      ? `${API_URL}/api/restaurants/sanctumcortejo/search`
      : `${API_URL}/restaurant-search?company=sanctumcortejo`;
    
    console.log('[REST Adapter] URL a llamar:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, personas, hora })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const mesas = await response.json();
    console.log('[REST Adapter] Mesas recibidas:', mesas.length);
    
    const results = mesas.map((mesa: any) => {
      // Extraer ubicación del nombre de la mesa
      // Ejemplo: "Mesa Terraza (5 personas)" → tipo = "Terraza"
      const nombreMatch = mesa.nombre?.match(/Mesa\s+(\w+)/);
      const ubicacion = nombreMatch ? nombreMatch[1] : '';
      
      // Extraer capacidad del nombre de la mesa
      // Ejemplo: "Mesa Terraza (5 personas)" → capacidad = 5
      const capacidadMatch = mesa.nombre?.match(/\((\d+)\s+personas?\)/);
      const capacidad = capacidadMatch ? parseInt(capacidadMatch[1]) : 2;
      
      return {
        kind: 'restaurant' as const,
        item: {
          id: `sanctum-${mesa.id}`,
          name: mesa.nombre || `Mesa #${mesa.numero || mesa.id}`,
          city: mesa.ciudad || 'Quito',
          price: mesa.precio || 0,
          rating: parseInt(mesa.clasificacion) || 5,
          photo: mesa.foto || '/assets/restaurant-placeholder.jpg',
          cuisine: 'Gourmet',
          description: mesa.descripcion || `Capacidad: ${capacidad} personas`,
          // Campos extras para filtrado
          tipo: ubicacion, // Ubicación extraída del nombre: Terraza, Afuera, Interior, VIP
          capacidad: capacidad // Capacidad extraída del nombre
        }
      };
    });
    
    console.log('[REST Adapter] Results mapeados:', results.length);
    return results;
  } catch (error: any) {
    console.error('[REST Adapter] Error Sanctum Cortejo:', error.message);
    return [];
  }
}

/**
 * Buscar mesas en Siete Mares
 */
export async function searchSieteMaresRest(fecha: string, personas: number, hora?: string): Promise<SearchResult[]> {
  try {
    // En producción, usar ESB directamente
    if (!isDevelopment) {
      const { esbSearchSieteMares } = await import('./esb.adapter');
      return await esbSearchSieteMares({ fecha, personas, hora });
    }

    const response = await fetch(`${API_URL}/api/restaurants/sietemares/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, personas, hora })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const mesas = await response.json();
    
    return mesas.map((mesa: any) => {
      // Extract location and capacity from name/tipo
      let tipo = mesa.tipo || '';
      let capacidad = mesa.capacidad || 2;
      
      // Try to extract capacity from name (e.g., "Mesa VIP 6 personas")
      const capacidadMatch = mesa.nombre?.match(/(\d+)\s*persona/i);
      if (capacidadMatch) {
        capacidad = parseInt(capacidadMatch[1]);
      }
      
      // Extract location from tipo or nombre
      if (!tipo && mesa.nombre) {
        if (mesa.nombre.match(/terraza|exterior|afuera/i)) {
          tipo = 'Terraza';
        } else if (mesa.nombre.match(/vip|privada/i)) {
          tipo = 'VIP';
        } else if (mesa.nombre.match(/interior|dentro/i)) {
          tipo = 'Interior';
        }
      }
      
      return {
        kind: 'restaurant' as const,
        item: {
          id: `sietemares-${mesa.id}`,
          name: mesa.nombre || `Mesa #${mesa.numero || mesa.id}`,
          city: 'Manta',
          price: mesa.precio || 0,
          rating: 5,
          photo: mesa.foto || '/assets/restaurant-placeholder.jpg',
          cuisine: 'Mariscos',
          description: mesa.descripcion || `Capacidad: ${capacidad} personas`,
          tipo,
          capacidad
        }
      };
    });
  } catch (error: any) {
    console.error('[REST Adapter] Error Siete Mares:', error.message);
    return [];
  }
}

/**
 * Buscar habitaciones en KM25 Madrid Hotel
 */
export async function searchKM25MadridRest(fechaEntrada: string, fechaSalida: string, personas: number): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/hotels/km25madrid/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fechaEntrada, fechaSalida, personas })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const habitaciones = await response.json();
    
    return habitaciones.map((hab: any) => ({
      id: `km25madrid-${hab.id}`,
      title: hab.tipo || `Habitación #${hab.id}`,
      kind: 'hotel' as const,
      company: 'km25madrid',
      price: hab.precio || 0,
      currency: 'USD',
      rating: 4.5,
      description: `Capacidad: ${hab.capacidad} personas`,
      thumbnail: '/assets/hotel-placeholder.jpg',
      metadata: hab
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error KM25 Madrid:', error.message);
    return [];
  }
}

/**
 * Buscar habitaciones en WeWorkHub
 */
export async function searchWeWorkHubRest(fechaEntrada: string, fechaSalida: string, personas: number): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/hotels/weworkhub/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fechaEntrada, fechaSalida, personas })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const habitaciones = await response.json();
    
    return habitaciones.map((hab: any) => ({
      id: `weworkhub-${hab.id}`,
      title: hab.tipo || `Espacio #${hab.id}`,
      kind: 'hotel' as const,
      company: 'weworkhub',
      price: hab.precio || 0,
      currency: 'USD',
      rating: 4.7,
      description: `Capacidad: ${hab.capacidad} personas`,
      thumbnail: '/assets/hotel-placeholder.jpg',
      metadata: hab
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error WeWorkHub:', error.message);
    return [];
  }
}

/**
 * Buscar servicios en Hotel Perros (Pet Hotel)
 */
export async function searchHotelPerrosRest(
  inicio: string,
  fin: string,
  unidades: number,
  tamano?: string,
  ciudad?: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/hotels/hotelperros/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inicio, fin, unidades, tamano, ciudad })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const servicios = await response.json();
    
    return servicios.map((servicio: any) => ({
      kind: 'hotel' as const,
      item: {
        id: `hotelperros-${servicio.id}`,
        name: servicio.nombre || 'Servicio de Hospedaje Canino',
        city: ciudad || 'N/A',
        price: servicio.precio || 0,
        rating: 5,
        photo: '/assets/dog-hotel-placeholder.jpg',
        available: servicio.disponible !== false
      }
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Hotel Perros:', error.message);
    return [];
  }
}

/**
 * Buscar hoteles en Hotel UIO
 */
export async function searchHotelUIOrest(
  ciudad?: string,
  precioMax?: number,
  fecha?: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/hotels/hoteluio/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciudad, precioMax, fecha })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const hoteles = await response.json();
    
    return hoteles.map((hotel: any) => ({
      kind: 'hotel' as const,
      item: {
        id: hotel.id,
        name: hotel.nombre,
        city: hotel.metadata?.ciudad || ciudad || 'Ecuador',
        price: hotel.precio || 0,
        rating: hotel.metadata?.estrellas || 3,
        photo: hotel.imagen || '/assets/hotel-placeholder.jpg',
        available: hotel.disponible !== false,
        description: hotel.descripcion
      }
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Hotel UIO:', error.message);
    return [];
  }
}

/**
 * Buscar habitaciones en Hotel Boutique Paris
 */
export async function searchHotelBoutiqueRest(
  ciudad?: string,
  precioMin?: number,
  precioMax?: number,
  amenities?: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/hotels/hotelboutique/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciudad, precioMin, precioMax, amenities, fechaInicio, fechaFin })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const hoteles = await response.json();
    
    return hoteles.map((hotel: any) => ({
      kind: 'hotel' as const,
      item: {
        id: hotel.id,
        name: hotel.nombre,
        city: hotel.metadata?.ciudad || ciudad || 'Paris',
        price: hotel.precio || 0,
        rating: 5, // Hotel boutique de lujo
        photo: hotel.imagen || '/assets/hotel-placeholder.jpg',
        available: hotel.disponible !== false,
        description: hotel.descripcion
      }
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Hotel Boutique:', error.message);
    return [];
  }
}

/**
 * Buscar vehículos en Easy Car
 */
export async function searchEasyCarRest(
  categoria?: string,
  transmision?: string, 
  fechaInicio?: string, 
  fechaFin?: string,
  edadConductor?: number
): Promise<SearchResult[]> {
  try {
    console.log('[REST Adapter] 🚗 Buscando vehículos Easy Car con:', { categoria, transmision, fechaInicio, fechaFin, edadConductor });
    
    // En desarrollo usa Express API, en producción usa Netlify Functions
    const url = isDevelopment 
      ? `${API_URL}/api/cars/easycar/search`
      : `${API_URL}/car-search?company=easycar`;
    
    console.log('[REST Adapter] URL a llamar:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, transmision, fechaInicio, fechaFin, edadConductor })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const cars = await response.json();
    console.log('[REST Adapter] Vehículos recibidos:', cars.length);
    if (cars.length > 0) {
      console.log('[REST Adapter] 🔍 Primer vehículo del API:', cars[0]);
    }
    
    const results = cars.map((car: any) => {
      console.log('[REST Adapter] 💰 Precio del vehículo:', car.marca, car.modelo, '- Precio:', car.precio, 'Tipo:', typeof car.precio);
      
      return {
        kind: 'car' as const,
        item: {
          id: `easycar-${car.id}`,
          brand: car.marca || '',
          model: car.modelo || '',
          year: car.anio || 2020,
          category: car.categoria || '',
          transmission: car.transmision || '',
          fuel: car.combustible || '',
          pricePerDay: car.precio || 0,  // ✅ Cambiado de price a pricePerDay
          photo: '/assets/car-placeholder.jpg',
          capacity: 5, // Easy Car no proporciona capacidad
          agency: car.agencia || 0
        }
      };
    });
    
    console.log('[REST Adapter] Results mapeados:', results.length);
    if (results.length > 0) {
      console.log('[REST Adapter] 🔍 Primer resultado mapeado:', results[0]);
    }
    return results;
  } catch (error: any) {
    console.error('[REST Adapter] Error Easy Car:', error.message);
    return [];
  }
}

/**
 * Buscar vehículos en Alquiler Augye
 */
export async function searchAlquilerAugyeRest(
  categoria?: string,
  gearbox?: string,
  ciudad?: string,
  page?: number,
  pageSize?: number
): Promise<SearchResult[]> {
  try {
    console.log('[REST Adapter] 🚗 Buscando vehículos Alquiler Augye con:', { categoria, gearbox, ciudad, page, pageSize });
    
    // En desarrollo usa Express API, en producción usa Netlify Functions
    const url = isDevelopment 
      ? `${API_URL}/api/cars/alquileraugye/search`
      : `${API_URL}/car-search?company=alquileraugye`;
    
    console.log('[REST Adapter] URL a llamar:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, gearbox, ciudad, page: page || 1, pageSize: pageSize || 50 })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const cars = await response.json();
    console.log('[REST Adapter] Vehículos recibidos:', cars.length);
    if (cars.length > 0) {
      console.log('[REST Adapter] 🔍 Primer vehículo del API:', cars[0]);
    }
    
    const results = cars.map((car: any) => {
      console.log('[REST Adapter] 💰 Precio del vehículo:', car.marca, car.modelo, '- Precio:', car.precio, 'Tipo:', typeof car.precio);
      
      return {
        kind: 'car' as const,
        item: {
          id: `alquileraugye-${car.id}`,
          brand: car.marca || '',
          model: car.modelo || '',
          year: 2020,
          category: car.categoria || '',
          transmission: car.transmision || '',
          fuel: 'Gasolina',
          pricePerDay: car.precio || 0,
          photo: car.foto || '/assets/car-placeholder.jpg',
          capacity: 5,
          agency: 0
        }
      };
    });
    
    console.log('[REST Adapter] Results mapeados:', results.length);
    if (results.length > 0) {
      console.log('[REST Adapter] 🔍 Primer resultado mapeado:', results[0]);
    }
    return results;
  } catch (error: any) {
    console.error('[REST Adapter] Error Alquiler Augye:', error.message);
    return [];
  }
}

/**
 * Buscar vehículos en Cuenca Car
 */
export async function searchCuencaCarRest(ciudad?: string, categoria?: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/cars/cuencacar/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciudad, categoria })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const cars = await response.json();
    
    return cars.map((car: any) => ({
      kind: 'car' as const,
      item: {
        id: `cuencacar-${car.id}`,
        brand: car.marca,
        model: car.modelo,
        category: car.categoria,
        transmission: car.transmision,
        pricePerDay: car.pricePerDay || 0,
        city: car.ciudad || 'Cuenca',
        photo: '/assets/car-placeholder.jpg',
        available: car.disponible !== false
      }
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Cuenca Car:', error.message);
    return [];
  }
}

/**
 * Buscar vehículos en Autos Rent Car
 */
export async function searchRentCarRest(fechaInicio: string, fechaFin: string, ciudad?: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/cars/rentcar/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fechaInicio, fechaFin, ciudad })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vehiculos = await response.json();
    
    return vehiculos.map((vehiculo: any) => ({
      id: `rentcar-${vehiculo.id}`,
      title: `${vehiculo.marca} ${vehiculo.modelo}`,
      kind: 'car' as const,
      company: 'rentcar',
      price: vehiculo.precio || 0,
      currency: 'USD',
      rating: 4.5,
      description: `${vehiculo.tipo} - ${vehiculo.capacidad} pasajeros`,
      thumbnail: '/assets/car-placeholder.jpg',
      metadata: vehiculo
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Rent Car:', error.message);
    return [];
  }
}

/**
 * Buscar vehículos en Backend Cuenca
 */
export async function searchBackendCuencaRest(fechaInicio: string, fechaFin: string, ciudad?: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/cars/backendcuenca/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fechaInicio, fechaFin, ciudad })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vehiculos = await response.json();
    
    return vehiculos.map((vehiculo: any) => ({
      id: `backendcuenca-${vehiculo.id}`,
      title: `${vehiculo.marca} ${vehiculo.modelo}`,
      kind: 'car' as const,
      company: 'backendcuenca',
      price: vehiculo.precio || 0,
      currency: 'USD',
      rating: 4.6,
      description: `${vehiculo.tipo} - ${vehiculo.capacidad} pasajeros`,
      thumbnail: '/assets/car-placeholder.jpg',
      metadata: vehiculo
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Backend Cuenca:', error.message);
    return [];
  }
}

/**
 * Buscar vehículos en Renta Autos Madrid
 */
export async function searchRentaAutosMadridRest(
  ciudad?: string,
  categoria?: string,
  gearbox?: string,
  precioMin?: number,
  precioMax?: number
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/cars/rentaautosmadrid/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciudad, categoria, gearbox, precioMin, precioMax })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vehiculos = await response.json();
    
    return vehiculos.map((vehiculo: any) => ({
      kind: 'car' as const,
      item: {
        id: vehiculo.id,
        brand: vehiculo.metadata?.categoria || 'Renta Autos Madrid',
        model: vehiculo.nombre,
        pricePerDay: vehiculo.precio || 0,
        photo: vehiculo.imagen || '/assets/car-placeholder.jpg'
      }
    }));
  } catch (error: any) {
    console.error('[REST Adapter] Error Renta Autos Madrid:', error.message);
    return [];
  }
}

/**
 * Buscar vuelos en SkyAndes
 */
export async function searchSkyAndesRest(
  originId: number,
  destinationId: number,
  fecha: string,
  cabinClass: string
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/api/flights/skyandes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originId, destinationId, fecha, cabinClass })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vuelos = await response.json();
    console.log(`[REST Adapter] SkyAndes: ${vuelos.length} vuelos encontrados`);
    
    return vuelos; // Ya vienen en formato SearchResult desde el backend
  } catch (error: any) {
    console.error('[REST Adapter] Error SkyAndes:', error.message);
    return [];
  }
}
