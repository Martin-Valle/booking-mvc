/**
 * Netlify Function - Car Search
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
    const { categoria, transmision, fechaInicio, fechaFin, edadConductor } = body;

    console.log(`[Netlify Function] Buscando carros en ${company}...`);

    let vehiculos: any[] = [];
    
    switch (company) {
      case 'easycar': {
        const { EasyCarSoapAdapter } = await import('../../esb/gateway/easy-car.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new EasyCarSoapAdapter(defaultConfig.endpoints.easyCar);
        vehiculos = await adapter.buscarServicios(categoria, transmision, fechaInicio, fechaFin, edadConductor);
        break;
      }
      
      case 'cuencacar': {
        const { CuencaCarAdapter } = await import('../../esb/gateway/cuenca-car.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new CuencaCarAdapter(defaultConfig.endpoints.cuencaCar);
        servicios = await adapter.buscarServicios('');
        break;
      }
      
      case 'rentcar': {
        const { RentCarAdapter } = await import('../../esb/gateway/rent-car.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new RentCarAdapter(defaultConfig.endpoints.rentCar);
        servicios = await adapter.buscarServicios('');
        break;
      }
      
      case 'backendcuenca': {
        const { BackendCuencaAdapter } = await import('../../esb/gateway/backend-cuenca.adapter');
        const { defaultConfig } = await import('../../esb/utils/config');
        const adapter = new BackendCuencaAdapter(defaultConfig.endpoints.backendCuenca);
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

    console.log(`[Netlify Function] ${vehiculos.length} vehículos encontrados`);

    // Transformar vehículos a formato estándar
    const cars = vehiculos.map((v: any) => ({
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cars)
    };

  } catch (error: any) {
    console.error('[Netlify Function] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error al buscar carros',
        message: error.message
      })
    };
  }
};

export { handler };
