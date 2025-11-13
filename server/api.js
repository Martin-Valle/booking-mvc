/**
 * API REST Server - Backend que usa ESB para llamar a servicios SOAP
 * Este servidor corre en Node.js y expone endpoints REST para el frontend
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Importar configuración del ESB
let esbConfig;
(async () => {
  const configModule = await import('../esb/utils/config.ts');
  esbConfig = configModule.defaultConfig;
})();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Server running' });
});

// ==================== RESTAURANTES ====================

/**
 * Buscar mesas en Sabor Andino
 * POST /api/restaurants/saborandino/search
 */
app.post('/api/restaurants/saborandino/search', async (req, res) => {
  try {
    console.log('[API] 🍽️  Buscando mesas en Sabor Andino...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { SaborAndinoSoapAdapter } = await import('../esb/gateway/sabor-andino.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new SaborAndinoSoapAdapter(defaultConfig.endpoints.saborAndino);
    
    const { fecha, personas, hora } = req.body;
    
    // Sabor Andino usa buscarServicios con filtros VACÍOS (retorna todas las mesas)
    // El servicio no soporta filtrado en SOAP, se filtra en cliente
    const filtros = '';
    
    console.log('[API] 📝 Búsqueda con parámetros:', { fecha, personas, hora });
    const servicios = await adapter.buscarServicios(filtros);
    console.log('[API] 📦 Servicios recibidos del adapter:', servicios.length);
    
    if (servicios.length > 0) {
      console.log('[API] 🔍 Primer servicio:', servicios[0]);
    }
    
    // Transformar servicios a formato de mesas
    let mesas = servicios.map(servicio => ({
      id: servicio.IdServicio,
      numero: servicio.IdServicio,
      capacidad: personas || 2, // Sabor Andino no retorna capacidad, usar personas solicitadas
      precio: parseFloat(servicio.Precio) || 0,
      disponible: true,
      nombre: servicio.Nombre,
      tipo: servicio.Tipo, // Ubicación: Terraza, Afuera, Interior, VIP
      descripcion: servicio.Descripcion,
      ciudad: servicio.Ciudad,
      clasificacion: servicio.Clasificacion,
      foto: servicio.ImagenURL
    }));

    // NO filtrar por capacidad porque el servicio no la retorna
    // Sabor Andino retorna todas las mesas disponibles

    console.log(`[API] ✅ ${mesas.length} mesas encontradas`);
    res.json(mesas);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar mesas', 
      message: error.message 
    });
  }
});

/**
 * Buscar mesas en El Cangrejo Feliz
 * POST /api/restaurants/elcangrejofeliz/search
 */
app.post('/api/restaurants/elcangrejofeliz/search', async (req, res) => {
  try {
    console.log('[API] 🦀 Buscando mesas en El Cangrejo Feliz...');
    
    const { ElCangrejoFelizSoapAdapter } = await import('../esb/gateway/cangrejo-feliz.adapter.ts');
    const adapter = new ElCangrejoFelizSoapAdapter();
    
    const { fecha, personas, hora } = req.body;
    const result = await adapter.buscarMesas(fecha, personas, hora);
    
    console.log(`[API] ✅ ${result.length} mesas encontradas`);
    res.json(result);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error al buscar mesas', 
      message: error.message 
    });
  }
});

/**
 * Buscar mesas en Sanctum Cortejo
 * POST /api/restaurants/sanctumcortejo/search
 */
app.post('/api/restaurants/sanctumcortejo/search', async (req, res) => {
  try {
    console.log('[API] 🍷 Buscando mesas en Sanctum Cortejo...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { SanctumCortejoSoapAdapter } = await import('../esb/gateway/sanctum-cortejo.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new SanctumCortejoSoapAdapter(defaultConfig.endpoints.restaurant);
    
    const { fecha, personas, hora } = req.body;
    
    // Sanctum Cortejo usa buscarServicios con filtros VACÍOS
    const filtros = '';
    
    console.log('[API] 📝 Búsqueda con parámetros:', { fecha, personas, hora });
    const servicios = await adapter.buscarServicios(filtros);
    console.log('[API] 📦 Servicios recibidos del adapter:', servicios.length);
    
    if (servicios.length > 0) {
      console.log('[API] 🔍 Primer servicio:', servicios[0]);
    }
    
    // Transformar servicios a formato de mesas
    const mesas = servicios.map(servicio => ({
      id: servicio.IdServicio,
      numero: servicio.IdServicio,
      capacidad: personas || 2,
      precio: parseFloat(servicio.Precio) || 0,
      disponible: true,
      nombre: servicio.Nombre,
      tipo: servicio.Tipo, // Ubicación
      descripcion: servicio.Descripcion,
      ciudad: servicio.Ciudad,
      clasificacion: servicio.Clasificacion,
      foto: servicio.ImagenURL
    }));

    console.log(`[API] ✅ ${mesas.length} mesas encontradas`);
    res.json(mesas);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar mesas', 
      message: error.message 
    });
  }
});

/**
 * Buscar mesas en Siete Mares
 * POST /api/restaurants/sietemares/search
 */
app.post('/api/restaurants/sietemares/search', async (req, res) => {
  try {
    console.log('[API] 🐟 Buscando mesas en Siete Mares...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { SieteMaresSoapAdapter } = await import('../esb/gateway/siete-mares.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new SieteMaresSoapAdapter(defaultConfig.endpoints.sieteMares);
    
    const { fecha, personas, hora, ciudad } = req.body;
    
    // Siete Mares busca por ciudad (según ejemplo: "Guayaquil")
    // Si no se especifica ciudad, buscar en Guayaquil por defecto
    const ciudadBusqueda = ciudad || 'Guayaquil';
    
    console.log('[API] 📝 Búsqueda con parámetros:', { fecha, personas, hora, ciudad: ciudadBusqueda });
    const servicios = await adapter.buscarServicios(ciudadBusqueda);
    console.log('[API] 📦 Servicios recibidos del adapter:', servicios.length);
    
    if (servicios.length > 0) {
      console.log('[API] 🔍 Primer servicio:', servicios[0]);
    }
    
    // Transformar servicios a formato de mesas
    const mesas = servicios.map(servicio => ({
      id: servicio.IdTipo,
      numero: servicio.IdTipo,
      capacidad: personas || 2,
      precio: 0, // Siete Mares no tiene precio en buscarServicios
      disponible: true,
      nombre: servicio.Nombre,
      tipo: servicio.Subtipo, // Ubicación
      descripcion: servicio.Descripcion,
      ciudad: ciudadBusqueda,
      clasificacion: '',
      foto: ''
    }));

    console.log(`[API] ✅ ${mesas.length} mesas encontradas`);
    res.json(mesas);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar mesas', 
      message: error.message 
    });
  }
});

// ==================== HOTELES ====================

/**
 * Buscar habitaciones en KM25 Madrid Hotel
 * POST /api/hotels/km25madrid/search
 */
app.post('/api/hotels/km25madrid/search', async (req, res) => {
  try {
    console.log('[API] 🏨 Buscando habitaciones en KM25 Madrid...');
    
    const { KM25MadridHotelSoapAdapter } = await import('../esb/gateway/km25madrid-hotel.adapter.ts');
    const adapter = new KM25MadridHotelSoapAdapter();
    
    const { fechaEntrada, fechaSalida, personas } = req.body;
    const result = await adapter.buscarHabitaciones(fechaEntrada, fechaSalida, personas);
    
    console.log(`[API] ✅ ${result.length} habitaciones encontradas`);
    res.json(result);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error al buscar habitaciones', 
      message: error.message 
    });
  }
});

/**
 * Buscar habitaciones en WeWorkHub
 * POST /api/hotels/weworkhub/search
 */
app.post('/api/hotels/weworkhub/search', async (req, res) => {
  try {
    console.log('[API] 🏢 Buscando habitaciones en WeWorkHub...');
    
    const { WeWorkHubIntegracionSoapAdapter } = await import('../esb/gateway/weworkhub-integracion.adapter.ts');
    const adapter = new WeWorkHubIntegracionSoapAdapter();
    
    const { fechaEntrada, fechaSalida, personas } = req.body;
    const result = await adapter.buscarHabitaciones(fechaEntrada, fechaSalida, personas);
    
    console.log(`[API] ✅ ${result.length} habitaciones encontradas`);
    res.json(result);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error al buscar habitaciones', 
      message: error.message 
    });
  }
});

/**
 * Buscar habitaciones en Hotel Perros (Pet Hotel)
 * POST /api/hotels/hotelperros/search
 */
app.post('/api/hotels/hotelperros/search', async (req, res) => {
  try {
    console.log('[API] 🐕 Buscando servicios en Hotel Perros (Pet Hotel)...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { HotelPerrosSoapAdapter } = await import('../esb/gateway/hotel-perros.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new HotelPerrosSoapAdapter(defaultConfig.endpoints.hotelPerros);
    
    const { inicio, fin, unidades, tamano, ciudad } = req.body;
    
    // Construir filtros para Hotel Perros
    const filtros = {
      Inicio: inicio || new Date().toISOString().split('T')[0],
      Fin: fin || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      Unidades: unidades || 1,
      Tamano: tamano, // PEQUEÑO, MEDIANO, GRANDE
      Ciudad: ciudad
    };
    
    console.log('[API] 📝 Búsqueda con filtros:', filtros);
    
    // Llamar a buscarServicios
    const resultado = await adapter.buscarServicios(filtros);
    console.log('[API] 📦 Resultado:', resultado);
    
    if (resultado.Ok) {
      const servicios = resultado.Data || [];
      console.log('[API] 📦 Servicios recibidos:', servicios.length);
      
      // Transformar a formato estándar
      const rooms = servicios.map(s => ({
        id: s.Sku,
        nombre: s.Nombre,
        precio: s.TarifaBaseNoche,
        disponible: s.Disponible,
        moneda: s.Moneda
      }));
      
      console.log(`[API] ✅ ${rooms.length} servicios encontrados`);
      res.json(rooms);
    } else {
      console.log('[API] ⚠️  Búsqueda sin resultados:', resultado.Mensaje);
      res.json([]);
    }
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar servicios', 
      message: error.message 
    });
  }
});

/**
 * Buscar hoteles en Hotel UIO (Service 16)
 * POST /api/hotels/hoteluio/search
 * Incluye feature única: obtenerFactura (Invoice generation)
 */
app.post('/api/hotels/hoteluio/search', async (req, res) => {
  try {
    console.log('[API] 🏨 Buscando hoteles en Hotel UIO...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { HotelUIOAdapter } = await import('../esb/gateway/hotel-uio.adapter.ts');
    const adapter = new HotelUIOAdapter();
    
    const { ciudad, precioMax, fecha } = req.body;
    
    console.log('[API] 📝 Búsqueda con filtros:', { ciudad, precioMax, fecha });
    
    // Llamar a buscarServicios
    const hoteles = await adapter.buscarServicios(ciudad, precioMax, fecha);
    console.log('[API] 📦 Hoteles recibidos:', hoteles.length);
    
    // Transformar a formato SearchResult para el frontend
    const results = hoteles.map(hotel => ({
      id: `hotel-uio-${hotel.IdHotel}`,
      nombre: hotel.Nombre,
      descripcion: hotel.Descripcion || `Hotel ${hotel.Estrellas} estrellas en ${hotel.Ciudad}`,
      precio: 0, // Se obtiene con cotizarReserva
      moneda: 'USD',
      disponible: true,
      imagen: hotel.Imagen || 'https://via.placeholder.com/300x200?text=Hotel',
      fechaInicio: fecha || new Date().toISOString().split('T')[0],
      fechaFin: fecha || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      kind: 'hotel',
      provider: 'hoteluio',
      // Metadata adicional de Hotel UIO
      metadata: {
        idHotel: hotel.IdHotel,
        ciudad: hotel.Ciudad,
        direccion: hotel.Direccion,
        estrellas: hotel.Estrellas,
        telefono: hotel.Telefono,
        correo: hotel.Correo
      }
    }));
    
    console.log(`[API] ✅ ${results.length} hoteles encontrados en Hotel UIO`);
    res.json(results);
    
  } catch (error) {
    console.error('[API] ❌ Error en Hotel UIO:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar hoteles en Hotel UIO', 
      message: error.message 
    });
  }
});

/**
 * Buscar habitaciones en Hotel Boutique Paris
 * POST /api/hotels/hotelboutique/search
 */
app.post('/api/hotels/hotelboutique/search', async (req, res) => {
  try {
    console.log('[API] 🏨 Buscando habitaciones en Hotel Boutique Paris...');
    
    const { HotelBoutiqueSoapAdapter } = await import('../esb/gateway/hotel-boutique.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new HotelBoutiqueSoapAdapter(defaultConfig.endpoints.hotelBoutique);
    
    const { ciudad, precioMin, precioMax, amenities, fechaInicio, fechaFin } = req.body;
    
    console.log('[API] 📝 Búsqueda con filtros:', { ciudad, precioMin, precioMax, amenities });
    
    // Llamar a buscarServicios
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    const fin = fechaFin ? new Date(fechaFin) : new Date(Date.now() + 86400000 * 3);
    
    const rooms = await adapter.buscarServicios(ciudad, inicio, fin, precioMin, precioMax, amenities);
    console.log('[API] 📦 Habitaciones recibidas:', rooms.length);
    
    // Transformar a formato SearchResult para el frontend
    const results = rooms.map(room => ({
      id: `hotelboutique-${room.RoomId}`,
      nombre: `${room.HotelName} - ${room.RoomType}`,
      descripcion: `${room.Board} | ${room.NumberBeds} cama(s) | ${room.Amenities}`,
      precio: room.PricePerNight,
      moneda: room.Currency || 'USD',
      disponible: !room.IsReserved,
      imagen: 'https://via.placeholder.com/300x200?text=Hotel+Boutique',
      kind: 'hotel',
      provider: 'hotelboutique',
      // Metadata adicional
      metadata: {
        roomId: room.RoomId,
        hotelId: room.HotelId,
        roomType: room.RoomType,
        numberBeds: room.NumberBeds,
        occupancyAdults: room.OccupancyAdults,
        occupancyChildren: room.OccupancyChildren,
        board: room.Board,
        amenities: room.Amenities,
        breakfastIncluded: room.BreakfastIncluded,
        ciudad: room.City,
        hotelName: room.HotelName
      }
    }));
    
    console.log(`[API] ✅ ${results.length} habitaciones encontradas en Hotel Boutique`);
    res.json(results);
    
  } catch (error) {
    console.error('[API] ❌ Error en Hotel Boutique:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar habitaciones en Hotel Boutique', 
      message: error.message 
    });
  }
});

// ==================== CARROS ====================

/**
 * Buscar vehículos en Easy Car
 * POST /api/cars/easycar/search
 */
app.post('/api/cars/easycar/search', async (req, res) => {
  try {
    console.log('[API] 🚗 Buscando vehículos en Easy Car...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { EasyCarSoapAdapter } = await import('../esb/gateway/easy-car.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new EasyCarSoapAdapter(defaultConfig.endpoints.easyCar);
    
    const { categoria, transmision, fechaInicio, fechaFin, edadConductor } = req.body;
    
    console.log('[API] 📝 Búsqueda con parámetros:', { categoria, transmision, fechaInicio, fechaFin, edadConductor });
    
    // Llamar a buscarServicios con los filtros
    const vehiculos = await adapter.buscarServicios(categoria, transmision, fechaInicio, fechaFin, edadConductor);
    console.log('[API] 📦 Vehículos recibidos del adapter:', vehiculos.length);
    
    if (vehiculos.length > 0) {
      console.log('[API] 🔍 Primer vehículo:', vehiculos[0]);
    }
    
    // Transformar vehículos a formato estándar
    const cars = vehiculos.map(v => ({
      id: v.IdVehiculo,
      marca: v.Marca,
      modelo: v.Modelo,
      anio: v.Anio,
      categoria: v.Categoria,
      transmision: v.Transmision,
      combustible: v.Combustible,
      precio: v.PrecioBaseDia,
      disponible: v.Activo,
      agencia: v.IdAgencia
    }));
    
    console.log(`[API] ✅ ${cars.length} vehículos encontrados`);
    res.json(cars);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar vehículos', 
      message: error.message 
    });
  }
});

/**
 * Buscar vehículos en Alquiler Augye
 * POST /api/cars/alquileraugye/search
 */
app.post('/api/cars/alquileraugye/search', async (req, res) => {
  try {
    console.log('[API] 🚗 Buscando vehículos en Alquiler Augye...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { AlquilerAugyeSoapAdapter } = await import('../esb/gateway/alquiler-augye.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new AlquilerAugyeSoapAdapter(defaultConfig.endpoints.alquilerAugye);
    
    const { categoria, gearbox, ciudad, page, pageSize } = req.body;
    
    // Construir filtros para Alquiler Augye
    // IMPORTANTE: serviceType es requerido (1 para búsqueda de autos)
    const filtros = {
      serviceType: '1',  // ✅ Campo requerido para que funcione
      categoria: categoria || undefined,
      gearbox: gearbox || undefined,
      ciudad: ciudad || undefined,
      page: page || 1,
      pageSize: pageSize || 50
    };
    
    console.log('[API] 📝 Búsqueda con filtros:', filtros);
    
    // Llamar a buscarServicios con los filtros
    const vehiculos = await adapter.buscarServicios(filtros);
    console.log('[API] 📦 Vehículos recibidos del adapter:', vehiculos.length);
    
    if (vehiculos.length > 0) {
      console.log('[API] 🔍 Primer vehículo:', vehiculos[0]);
    }
    
    // Transformar vehículos a formato estándar
    const cars = vehiculos.map(v => ({
      id: v.sku,
      marca: v.marca,
      modelo: v.modelo,
      categoria: v.categoria,
      transmision: v.gearbox,
      precio: v.precioDia,
      ciudad: v.ciudad,
      foto: v.imagen
    }));
    
    console.log(`[API] ✅ ${cars.length} vehículos encontrados`);
    res.json(cars);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar vehículos', 
      message: error.message 
    });
  }
});

/**
 * Buscar vehículos en Cuenca Car
 * POST /api/cars/cuencacar/search
 */
app.post('/api/cars/cuencacar/search', async (req, res) => {
  try {
    console.log('[API] 🚙 Buscando vehículos en Cuenca Car...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { CuencaCarRentalSoapAdapter } = await import('../esb/gateway/cuenca-car.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new CuencaCarRentalSoapAdapter(defaultConfig.endpoints.cuencaCar);
    
    const { ciudad, categoria } = req.body;
    
    console.log('[API] 📝 Búsqueda con parámetros:', { ciudad, categoria });
    
    // Llamar a buscarServicios (método correcto del adapter)
    const vehiculos = await adapter.buscarServicios(ciudad, categoria);
    console.log('[API] 📦 Vehículos recibidos del adapter:', vehiculos.length);
    
    if (vehiculos.length > 0) {
      console.log('[API] 🔍 Primer vehículo:', vehiculos[0]);
    }
    
    // Transformar a formato estándar
    const cars = vehiculos.map(v => ({
      id: v.IdVehiculo,
      marca: v.Marca,
      modelo: v.Modelo,
      categoria: v.Categoria,
      transmision: v.Transmision,
      pricePerDay: v.PrecioDia,
      ciudad: v.Ciudad,
      disponible: v.Disponible,
      agencyId: v.AgencyId
    }));
    
    console.log(`[API] ✅ ${cars.length} vehículos encontrados`);
    res.json(cars);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar vehículos', 
      message: error.message 
    });
  }
});

/**
 * Buscar vehículos en Autos Rent Car
 * POST /api/cars/rentcar/search
 */
app.post('/api/cars/rentcar/search', async (req, res) => {
  try {
    console.log('[API] 🚕 Buscando vehículos en Autos Rent Car...');
    
    const { AutosRentCarSoapAdapter } = await import('../esb/gateway/autos-rentcar.adapter.ts');
    const adapter = new AutosRentCarSoapAdapter();
    
    const { fechaInicio, fechaFin, ciudad } = req.body;
    const result = await adapter.buscarVehiculos(fechaInicio, fechaFin, ciudad);
    
    console.log(`[API] ✅ ${result.length} vehículos encontrados`);
    res.json(result);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error al buscar vehículos', 
      message: error.message 
    });
  }
});

/**
 * Buscar vehículos en Backend Cuenca
 * POST /api/cars/backendcuenca/search
 */
app.post('/api/cars/backendcuenca/search', async (req, res) => {
  try {
    console.log('[API] 🚐 Buscando vehículos en Backend Cuenca...');
    
    const { BackendCuencaSoapAdapter } = await import('../esb/gateway/backend-cuenca.adapter.ts');
    const adapter = new BackendCuencaSoapAdapter();
    
    const { fechaInicio, fechaFin, ciudad } = req.body;
    const result = await adapter.buscarVehiculos(fechaInicio, fechaFin, ciudad);
    
    console.log(`[API] ✅ ${result.length} vehículos encontrados`);
    res.json(result);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error al buscar vehículos', 
      message: error.message 
    });
  }
});

/**
 * Buscar vehículos en Renta Autos Madrid
 * POST /api/cars/rentaautosmadrid/search
 */
app.post('/api/cars/rentaautosmadrid/search', async (req, res) => {
  try {
    console.log('[API] 🚗 Buscando vehículos en Renta Autos Madrid...');
    
    const { RentaAutosMadridSoapAdapter } = await import('../esb/gateway/renta-autos-madrid.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new RentaAutosMadridSoapAdapter(defaultConfig.endpoints.rentaAutosMadrid);
    
    const { ciudad, categoria, gearbox, precioMin, precioMax } = req.body;
    
    // Construir filtro
    const filtro = {};
    if (ciudad) filtro.Ciudad = ciudad;
    if (categoria) filtro.Categoria = categoria;
    if (gearbox) filtro.Gearbox = gearbox;
    if (precioMin !== undefined) filtro.PrecioMin = precioMin;
    if (precioMax !== undefined) filtro.PrecioMax = precioMax;
    
    console.log('[API] 📝 Búsqueda con filtros:', filtro);
    
    // Llamar a buscarServicios
    const servicios = await adapter.buscarServicios(Object.keys(filtro).length > 0 ? filtro : undefined);
    console.log(`[API] 📦 Servicios recibidos:`, servicios.length);
    
    // Transformar a formato SearchResult para el frontend
    const results = servicios.map(servicio => ({
      id: `renta-madrid-${servicio.Id}`,
      nombre: servicio.Nombre,
      descripcion: `${servicio.Categoria} - ${servicio.Gearbox} - ${servicio.Ciudad}`,
      precio: servicio.Precio,
      moneda: 'EUR',
      disponible: servicio.Disponible,
      imagen: servicio.Imagenes[0] || 'https://via.placeholder.com/300x200?text=Car',
      kind: 'car',
      provider: 'rentaautosmadrid',
      // Metadata adicional
      metadata: {
        idServicio: servicio.Id,
        categoria: servicio.Categoria,
        gearbox: servicio.Gearbox,
        ciudad: servicio.Ciudad,
        hotel: servicio.Hotel,
        imagenes: servicio.Imagenes
      }
    }));
    
    console.log(`[API] ✅ ${results.length} vehículos encontrados en Renta Autos Madrid`);
    res.json(results);
    
  } catch (error) {
    console.error('[API] ❌ Error en Renta Autos Madrid:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar vehículos en Renta Autos Madrid', 
      message: error.message 
    });
  }
});

// ==================== VUELOS ====================

/**
 * Buscar vuelos en SkyAndes
 * POST /api/flights/skyandes/search
 */
app.post('/api/flights/skyandes/search', async (req, res) => {
  try {
    console.log('[API] ✈️  Buscando vuelos en SkyAndes...');
    
    // Importar dinámicamente el ESB (archivo TypeScript)
    const { SkyAndesFlightSoapAdapter } = await import('../esb/gateway/skyandes.adapter.ts');
    const { defaultConfig } = await import('../esb/utils/config.ts');
    const adapter = new SkyAndesFlightSoapAdapter(defaultConfig.endpoints.skyandes);
    
    const { originId, destinationId, fecha, cabinClass } = req.body;
    
    console.log('[API] 📝 Búsqueda con parámetros:', { originId, destinationId, fecha, cabinClass });
    
    // Convertir fecha string a Date
    const fechaBusqueda = new Date(fecha);
    
    // Buscar vuelos
    const vuelos = await adapter.buscarServicios(
      originId || 1, // Default: Quito
      destinationId || 2, // Default: Guayaquil
      fechaBusqueda,
      cabinClass || 'Economy'
    );
    
    console.log(`[API] ✅ ${vuelos.length} vuelos encontrados`);
    
    // Mapear a formato SearchResult
    const results = vuelos.map(vuelo => ({
      kind: 'flight',
      id: vuelo.FlightId.toString(),
      title: `${vuelo.Airline} ${vuelo.FlightNumber}`,
      description: `${vuelo.Duration} • ${vuelo.CabinClass}`,
      price: 0, // El precio se obtiene con cotizarReserva
      imageUrl: 'https://via.placeholder.com/300x200?text=Flight',
      tags: [vuelo.CabinClass, vuelo.Airline],
      availability: true,
      metadata: {
        airline: vuelo.Airline,
        flightNumber: vuelo.FlightNumber,
        originId: vuelo.OriginId,
        destinationId: vuelo.DestinationId,
        departureTime: vuelo.DepartureTime,
        arrivalTime: vuelo.ArrivalTime,
        duration: vuelo.Duration,
        cabinClass: vuelo.CabinClass,
        cancellationPolicy: vuelo.CancellationPolicy,
        aircraftId: vuelo.AircraftId
      }
    }));
    
    res.json(results);
    
  } catch (error) {
    console.error('[API] ❌ Error:', error.message);
    console.error('[API] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar vuelos', 
      message: error.message 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 API Server corriendo en http://localhost:${PORT}`);
  console.log(`📡 Endpoints REST disponibles:`);
  console.log(`\n   🍽️  RESTAURANTES:`);
  console.log(`   - POST /api/restaurants/saborandino/search`);
  console.log(`   - POST /api/restaurants/elcangrejofeliz/search`);
  console.log(`   - POST /api/restaurants/sanctumcortejo/search`);
  console.log(`   - POST /api/restaurants/sietemares/search`);
  console.log(`\n   🏨 HOTELES:`);
  console.log(`   - POST /api/hotels/km25madrid/search`);
  console.log(`   - POST /api/hotels/weworkhub/search`);
  console.log(`   - POST /api/hotels/hotelperros/search`);
  console.log(`\n   🚗 CARROS:`);
  console.log(`   - POST /api/cars/easycar/search`);
  console.log(`   - POST /api/cars/cuencacar/search`);
  console.log(`   - POST /api/cars/rentcar/search`);
  console.log(`   - POST /api/cars/backendcuenca/search`);
  console.log(`\n   ✈️  VUELOS:`);
  console.log(`   - POST /api/flights/skyandes/search`);
  console.log(`\n   ✅ GET /api/health\n`);
});
