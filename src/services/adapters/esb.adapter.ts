import type { FilterState, SearchResult, Hotel, Car, Flight, Restaurant } from "../../models/types";
import { mockSearch } from "./mock.adapter";
import ESB from "../../../esb";
import type { FiltrosBusqueda, Servicio } from "../../../esb";
import { getRestaurants } from "./restaurant.adapter";

/**
 * Adaptador del ESB para el frontend booking-mvc
 * Usa el Enterprise Service Bus para buscar servicios en APIs SOAP externas
 */

export async function esbSearch(query: string, filters?: FilterState): Promise<SearchResult[]> {
  try {
    // Convertir filtros del frontend al formato del ESB
    const filtrosESB: FiltrosBusqueda = {
      serviceType: filters?.kinds || ['hotel', 'car', 'flight', 'restaurant'],
      ciudad: filters?.city,
      precioMin: filters?.priceMin,
      precioMax: filters?.priceMax,
      clasificacion: filters?.ratingMin
    };

    // Llamar al ESB para hoteles, vuelos y autos
    const servicios = await ESB.buscarServicios(filtrosESB);

    // Convertir resultados del ESB al formato del frontend
    const resultados = convertirServiciosAResultados(servicios);

    // Si se incluyen restaurantes en el filtro, buscarlos también
    if (!filters?.kinds || filters.kinds.includes('restaurant')) {
      const restaurantes = await getRestaurants(query);
      restaurantes.forEach(r => {
        resultados.push({ kind: 'restaurant', item: r });
      });
    }

    // Aplicar filtrado adicional por query de texto
    if (query) {
      return resultados.filter(r => {
        const searchText = query.toLowerCase();
        if (r.kind === 'hotel') {
          const hotel = r.item as Hotel;
          return hotel.name.toLowerCase().includes(searchText) ||
                 hotel.city.toLowerCase().includes(searchText);
        } else if (r.kind === 'flight') {
          const flight = r.item as Flight;
          return flight.from.toLowerCase().includes(searchText) ||
                 flight.to.toLowerCase().includes(searchText) ||
                 flight.airline.toLowerCase().includes(searchText);
        } else if (r.kind === 'car') {
          const car = r.item as Car;
          return car.brand.toLowerCase().includes(searchText) ||
                 car.model.toLowerCase().includes(searchText);
        } else if (r.kind === 'restaurant') {
          const restaurant = r.item as Restaurant;
          return restaurant.name.toLowerCase().includes(searchText) ||
                 restaurant.city.toLowerCase().includes(searchText) ||
                 restaurant.cuisine.toLowerCase().includes(searchText);
        }
        return false;
      });
    }

    // Aplicar ordenamiento si se especificó
    if (filters?.sort) {
      return aplicarOrdenamiento(resultados, filters.sort);
    }

    return resultados;
  } catch (error) {
    console.error('Error al buscar en ESB, usando mock:', error);
    // Fallback: usar datos mock si el ESB falla
    return mockSearch(query);
  }
}

/**
 * Convierte servicios del ESB al formato SearchResult del frontend
 */
function convertirServiciosAResultados(servicios: Servicio[]): SearchResult[] {
  const resultados: SearchResult[] = [];
  
  for (const s of servicios) {
    if (s.serviceType === 'hotel') {
      const hotel: Hotel = {
        id: s.idServicio || '',
        name: s.nombre,
        city: s.ciudad || '',
        price: s.precio,
        rating: s.rating || 0,
        photo: s.fotos?.[0] || '/hotel-placeholder.jpg'
      };
      resultados.push({ kind: 'hotel', item: hotel });
    } else if (s.serviceType === 'flight') {
      const flightData = s.datosEspecificos as any;
      const flight: Flight = {
        id: s.idServicio || '',
        from: flightData?.origin || '',
        to: flightData?.destination || '',
        date: flightData?.departureTime ? new Date(flightData.departureTime).toISOString() : '',
        price: s.precio,
        airline: flightData?.airline || ''
      };
      resultados.push({ kind: 'flight', item: flight });
    } else if (s.serviceType === 'car') {
      const carData = s.datosEspecificos as any;
      const car: Car = {
        id: s.idServicio || '',
        brand: carData?.marca || '',
        model: carData?.modelo || '',
        pricePerDay: s.precio,
        photo: s.fotos?.[0] || '/car-placeholder.jpg'
      };
      resultados.push({ kind: 'car', item: car });
    }
  }
  
  return resultados;
}

/**
 * Aplica ordenamiento a los resultados
 */
function aplicarOrdenamiento(resultados: SearchResult[], sort: string): SearchResult[] {
  const sorted = [...resultados];
  
  if (sort === 'price-asc') {
    sorted.sort((a, b) => {
      const priceA = a.kind === 'hotel' ? (a.item as Hotel).price : 
                     a.kind === 'flight' ? (a.item as Flight).price : (a.item as Car).pricePerDay;
      const priceB = b.kind === 'hotel' ? (b.item as Hotel).price : 
                     b.kind === 'flight' ? (b.item as Flight).price : (b.item as Car).pricePerDay;
      return priceA - priceB;
    });
  } else if (sort === 'price-desc') {
    sorted.sort((a, b) => {
      const priceA = a.kind === 'hotel' ? (a.item as Hotel).price : 
                     a.kind === 'flight' ? (a.item as Flight).price : (a.item as Car).pricePerDay;
      const priceB = b.kind === 'hotel' ? (b.item as Hotel).price : 
                     b.kind === 'flight' ? (b.item as Flight).price : (b.item as Car).pricePerDay;
      return priceB - priceA;
    });
  } else if (sort === 'rating-desc') {
    sorted.sort((a, b) => {
      const ratingA = a.kind === 'hotel' ? (a.item as Hotel).rating : 0;
      const ratingB = b.kind === 'hotel' ? (b.item as Hotel).rating : 0;
      return ratingB - ratingA;
    });
  }
  
  return sorted;
}

/**
 * Buscar específicamente en Easy Car (servicio 100% funcional)
 */
export async function esbSearchEasyCar(filters?: {
  categoria?: string;
  transmision?: string;
  minPrecio?: number;
  maxPrecio?: number;
}): Promise<SearchResult[]> {
  try {
    console.log("[ESB Adapter] ====== INICIANDO BÚSQUEDA EASY CAR ======");
    console.log("[ESB Adapter] Filtros recibidos:", JSON.stringify(filters));
    
    // Verificar que USE_ESB está habilitado
    const useESB = import.meta.env.VITE_USE_ESB === "true";
    console.log("[ESB Adapter] USE_ESB:", useESB);
    
    if (!useESB) {
      console.warn("[ESB Adapter] ⚠️ ESB no está habilitado en .env");
      return [];
    }
    
    // Importar módulos necesarios
    console.log("[ESB Adapter] Importando EasyCarSoapAdapter...");
    const easyCarModule = await import('../../../esb/gateway/easy-car.adapter');
    const configModule = await import('../../../esb/utils/config');
    
    console.log("[ESB Adapter] ✅ Módulos importados exitosamente");
    
    const config = configModule.getESBConfig();
    const easyCarConfig = config.endpoints.easyCar;
    
    console.log("[ESB Adapter] Configuración Easy Car:", {
      url: easyCarConfig.url,
      enabled: easyCarConfig.enabled
    });
    
    if (!easyCarConfig.enabled) {
      console.warn("[ESB Adapter] ⚠️ Easy Car está deshabilitado en config");
      return [];
    }
    
    // Crear adapter
    console.log("[ESB Adapter] Creando adapter...");
    const adapter = new easyCarModule.EasyCarSoapAdapter(easyCarConfig);
    console.log("[ESB Adapter] ✅ Adapter creado");
    
    // Llamar al servicio
    console.log("[ESB Adapter] Llamando a buscarServicios con:", {
      categoria: filters?.categoria || 'sin filtro',
      transmision: filters?.transmision || 'sin filtro'
    });
    
    const vehiculos = await adapter.buscarServicios(
      filters?.categoria,
      filters?.transmision
    );
    
    console.log(`[ESB Adapter] ✅ Respuesta recibida: ${vehiculos.length} vehículos`);
    console.log("[ESB Adapter] Vehículos raw:", vehiculos);
    
    // Convertir a formato SearchResult
    console.log("[ESB Adapter] Convirtiendo a formato SearchResult...");
    let resultados: SearchResult[] = vehiculos.map((v, index) => {
      console.log(`[ESB Adapter] Vehículo ${index + 1}:`, {
        IdVehiculo: v.IdVehiculo,
        Marca: v.Marca,
        Modelo: v.Modelo,
        PrecioBaseDia: v.PrecioBaseDia
      });
      
      return {
        kind: 'car',
        item: {
          id: v.IdVehiculo?.toString() || '',
          brand: v.Marca || 'Sin marca',
          model: v.Modelo || 'Sin modelo',
          pricePerDay: v.PrecioBaseDia || 0,
          photo: '/car-placeholder.jpg'
        } as Car
      };
    });
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} vehículos convertidos`);
    
    // Aplicar filtros de precio
    const initialCount = resultados.length;
    
    if (filters?.minPrecio !== undefined) {
      console.log(`[ESB Adapter] Aplicando filtro precio mínimo: $${filters.minPrecio}`);
      resultados = resultados.filter(r => (r.item as Car).pricePerDay >= filters.minPrecio!);
      console.log(`[ESB Adapter] ${resultados.length}/${initialCount} pasan filtro mínimo`);
    }
    
    if (filters?.maxPrecio !== undefined) {
      console.log(`[ESB Adapter] Aplicando filtro precio máximo: $${filters.maxPrecio}`);
      const beforeMax = resultados.length;
      resultados = resultados.filter(r => (r.item as Car).pricePerDay <= filters.maxPrecio!);
      console.log(`[ESB Adapter] ${resultados.length}/${beforeMax} pasan filtro máximo`);
    }
    
    console.log("[ESB Adapter] ====== BÚSQUEDA COMPLETADA ======");
    console.log(`[ESB Adapter] Total resultados finales: ${resultados.length}`);
    
    return resultados;
    
  } catch (error: any) {
    console.error("[ESB Adapter] ❌ ERROR EN BÚSQUEDA:");
    console.error("[ESB Adapter] Mensaje:", error?.message);
    console.error("[ESB Adapter] Stack:", error?.stack);
    console.error("[ESB Adapter] Error completo:", error);
    
    // Re-lanzar el error para que el controlador lo maneje
    throw new Error(`Error buscando en Easy Car: ${error?.message || 'Error desconocido'}`);
  }
}

/**
 * Búsqueda específica de WeWorkHub Cuenca via SOAP
 */
export async function esbSearchWeWorkHub(filters?: any): Promise<SearchResult[]> {
  try {
    console.log('[ESB Adapter] 🏨 Buscando en WeWorkHub Cuenca via SOAP...', filters);
    
    const useESB = import.meta.env.VITE_USE_ESB === 'true';
    if (!useESB) {
      console.warn('[ESB Adapter] ⚠️ ESB no está habilitado');
      return [];
    }
    
    // Importar adapter y config
    const weWorkHubModule = await import('../../../esb/gateway/weworkhub-integracion.adapter');
    const configModule = await import('../../../esb/utils/config');
    
    const config = configModule.getESBConfig();
    const weWorkHubConfig = config.endpoints.weWorkHubIntegracion;
    
    console.log('[ESB Adapter] Config WeWorkHub:', {
      url: weWorkHubConfig.url,
      enabled: weWorkHubConfig.enabled
    });
    
    if (!weWorkHubConfig.enabled) {
      console.warn('[ESB Adapter] ⚠️ WeWorkHub está deshabilitado');
      return [];
    }
    
    // Crear adapter
    const adapter = new weWorkHubModule.WeWorkHubIntegracionSoapAdapter(weWorkHubConfig);
    
    // Construir filtros para el servicio SOAP
    const filtrosSoap = {
      filtros: filters?.ciudad || filters?.destino || 'Cuenca',
      checkIn: filters?.checkIn || new Date().toISOString().split('T')[0],
      checkOut: filters?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      adultos: filters?.adultos || 2,
      ninos: filters?.ninos || 0,
      habitaciones: filters?.habitaciones || 1
    };
    
    console.log('[ESB Adapter] Llamando a búsqueda con filtros:', filtrosSoap);
    
    // Llamar al servicio SOAP
    const habitaciones = await adapter.buscarServicios(filtrosSoap);
    
    console.log(`[ESB Adapter] ✅ Respuesta: ${habitaciones.length} habitaciones`);
    
    // Convertir a formato SearchResult
    let resultados: SearchResult[] = habitaciones.map((h: any) => ({
      kind: 'hotel' as const,
      item: {
        id: `weworkhub-${h.IdServicio || h.idServicio}`,
        name: h.Nombre || h.nombre || 'Habitación WeWorkHub',
        city: h.Ciudad || h.ciudad || 'Cuenca',
        price: parseFloat(h.Precio || h.precio || 0),
        rating: parseInt(h.Clasificacion || h.clasificacion || 4),
        photo: h.ImagenURL || h.imagenUrl || '/hotel-placeholder.jpg'
      } as Hotel
    }));
    
    // Aplicar filtros adicionales
    if (filters?.minPrecio) {
      resultados = resultados.filter(r => (r.item as Hotel).price >= filters.minPrecio);
    }
    if (filters?.maxPrecio) {
      resultados = resultados.filter(r => (r.item as Hotel).price <= filters.maxPrecio);
    }
    if (filters?.estrellas) {
      resultados = resultados.filter(r => (r.item as Hotel).rating >= filters.estrellas);
    }
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} habitaciones después de filtros`);
    
    return resultados;
  } catch (error) {
    console.error('[ESB Adapter] ❌ Error en WeWorkHub:', error);
    return [];
  }
}

/**
 * Búsqueda específica de KM25Madrid via SOAP
 */
export async function esbSearchKM25Madrid(filters?: any): Promise<SearchResult[]> {
  try {
    console.log('[ESB Adapter] 🏨 Buscando en KM25Madrid via SOAP...', filters);
    
    const useESB = import.meta.env.VITE_USE_ESB === 'true';
    if (!useESB) {
      console.warn('[ESB Adapter] ⚠️ ESB no está habilitado');
      return [];
    }
    
    // Importar adapter y config
    const km25Module = await import('../../../esb/gateway/km25madrid-hotel.adapter');
    const configModule = await import('../../../esb/utils/config');
    
    const config = configModule.getESBConfig();
    const km25Config = config.endpoints.km25Madrid;
    
    console.log('[ESB Adapter] Config KM25Madrid:', {
      url: km25Config.url,
      enabled: km25Config.enabled
    });
    
    if (!km25Config.enabled) {
      console.warn('[ESB Adapter] ⚠️ KM25Madrid está deshabilitado');
      return [];
    }
    
    // Crear adapter
    const adapter = new km25Module.KM25MadridHotelSoapAdapter(km25Config);
    
    // Construir filtros para el servicio SOAP
    const filtrosSoap: any = {
      serviceType: 'hotel',
      ciudad: filters?.ciudad || 'Madrid',
      checkIn: filters?.checkIn || new Date().toISOString().split('T')[0],
      checkOut: filters?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      adultos: filters?.adultos || 2,
      ninos: filters?.ninos || 0,
      habitaciones: filters?.habitaciones || 1,
      precioMin: filters?.minPrecio,
      precioMax: filters?.maxPrecio,
      clasificacion: filters?.estrellas
    };
    
    console.log('[ESB Adapter] Llamando a buscarServicios con filtros:', filtrosSoap);
    
    // Llamar al servicio SOAP
    const hoteles = await adapter.buscarServicios(filtrosSoap);
    
    console.log(`[ESB Adapter] ✅ Respuesta: ${hoteles.length} hoteles`);
    
    // Convertir a formato SearchResult
    const resultados: SearchResult[] = hoteles.map((h: any) => ({
      kind: 'hotel' as const,
      item: {
        id: `km25madrid-${h.IdServicio || h.idServicio || h.id}`,
        name: h.Nombre || h.nombre || 'KM25Madrid Hotel',
        city: h.Ciudad || h.ciudad || 'Madrid',
        price: parseFloat(h.Precio || h.precio || 0),
        rating: parseInt(h.Clasificacion || h.clasificacion || 5),
        photo: h.ImagenURL || h.imagenUrl || '/hotel-placeholder.jpg'
      } as Hotel
    }));
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} hoteles convertidos`);
    
    return resultados;
  } catch (error) {
    console.error('[ESB Adapter] ❌ Error en KM25Madrid:', error);
    return [];
  }
}

/**
 * Buscar específicamente en Backend Cuenca (servicio 100% funcional)
 */
export async function esbSearchBackendCuenca(filters?: {
  minPrecio?: number;
  maxPrecio?: number;
}): Promise<SearchResult[]> {
  try {
    console.log("[ESB Adapter] Buscando en Backend Cuenca con filtros:", filters);
    
    // Llamar directamente al adapter de Backend Cuenca
    const paquetes = await ESB.backendCuenca.buscarServicios(
      filters?.minPrecio,
      filters?.maxPrecio
    );
    
    console.log(`[ESB Adapter] Backend Cuenca encontró ${paquetes.length} paquetes`);
    
    // Convertir a formato SearchResult (usando tipo Car temporalmente)
    const resultados: SearchResult[] = paquetes.map((p: any) => ({
      kind: 'car', // Usamos 'car' temporalmente ya que no hay tipo 'package'
      item: {
        id: p.id || p.codigo || '',
        brand: 'Tour', // Marca genérica para paquetes
        model: p.nombre || p.name || 'Paquete Turístico',
        pricePerDay: p.adultPrice || p.precioAdulto || 0,
        photo: '/package-placeholder.jpg'
      } as Car
    }));
    
    return resultados;
  } catch (error) {
    console.error("[ESB Adapter] Error buscando en Backend Cuenca:", error);
    return [];
  }
}

/**
 * Buscar en cualquier empresa de autos del ESB (genérico)
 */
export async function esbSearchCarCompany(
  companyKey: 'cuencaCar' | 'autosRentCar' | 'rentaAutosMadrid' | 'alquilerAugye',
  filters?: any
): Promise<SearchResult[]> {
  try {
    console.log(`[ESB Adapter] Buscando en ${companyKey} con filtros:`, filters);
    
    let vehiculos: any[] = [];
    
    // Llamar al método específico según la empresa
    switch (companyKey) {
      case 'cuencaCar':
        vehiculos = await ESB.cuencaCar.buscarServicios(
          filters?.ciudad,
          filters?.categoria
        );
        break;
      
      case 'alquilerAugye':
        // Construir filtros para Alquiler Augye
        const filtrosAugye = {
          serviceType: 'car',
          ciudad: filters?.ciudad,
          categoria: filters?.categoria,
          gearbox: filters?.gearbox,
          pickupOffice: filters?.pickupOffice,
          dropoffOffice: filters?.dropoffOffice,
          pickupAt: filters?.pickupAt,
          dropoffAt: filters?.dropoffAt,
          driverAge: filters?.driverAge,
          precioMin: filters?.precioMin,
          precioMax: filters?.precioMax,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 50
        };
        vehiculos = await ESB.alquilerAugye.buscarServicios(filtrosAugye);
        break;
      
      // TODO: Implementar estos servicios cuando estén disponibles en el ESB
      // case 'autosRentCar':
      //   vehiculos = await ESB.rentCar.buscarServicios(...);
      //   break;
      // case 'rentaAutosMadrid':
      //   vehiculos = await ESB.rentaAutosMadrid.buscarServicios(...);
      //   break;
      
      default:
        console.warn(`[ESB Adapter] Empresa ${companyKey} aún no implementada`);
        return [];
    }
    
    console.log(`[ESB Adapter] ${companyKey} encontró ${vehiculos.length} vehículos`);
    
    // Convertir a formato SearchResult genérico
    const resultados: SearchResult[] = vehiculos.map((v: any) => {
      // Adaptarse a diferentes formatos de DTO
      const brand = v.Marca || v.marca || v.brand || 'Auto';
      const model = v.Modelo || v.modelo || v.model || '';
      const id = v.sku?.toString() || v.IdVehiculo?.toString() || v.IdAuto?.toString() || v.id?.toString() || v.Id?.toString() || '';
      const price = v.precioDia || v.PrecioBaseDia || v.PrecioPorDia || v.precioBase || 0;
      const city = v.ciudad || v.Ciudad || '';
      const category = v.categoria || v.Categoria || '';
      const transmission = v.gearbox || v.Gearbox || v.transmision || '';
      
      return {
        kind: 'car',
        item: {
          id: `${companyKey}-${id}`,
          brand,
          model,
          pricePerDay: price,
          city,
          category,
          transmission,
          photo: v.imagen || '/car-placeholder.jpg'
        } as Car
      };
    });
    
    // Aplicar filtros de precio si existen
    let filtered = resultados;
    if (filters?.minPrecio !== undefined) {
      filtered = filtered.filter(r => (r.item as Car).pricePerDay >= filters.minPrecio!);
    }
    if (filters?.maxPrecio !== undefined) {
      filtered = filtered.filter(r => (r.item as Car).pricePerDay <= filters.maxPrecio!);
    }
    
    return filtered;
  } catch (error) {
    console.error(`[ESB Adapter] Error buscando en ${companyKey}:`, error);
    return [];
  }
}

/**
 * Búsqueda específica de Sabor Andino via SOAP
 */
export async function esbSearchSaborAndino(filters?: any): Promise<SearchResult[]> {
  try {
    console.log('[ESB Adapter] 🌮 Buscando en Sabor Andino via SOAP...', filters);
    
    const useESB = import.meta.env.VITE_USE_ESB === 'true';
    if (!useESB) {
      console.warn('[ESB Adapter] ⚠️ ESB no está habilitado');
      return [];
    }
    
    // Importar adapter y config
    const saborAndinoModule = await import('../../../esb/gateway/sabor-andino.adapter');
    const configModule = await import('../../../esb/utils/config');
    
    const config = configModule.getESBConfig();
    const saborAndinoConfig = config.endpoints.saborAndino;
    
    console.log('[ESB Adapter] Config Sabor Andino:', {
      url: saborAndinoConfig.url,
      enabled: saborAndinoConfig.enabled
    });
    
    if (!saborAndinoConfig.enabled) {
      console.warn('[ESB Adapter] ⚠️ Sabor Andino está deshabilitado');
      return [];
    }
    
    // Crear adapter
    const adapter = new saborAndinoModule.SaborAndinoSoapAdapter(saborAndinoConfig);
    
    console.log('[ESB Adapter] Llamando a buscarServicios...');
    
    // Llamar al servicio SOAP
    const mesas = await adapter.buscarServicios('');
    
    console.log(`[ESB Adapter] ✅ Respuesta: ${mesas.length} mesas`);
    
    // Convertir a formato SearchResult
    let resultados: SearchResult[] = mesas.map((m: any) => {
      const nombre = m.Nombre || m.nombre || `Mesa #${m.IdServicio}`;
      
      // Extraer ubicación del nombre (ej: "Mesa Terraza (5 personas)" -> "Terraza")
      const nombreMatch = nombre.match(/Mesa\s+(\w+)/);
      const ubicacion = nombreMatch ? nombreMatch[1] : '';
      
      // Extraer capacidad del nombre (ej: "Mesa Terraza (5 personas)" -> 5)
      const capacidadMatch = nombre.match(/\((\d+)\s+personas?\)/);
      const capacidad = capacidadMatch ? parseInt(capacidadMatch[1]) : 2;
      
      return {
        kind: 'restaurant' as const,
        item: {
          id: `saborandino-${m.IdServicio || m.idServicio}`,
          name: nombre,
          city: m.Ciudad || m.ciudad || 'Guayaquil',
          price: parseFloat(m.Precio || m.precio || 0),
          rating: parseInt(m.Clasificacion || m.clasificacion || 5),
          photo: m.ImagenURL || m.imagenUrl || '/restaurant-placeholder.jpg',
          cuisine: 'Ecuatoriana',
          description: m.Descripcion || m.descripcion,
          tipo: ubicacion, // Ubicación extraída del nombre
          capacidad: capacidad // Capacidad extraída del nombre
        } as Restaurant
      };
    });
    
    // Aplicar filtros adicionales
    if (filters?.ubicacion) {
      resultados = resultados.filter(r => {
        const tipo = (r.item as Restaurant).tipo || '';
        return tipo.toLowerCase().includes(filters.ubicacion.toLowerCase());
      });
    }
    
    if (filters?.capacidad) {
      resultados = resultados.filter(r => {
        const capacidad = (r.item as Restaurant).capacidad || 2;
        return capacidad >= filters.capacidad;
      });
    }
    
    if (filters?.minPrecio) {
      resultados = resultados.filter(r => (r.item as Restaurant).price >= filters.minPrecio);
    }
    if (filters?.maxPrecio) {
      resultados = resultados.filter(r => (r.item as Restaurant).price <= filters.maxPrecio);
    }
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} mesas después de filtros`);
    
    return resultados;
  } catch (error) {
    console.error('[ESB Adapter] ❌ Error en Sabor Andino:', error);
    return [];
  }
}

/**
 * Búsqueda específica de El Cangrejo Feliz via SOAP
 */
export async function esbSearchElCangrejoFeliz(filters?: any): Promise<SearchResult[]> {
  try {
    console.log('[ESB Adapter] 🦀 Buscando en El Cangrejo Feliz via SOAP...', filters);
    
    const useESB = import.meta.env.VITE_USE_ESB === 'true';
    if (!useESB) {
      console.warn('[ESB Adapter] ⚠️ ESB no está habilitado');
      return [];
    }
    
    // Importar adapter y config
    const cangrejoModule = await import('../../../esb/gateway/cangrejo-feliz.adapter');
    const configModule = await import('../../../esb/utils/config');
    
    const config = configModule.getESBConfig();
    const cangrejoConfig = config.endpoints.cangrejoFeliz;
    
    console.log('[ESB Adapter] Config El Cangrejo Feliz:', {
      url: cangrejoConfig.url,
      enabled: cangrejoConfig.enabled
    });
    
    if (!cangrejoConfig.enabled) {
      console.warn('[ESB Adapter] ⚠️ El Cangrejo Feliz está deshabilitado');
      return [];
    }
    
    // Crear adapter
    const adapter = new cangrejoModule.ElCangrejoFelizSoapAdapter(cangrejoConfig);
    
    console.log('[ESB Adapter] Llamando a buscarServicios...');
    
    // Llamar al servicio SOAP
    const mesas = await adapter.buscarServicios('');
    
    console.log(`[ESB Adapter] ✅ Respuesta: ${mesas.length} mesas`);
    
    // Convertir a formato SearchResult
    let resultados: SearchResult[] = mesas.map((m: any) => ({
      kind: 'restaurant' as const,
      item: {
        id: `elcangrejofeliz-${m.IdServicio || m.idServicio}`,
        name: m.Nombre || m.nombre || `Mesa #${m.IdServicio}`,
        city: m.Ciudad || m.ciudad || 'Guayaquil',
        price: parseFloat(m.Precio || m.precio || 0),
        rating: parseInt(m.Clasificacion || m.clasificacion || 5),
        photo: m.ImagenURL || m.imagenUrl || '/restaurant-placeholder.jpg'
      } as Restaurant
    }));
    
    // Aplicar filtros adicionales
    if (filters?.minPrecio) {
      resultados = resultados.filter(r => (r.item as Restaurant).price >= filters.minPrecio);
    }
    if (filters?.maxPrecio) {
      resultados = resultados.filter(r => (r.item as Restaurant).price <= filters.maxPrecio);
    }
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} mesas después de filtros`);
    
    return resultados;
  } catch (error) {
    console.error('[ESB Adapter] ❌ Error en El Cangrejo Feliz:', error);
    return [];
  }
}

/**
 * Búsqueda específica de Sanctum Cortejo via SOAP
 */
export async function esbSearchSanctumCortejo(filters?: any): Promise<SearchResult[]> {
  try {
    console.log('[ESB Adapter] 🏛️  Buscando en Sanctum Cortejo via SOAP...', filters);
    
    const useESB = import.meta.env.VITE_USE_ESB === 'true';
    if (!useESB) {
      console.warn('[ESB Adapter] ⚠️ ESB no está habilitado');
      return [];
    }
    
    // Importar adapter y config
    const sanctumModule = await import('../../../esb/gateway/sanctum-cortejo.adapter');
    const configModule = await import('../../../esb/utils/config');
    
    const config = configModule.getESBConfig();
    const sanctumConfig = config.endpoints.restaurant; // Sanctum Cortejo usa el endpoint restaurant
    
    console.log('[ESB Adapter] Config Sanctum Cortejo:', {
      url: sanctumConfig.url,
      enabled: sanctumConfig.enabled
    });
    
    if (!sanctumConfig.enabled) {
      console.warn('[ESB Adapter] ⚠️ Sanctum Cortejo está deshabilitado');
      return [];
    }
    
    // Crear adapter
    const adapter = new sanctumModule.SanctumCortejoSoapAdapter(sanctumConfig);
    
    console.log('[ESB Adapter] Llamando a buscarServicios...');
    
    // Llamar al servicio SOAP
    const mesas = await adapter.buscarServicios('');
    
    console.log(`[ESB Adapter] ✅ Respuesta: ${mesas.length} mesas`);
    
    // Convertir a formato SearchResult
    let resultados: SearchResult[] = mesas.map((m: any) => ({
      kind: 'restaurant' as const,
      item: {
        id: `sanctumcortejo-${m.IdServicio}`,
        name: m.Nombre || `Mesa #${m.IdServicio}`,
        city: m.Ciudad || 'Madrid',
        rating: 5, // Todas son 5 estrellas según el XML
        price: parseFloat(m.Precio?.replace(',', '.') || '0'),
        photo: m.ImagenURL || '/img/restaurants/sanctum-cortejo-default.jpg',
        cuisine: m.Tipo || 'Restaurante',
        description: m.Descripcion || '',
        policies: m.Politicas || 'Cancelación sin costo 48h antes',
        rules: m.Reglas || 'No hay reembolsos'
      }
    }));
    
    // Aplicar filtros si los hay
    if (filters) {
      if (filters.ciudad) {
        const ciudadLower = filters.ciudad.toLowerCase();
        resultados = resultados.filter(r => 
          (r.item as Restaurant).city.toLowerCase().includes(ciudadLower)
        );
      }
      
      if (filters.precioMax) {
        resultados = resultados.filter(r => 
          (r.item as Restaurant).price <= parseFloat(filters.precioMax)
        );
      }
      
      if (filters.precioMin) {
        resultados = resultados.filter(r => 
          (r.item as Restaurant).price >= parseFloat(filters.precioMin)
        );
      }
    }
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} mesas después de filtros`);
    
    return resultados;
  } catch (error) {
    console.error('[ESB Adapter] ❌ Error en Sanctum Cortejo:', error);
    return [];
  }
}

/**
 * Búsqueda específica de 7 Mares via SOAP
 */
export async function esbSearchSieteMares(filters?: any): Promise<SearchResult[]> {
  try {
    console.log('[ESB Adapter] 🌊 Buscando en 7 Mares via SOAP...', filters);
    
    // Validación de USE_ESB
    if (import.meta.env.VITE_USE_ESB !== 'true') {
      console.warn('[ESB Adapter] ⚠️ USE_ESB no está habilitado');
      return [];
    }

    // Importar dinámicamente el adaptador de 7 Mares
    const sietemaresModule = await import('../../../esb/gateway/siete-mares.adapter');
    const { getESBConfig } = await import('../../../esb/utils/config');
    const config = getESBConfig();
    
    const sietemaresConfig = config.endpoints.sieteMares;
    
    console.log('[ESB Adapter] Config 7 Mares:', {
      url: sietemaresConfig.url,
      enabled: sietemaresConfig.enabled
    });

    if (!sietemaresConfig.enabled) {
      console.warn('[ESB Adapter] ⚠️ 7 Mares está deshabilitado');
      return [];
    }

    // Crear adaptador y buscar servicios
    const adapter = new sietemaresModule.SieteMaresSoapAdapter(sietemaresConfig);
    const mesas = await adapter.buscarServicios(''); // Buscar todas las mesas
    
    console.log(`[ESB Adapter] 📋 ${mesas.length} mesas encontradas en 7 Mares`);
    
    // Transformar a SearchResult
    let resultados: SearchResult[] = mesas.map(m => ({
      kind: 'restaurant' as const,
      item: {
        id: `sietemares-${m.IdTipo}`,
        name: m.Nombre || 'Mesa 7 Mares',
        city: 'Cuenca', // 7 Mares está en Cuenca
        cuisine: m.Subtipo || 'Mariscos',
        price: parseFloat(m.Descripcion?.match(/\$(\d+)/)?.[1] || '15'), // Extraer precio de descripción
        rating: 4, // Rating por defecto
        photo: '/img/restaurants/7mares-default.jpg',
        description: m.Descripcion || 'Restaurante 7 Mares - Especialidad en mariscos'
      }
    }));

    // Aplicar filtros si existen
    if (filters) {
      // Filtro por ciudad
      if (filters.city) {
        resultados = resultados.filter(r => {
          if (r.kind !== 'restaurant') return false;
          const restaurant = r.item as import('../../models/types').Restaurant;
          return restaurant.city.toLowerCase().includes(filters.city.toLowerCase());
        });
      }

      // Filtro por precio mínimo
      if (typeof filters.priceMin === 'number') {
        resultados = resultados.filter(r => {
          if (r.kind !== 'restaurant') return false;
          const restaurant = r.item as import('../../models/types').Restaurant;
          return restaurant.price >= filters.priceMin;
        });
      }

      // Filtro por precio máximo
      if (typeof filters.priceMax === 'number') {
        resultados = resultados.filter(r => {
          if (r.kind !== 'restaurant') return false;
          const restaurant = r.item as import('../../models/types').Restaurant;
          return restaurant.price <= filters.priceMax;
        });
      }

      // Filtro por rating mínimo
      if (typeof filters.ratingMin === 'number') {
        resultados = resultados.filter(r => {
          if (r.kind !== 'restaurant') return false;
          const restaurant = r.item as import('../../models/types').Restaurant;
          return (restaurant.rating ?? 0) >= filters.ratingMin;
        });
      }
    }
    
    console.log(`[ESB Adapter] ✅ ${resultados.length} mesas después de filtros`);
    
    return resultados;
  } catch (error) {
    console.error('[ESB Adapter] ❌ Error en 7 Mares:', error);
    return [];
  }
}

