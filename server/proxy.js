/**
 * Proxy Server para servicios SOAP
 * Permite que el frontend llame a servicios SOAP externos evitando problemas de CORS
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Habilitar CORS para todas las peticiones
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/xml' }));

/**
 * Endpoint proxy para Easy Car
 */
app.post('/api/proxy/easycar', async (req, res) => {
  try {
    console.log('[Proxy] 📨 Recibiendo petición para Easy Car...');
    console.log('[Proxy] Body:', req.body);

    const soapUrl = 'http://easycar.runasp.net/IntegracionService.asmx';
    
    const response = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': req.headers['soapaction'] || ''
      },
      body: req.body
    });

    const responseText = await response.text();
    console.log('[Proxy] ✅ Respuesta recibida del servicio SOAP');

    res.set('Content-Type', 'text/xml');
    res.send(responseText);

  } catch (error) {
    console.error('[Proxy] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error en proxy', 
      message: error.message 
    });
  }
});

/**
 * Endpoint proxy genérico para otros servicios SOAP
 */
app.post('/api/proxy/soap', async (req, res) => {
  try {
    const { url, soapAction, body } = req.body;

    console.log(`[Proxy] 📨 Petición SOAP a: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction || ''
      },
      body: body
    });

    const responseText = await response.text();
    console.log('[Proxy] ✅ Respuesta recibida');

    res.set('Content-Type', 'text/xml');
    res.send(responseText);

  } catch (error) {
    console.error('[Proxy] ❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Error en proxy', 
      message: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server running' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy Server corriendo en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   - POST /api/proxy/easycar (Easy Car SOAP)`);
  console.log(`   - POST /api/proxy/soap (SOAP genérico)`);
  console.log(`   - GET  /api/health (Health check)\n`);
});
