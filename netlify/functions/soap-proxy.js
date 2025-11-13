/**
 * Netlify Function - Proxy para servicios SOAP
 * Evita problemas de CORS al llamar servicios SOAP externos desde el navegador
 */

export async function handler(event, context) {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  // Habilitar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, SOAPAction',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'text/xml; charset=utf-8'
  };

  // Manejar preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('[Netlify Proxy] 📨 Recibiendo petición SOAP...');
    
    // URL del servicio Easy Car
    const soapUrl = 'http://easycar.runasp.net/IntegracionService.asmx';
    
    // Obtener el SOAPAction del header
    const soapAction = event.headers['soapaction'] || event.headers['SOAPAction'] || '';
    
    console.log('[Netlify Proxy] SOAPAction:', soapAction);
    console.log('[Netlify Proxy] Target URL:', soapUrl);

    // Hacer la petición SOAP al servicio externo
    const response = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction
      },
      body: event.body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('[Netlify Proxy] ✅ Respuesta recibida del servicio SOAP');

    return {
      statusCode: 200,
      headers,
      body: responseText
    };

  } catch (error) {
    console.error('[Netlify Proxy] ❌ Error:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Error en proxy SOAP',
        message: error.message 
      })
    };
  }
}
