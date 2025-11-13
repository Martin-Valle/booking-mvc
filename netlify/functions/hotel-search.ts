/**
 * Netlify Function - Hotel Search
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const company = event.queryStringParameters?.company;
    
    if (!company) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing company parameter' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { checkIn, checkOut, guests } = body;

    console.log(`[Netlify Function] Buscando hoteles en ${company}...`);

    let servicios: any[] = [];
    
    switch (company) {
      case 'km25madrid': {
        const { KM25MadridAdapter } = await import('../../esb/gateway/km25-madrid.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new KM25MadridAdapter(defaultConfig.endpoints.km25Madrid);
        servicios = await adapter.buscarServicios('');
        break;
      }
      
      case 'weworkhub': {
        const { WeWorkHubAdapter } = await import('../../esb/gateway/wework-hub.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new WeWorkHubAdapter(defaultConfig.endpoints.weWorkHub);
        servicios = await adapter.buscarServicios('');
        break;
      }
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Unknown company: ${company}` })
        };
    }

    console.log(`[Netlify Function] ${servicios.length} hoteles encontrados`);

    const hoteles = servicios.map(servicio => ({
      id: servicio.IdServicio,
      nombre: servicio.Nombre,
      ciudad: servicio.Ciudad,
      precio: parseFloat(servicio.Precio) || 0,
      descripcion: servicio.Descripcion,
      foto: servicio.ImagenURL,
      rating: 5
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(hoteles)
    };

  } catch (error: any) {
    console.error('[Netlify Function] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error al buscar hoteles',
        message: error.message
      })
    };
  }
};

export { handler };
