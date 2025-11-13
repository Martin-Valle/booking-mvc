# ⚙️ Configuración Inicial del ESB

## 📋 Checklist de Configuración

Sigue estos pasos para poner en marcha el ESB con los servicios SOAP de tus amigos.

---

## ✅ Paso 1: Verificar Instalación

El ESB ya está instalado y funcionando en modo mock. Verifica que tu proyecto compile:

```bash
npm run dev
```

Si todo funciona, deberías poder hacer búsquedas en tu aplicación (usarán datos mock por ahora).

---

## ✅ Paso 2: Obtener Información de los Servicios SOAP

Necesitas obtener de cada uno de tus amigos:

### Para el servicio de HOTELES:
- [ ] URL del endpoint SOAP (ej: `http://hotel-service.com/soap`)
- [ ] WSDL del servicio (archivo .wsdl o URL)
- [ ] Namespace del servicio
- [ ] Credenciales (usuario/contraseña si requiere autenticación)
- [ ] Métodos disponibles y sus parámetros

### Para el servicio de VUELOS:
- [ ] URL del endpoint SOAP
- [ ] WSDL del servicio
- [ ] Namespace del servicio
- [ ] Credenciales
- [ ] Métodos disponibles y sus parámetros

### Para el servicio de AUTOS:
- [ ] URL del endpoint SOAP
- [ ] WSDL del servicio
- [ ] Namespace del servicio
- [ ] Credenciales
- [ ] Métodos disponibles y sus parámetros

---

## ✅ Paso 3: Configurar Endpoints

Edita el archivo `esb/utils/config.ts`:

```typescript
export const defaultConfig: ESBConfig = {
  endpoints: {
    hotel: {
      // ⬇️ CAMBIAR ESTA URL
      url: 'http://TU-AMIGO-HOTEL.com:8080/HotelService',
      
      // ⬇️ VERIFICAR NAMESPACE EN EL WSDL
      namespace: 'http://hotel.service.com',
      
      timeout: 30000,
      enabled: true
    },
    flight: {
      // ⬇️ CAMBIAR ESTA URL
      url: 'http://TU-AMIGO-FLIGHT.com:8080/FlightService',
      
      // ⬇️ VERIFICAR NAMESPACE EN EL WSDL
      namespace: 'http://flight.service.com',
      
      timeout: 30000,
      enabled: true
    },
    car: {
      // ⬇️ CAMBIAR ESTA URL
      url: 'http://TU-AMIGO-CAR.com:8080/CarService',
      
      // ⬇️ VERIFICAR NAMESPACE EN EL WSDL
      namespace: 'http://car.service.com',
      
      timeout: 30000,
      enabled: true
    },
    restaurant: {
      url: 'http://localhost:8084/restaurant-service',
      namespace: 'http://booking.esb/restaurant',
      timeout: 30000,
      enabled: false  // ⬅️ Deshabilitado hasta implementar
    },
    package: {
      url: 'http://localhost:8085/package-service',
      namespace: 'http://booking.esb/package',
      timeout: 30000,
      enabled: false  // ⬅️ Deshabilitado hasta implementar
    }
  }
};
```

---

## ✅ Paso 4: Ajustar Adaptadores SOAP

Los adaptadores necesitan conocer los nombres exactos de los métodos SOAP y sus parámetros.

### 4.1 Analizar el WSDL

Abre el WSDL del servicio de hoteles y busca:

```xml
<wsdl:operation name="buscarHoteles">
  <wsdl:input message="tns:BuscarHotelesRequest"/>
  <wsdl:output message="tns:BuscarHotelesResponse"/>
</wsdl:operation>
```

### 4.2 Actualizar el adaptador

Edita `esb/gateway/hotel.adapter.ts` si los nombres de métodos difieren:

```typescript
// Si tu amigo usa "searchHotels" en lugar de "buscarServicios"
const envelope = createSoapEnvelope(
  getESBConfig().endpoints.hotel.namespace,
  'searchHotels',  // ⬅️ Cambia este nombre
  body
);
```

### 4.3 Ajustar el body del SOAP

```typescript
// Verifica que los nombres de parámetros coincidan con el WSDL
const body = `
  <city>${escapeXml(filtros.ciudad || '')}</city>
  <checkInDate>${dateToXmlString(filtros.fechaInicio)}</checkInDate>
  <checkOutDate>${dateToXmlString(filtros.fechaFin)}</checkOutDate>
  <adults>${filtros.adults || 1}</adults>
  <children>${filtros.children || 0}</children>
`;
```

**Repite este proceso para `flight.adapter.ts` y `car.adapter.ts`.**

---

## ✅ Paso 5: Parsear las Respuestas SOAP

Cada servicio SOAP retorna XML con estructura diferente. Necesitas ajustar los parsers.

### 5.1 Obtener una respuesta de ejemplo

Haz una llamada de prueba y guarda la respuesta XML:

```xml
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <BuscarHotelesResponse>
      <hoteles>
        <hotel>
          <id>H001</id>
          <nombre>Hotel Quito</nombre>
          <ciudad>Quito</ciudad>
          <precio>150.00</precio>
          <!-- ... más campos ... -->
        </hotel>
      </hoteles>
    </BuscarHotelesResponse>
  </soap:Body>
</soap:Envelope>
```

### 5.2 Ajustar el parser

En `hotel.adapter.ts`, método `parseHotelesResponse`:

```typescript
private parseHotelesResponse(doc: Document): Servicio[] {
  const servicios: Servicio[] = [];
  
  // ⬇️ Cambia 'hotel' por el nombre del tag en tu XML
  const hotelNodes = doc.getElementsByTagName('hotel');

  for (let i = 0; i < hotelNodes.length; i++) {
    const hotelNode = hotelNodes[i];
    
    const hotel: Hotel = {
      // ⬇️ Verifica que estos nombres coincidan con el XML
      hotelId: this.getNodeValue(hotelNode, 'id'),
      nombre: this.getNodeValue(hotelNode, 'nombre'),
      ciudad: this.getNodeValue(hotelNode, 'ciudad'),
      // ... resto de campos
    };
    
    // ... crear servicio
  }
  
  return servicios;
}
```

---

## ✅ Paso 6: Probar Conexión

### 6.1 Crear script de prueba

Crea `esb/test-connection.ts`:

```typescript
import { hotelSoapAdapter } from './gateway/hotel.adapter';

async function testHotelConnection() {
  try {
    console.log('🔍 Probando conexión con servicio de hoteles...');
    
    const hoteles = await hotelSoapAdapter.buscarHoteles({
      ciudad: 'Quito',
      fechaInicio: new Date('2025-12-01'),
      fechaFin: new Date('2025-12-05'),
      adults: 2,
      children: 0
    });
    
    console.log('✅ Conexión exitosa!');
    console.log(`📊 Encontrados ${hoteles.length} hoteles`);
    console.log(hoteles);
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

testHotelConnection();
```

### 6.2 Ejecutar prueba

```bash
npx tsx esb/test-connection.ts
```

---

## ✅ Paso 7: Configurar CORS (si es necesario)

Si los servicios SOAP están en otro dominio, necesitas configurar CORS.

### Opción A: Configurar en el servidor SOAP (recomendado)

Pide a tus amigos que agreguen estos headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, SOAPAction
```

### Opción B: Usar proxy en desarrollo

En `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/hotel-api': {
        target: 'http://hotel-service.com:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hotel-api/, '')
      }
    }
  }
});
```

Luego actualiza la URL en config:

```typescript
url: '/hotel-api/HotelService'  // En lugar de la URL completa
```

---

## ✅ Paso 8: Manejo de Autenticación

Si los servicios SOAP requieren autenticación:

### WS-Security Username Token

Edita `esb/gateway/soap-client.ts`:

```typescript
async call(soapEnvelope: string, soapAction?: string): Promise<Document> {
  // Agregar header de autenticación
  const envelopeWithAuth = this.addWSSecurity(soapEnvelope, 'username', 'password');
  
  // ... resto del código
}

private addWSSecurity(envelope: string, username: string, password: string): string {
  const securityHeader = `
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  `;
  
  // Insertar en el header del envelope
  return envelope.replace('<soapenv:Header/>', `<soapenv:Header>${securityHeader}</soapenv:Header>`);
}
```

---

## ✅ Paso 9: Habilitar Logging Detallado

Para debugging, habilita logs detallados en `esb/utils/config.ts`:

```typescript
logging: {
  enabled: true,
  level: 'DEBUG'  // ⬅️ Muestra todo
}
```

Ver logs:

```typescript
import { ESBLogger } from './esb';

const logger = ESBLogger.getInstance();
console.log(logger.getLogs());
```

---

## ✅ Paso 10: Conectar Base de Datos (Opcional)

Por defecto, los repositorios usan almacenamiento in-memory. Para persistencia:

### 10.1 Instalar driver de BD

```bash
npm install pg  # PostgreSQL
# o
npm install mongodb  # MongoDB
```

### 10.2 Actualizar repositorio

Ejemplo con PostgreSQL en `usuario.repository.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'booking',
  user: 'user',
  password: 'password'
});

export class UsuarioRepository {
  async findAll(): Promise<Usuario[]> {
    const result = await pool.query('SELECT * FROM usuarios');
    return result.rows;
  }
  
  // ... más métodos
}
```

---

## 🎯 Checklist Final

Antes de ir a producción, verifica:

- [ ] URLs de endpoints configuradas
- [ ] Namespaces correctos
- [ ] Métodos SOAP mapeados
- [ ] Parsers ajustados al XML real
- [ ] Conexión probada con cada servicio
- [ ] CORS configurado (si aplica)
- [ ] Autenticación implementada (si aplica)
- [ ] Logging habilitado
- [ ] Manejo de errores probado
- [ ] Timeouts configurados
- [ ] Base de datos conectada (opcional)

---

## 📞 Troubleshooting

### Error: "Cannot find module 'axios'"

```bash
npm install axios
```

### Error: "SOAP Fault: ..."

Revisa el namespace y nombres de métodos en el WSDL.

### Error: "Network Error"

Verifica CORS y que el servicio esté accesible.

### Error: "Timeout"

Aumenta el timeout en `config.ts`:

```typescript
timeout: 60000  // 60 segundos
```

### Los datos no se parsean bien

Revisa la estructura del XML en `parseHotelesResponse()`.

---

## 🚀 ¡Listo!

Una vez completados todos los pasos, tu ESB estará conectado a los servicios SOAP reales.

Para probarlo:

1. Abre tu aplicación: `npm run dev`
2. Haz una búsqueda
3. Revisa la consola del navegador
4. Verifica que muestre datos reales (no mock)

---

**¿Necesitas ayuda?** Revisa:
- `GUIA_ESB.md` - Guía de uso
- `ARQUITECTURA_ESB.md` - Diagramas
- `esb/README.md` - Documentación técnica
