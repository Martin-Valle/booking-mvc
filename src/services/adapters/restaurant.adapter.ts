/**
 * Adapter para el servicio de Restaurantes (ESB)
 * Conecta con el servicio SOAP de Sanctum Cortejo
 * 
 * ESTADO: Usando mock data porque buscarServicios tiene error de DB
 * Las operaciones de reserva (cotizar, confirmar, cancelar) SÍ funcionan
 */

import type { Restaurant } from '../../models/types';
// import { ESB } from '../../../esb'; // Comentado temporalmente

/**
 * Obtiene restaurantes desde el ESB
 * @param query Término de búsqueda (tipo de cocina, ciudad, etc.)
 */
export async function getRestaurants(query: string = ''): Promise<Restaurant[]> {
  // NOTA: El servicio SOAP buscarServicios tiene error de BD del servidor
  // Por ahora usamos datos mock que incluyen el restaurante de Sanctum Cortejo
  // Las otras operaciones del servicio (cotizar, pre-reserva, confirmar, cancelar) SÍ funcionan
  
  console.log('🍽️ Cargando restaurantes (usando mock + Sanctum Cortejo)...');
  
  // Devolver directamente los mock que incluyen Sanctum Cortejo como el primero
  return getMockRestaurants(query);
  
  /* 
  // Código original para cuando se arregle el error de BD del servidor:
  try {
    const servicios = await ESB.restaurante.buscarServicios(query);
    
    return servicios.map((servicio: any) => ({
      id: String(servicio.IdServicio),
      name: servicio.Nombre,
      city: servicio.Ciudad,
      price: parseFloat(servicio.Precio) || 0,
      rating: parseFloat(servicio.Clasificacion) || 0,
      photo: servicio.ImagenURL || '/assets/restaurant-default.jpg',
      cuisine: servicio.Tipo || 'Internacional',
      description: servicio.Descripcion,
      policies: servicio.Politicas,
      rules: servicio.Reglas
    }));
  } catch (error: any) {
    console.error('Error al obtener restaurantes:', error);
    return getMockRestaurants(query);
  }
  */
}

/**
 * Obtiene el detalle de un restaurante por ID
 * NOTA: Para ID=1 (Sanctum Cortejo) las operaciones avanzadas SÍ funcionan:
 * - Cotizar reserva
 * - Crear pre-reserva  
 * - Confirmar reserva
 * - Cancelar reserva
 */
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  // Usar mock data (incluye Sanctum Cortejo como ID=1)
  console.log(`🍽️ Obteniendo detalle del restaurante ID: ${id}`);
  
  const mockRestaurants = getMockRestaurants('');
  const restaurant = mockRestaurants.find(r => r.id === id);
  
  if (restaurant && id === '1') {
    console.log('✅ Restaurante Sanctum Cortejo - Operaciones SOAP disponibles:');
    console.log('  - ESB.restaurante.cotizar()');
    console.log('  - ESB.restaurante.crearPreReserva()');
    console.log('  - ESB.restaurante.confirmarReserva()');
    console.log('  - ESB.restaurante.cancelar()');
  }
  
  return restaurant || null;
  
  /*
  // Código original para cuando se arregle buscarServicios:
  try {
    const servicio = await ESB.restaurante.obtenerDetalle(Number(id));
    
    return {
      id: String(servicio.IdServicio),
      name: servicio.Nombre,
      city: servicio.Ciudad,
      price: parseFloat(servicio.Precio) || 0,
      rating: parseFloat(servicio.Clasificacion) || 0,
      photo: servicio.ImagenURL || '/assets/restaurant-default.jpg',
      cuisine: servicio.Tipo || 'Internacional',
      description: servicio.Descripcion,
      policies: servicio.Politicas,
      rules: servicio.Reglas
    };
  } catch (error) {
    console.error('Error al obtener detalle de restaurante:', error);
    const mockRestaurants = getMockRestaurants('');
    return mockRestaurants.find(r => r.id === id) || null;
  }
  */
}

/**
 * Datos mock para desarrollo (cuando el servicio no está disponible)
 */
function getMockRestaurants(query: string = ''): Restaurant[] {
  const mockData: Restaurant[] = [
    {
      id: '1',
      name: 'Sanctum Cortejo Restaurant',
      city: 'Ecuador',
      price: 35,
      rating: 4.8,
      photo: '/assets/restaurant1.jpg',
      cuisine: 'Internacional',
      description: 'Restaurante ecuatoriano con servicio de reservas en línea. Ofrece una experiencia gastronómica única con platillos tradicionales e internacionales.',
      policies: 'Reserva con 24 horas de anticipación. Cancelación gratuita hasta 2 horas antes. Servicio de cotización disponible.',
      rules: 'Capacidad limitada por mesa. Menú especial disponible. Sistema de pre-reserva con hold de 15 minutos.'
    },
    {
      id: '2',
      name: 'El Sabor Ecuatoriano',
      city: 'Quito',
      price: 25,
      rating: 4.8,
      photo: '/assets/restaurant2.jpg',
      cuisine: 'Ecuatoriana',
      description: 'Auténtica comida ecuatoriana en el corazón de Quito. Especialidades de la sierra con ingredientes frescos y locales.',
      policies: 'Reserva con 24 horas de anticipación. Cancelación gratuita hasta 2 horas antes.',
      rules: 'No se permiten mascotas. Código de vestimenta: casual elegante.'
    },
    {
      id: '3',
      name: 'La Costa Marina',
      city: 'Guayaquil',
      price: 35,
      rating: 4.6,
      photo: '/assets/restaurant3.jpg',
      cuisine: 'Mariscos',
      description: 'Los mejores mariscos del Pacífico. Ceviche de camarón, encocado y más especialidades costeñas.',
      policies: 'Reserva recomendada en fines de semana. Cancelación flexible.',
      rules: 'Capacidad máxima: 6 personas por mesa. Ambiente familiar.'
    },
    {
      id: '4',
      name: 'Pizzería Italiana Da Vinci',
      city: 'Cuenca',
      price: 20,
      rating: 4.7,
      photo: '/assets/restaurant4.jpg',
      cuisine: 'Italiana',
      description: 'Pizzas al horno de leña con recetas tradicionales italianas. Pasta fresca hecha en casa.',
      policies: 'Acepta reservas para grupos. Sin costo de cancelación.',
      rules: 'Delivery disponible. Menú infantil disponible.'
    },
    {
      id: '5',
      name: 'Sushi Zen',
      city: 'Quito',
      price: 40,
      rating: 4.9,
      photo: '/assets/restaurant5.jpg',
      cuisine: 'Japonesa',
      description: 'Sushi premium con pescado fresco diario. Ambiente zen y tranquilo perfecto para ocasiones especiales.',
      policies: 'Reserva obligatoria. Depósito del 50% para grupos mayores a 6.',
      rules: 'No niños menores de 12 años. Código de vestimenta: elegante.'
    },
    {
      id: '6',
      name: 'La Parrilla Argentina',
      city: 'Guayaquil',
      price: 45,
      rating: 4.5,
      photo: '/assets/restaurant6.jpg',
      cuisine: 'Argentina',
      description: 'Carnes a la parrilla estilo argentino. Cortes premium, chimichurri casero y vinos selectos.',
      policies: 'Reservas hasta agotar capacidad. Cancelación con 24h de anticipación.',
      rules: 'Ambiente familiar. Menú vegetariano disponible.'
    },
    {
      id: '7',
      name: 'Tacos & Tequila',
      city: 'Cuenca',
      price: 18,
      rating: 4.4,
      photo: '/assets/restaurant7.jpg',
      cuisine: 'Mexicana',
      description: 'Auténtica comida mexicana. Tacos al pastor, burritos, quesadillas y más de 50 tipos de tequila.',
      policies: 'Sin reserva necesaria. Walk-ins bienvenidos.',
      rules: 'Happy hour 5-7pm. Música en vivo viernes y sábados.'
    }
  ];

  // Filtrar por query si existe
  if (query) {
    const lowerQuery = query.toLowerCase();
    return mockData.filter(r => 
      r.name.toLowerCase().includes(lowerQuery) ||
      r.cuisine.toLowerCase().includes(lowerQuery) ||
      r.city.toLowerCase().includes(lowerQuery)
    );
  }

  return mockData;
}

export default {
  getRestaurants,
  getRestaurantById
};
