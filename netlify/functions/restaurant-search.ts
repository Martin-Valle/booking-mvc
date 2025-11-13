/**
 * Netlify Function - Restaurant Search
 * Serverless endpoint que usa ESB para buscar mesas en restaurantes
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
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
    // Parsear el path para obtener el restaurante
    // Formato: /.netlify/functions/restaurant-search?company=saborandino
    const company = event.queryStringParameters?.company;
    
    if (!company) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing company parameter' })
      };
    }

    // Parsear body
    const body = JSON.parse(event.body || '{}');
    const { fecha, personas, hora } = body;

    console.log(`[Netlify Function] Buscando mesas en ${company}...`);

    // Importar dinámicamente el ESB
    let servicios: any[] = [];
    
    switch (company) {
      case 'saborandino': {
        const { SaborAndinoSoapAdapter } = await import('../../esb/gateway/sabor-andino.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new SaborAndinoSoapAdapter(defaultConfig.endpoints.saborAndino);
        servicios = await adapter.buscarServicios(''); // Filtros vacíos
        break;
      }
      
      case 'elcangrejofeliz': {
        const { ElCangrejoFelizSoapAdapter } = await import('../../esb/gateway/cangrejo-feliz.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new ElCangrejoFelizSoapAdapter(defaultConfig.endpoints.elCangrejoFeliz);
        servicios = await adapter.buscarServicios('');
        break;
      }
      
      case 'sanctumcortejo': {
        const { SanctumCortejoSoapAdapter } = await import('../../esb/gateway/sanctum-cortejo.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new SanctumCortejoSoapAdapter(defaultConfig.endpoints.sanctumCortejo);
        servicios = await adapter.buscarServicios('');
        break;
      }
      
      case 'sietemares': {
        const { SieteMaresAdapter } = await import('../../esb/gateway/siete-mares.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new SieteMaresAdapter(defaultConfig.endpoints.sieteMares);
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

    console.log(`[Netlify Function] ${servicios.length} servicios encontrados`);

    // Transformar servicios a formato de mesas
    const mesas = servicios.map(servicio => ({
      id: servicio.IdServicio,
      numero: servicio.IdServicio,
      nombre: servicio.Nombre,
      capacidad: personas || 2,
      precio: parseFloat(servicio.Precio) || 0,
      disponible: true,
      descripcion: servicio.Descripcion,
      foto: servicio.ImagenURL
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mesas)
    };

  } catch (error: any) {
    console.error('[Netlify Function] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error al buscar mesas',
        message: error.message
      })
    };
  }
};

export { handler };
