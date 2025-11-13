# 🚀 Guía de Uso del ESB - Enterprise Service Bus

## ✅ El ESB está listo y completamente integrado!

Has creado exitosamente un **Enterprise Service Bus (ESB)** completo con arquitectura en capas para tu sistema de booking.

## 📂 Lo que se ha creado

### 1. **Estructura de Carpetas ESB**
```
esb/
├── models/              ✅ Entidades y DTOs
├── dal/                 ✅ Capa de Acceso a Datos
├── bll/                 ✅ Capa de Lógica de Negocio
├── gateway/             ✅ Adaptadores SOAP
├── orchestration/       ✅ Orquestador Principal
├── utils/               ✅ Utilidades SOAP
└── examples.ts          ✅ Ejemplos de uso
```

### 2. **Integración con el Frontend**
El archivo `src/services/adapters/esb.adapter.ts` ya está actualizado para usar el nuevo ESB.

## 🎯 Próximos Pasos

### Paso 1: Configurar los Endpoints de tus amigos

Edita `esb/utils/config.ts` con las URLs reales de los servicios SOAP:

```typescript
export const defaultConfig: ESBConfig = {
  endpoints: {
    hotel: {
      url: 'http://tu-amigo-hotel.com/soap',  // ← Cambiar aquí
      namespace: 'http://booking.esb/hotel',
      timeout: 30000,
      enabled: true
    },
    flight: {
      url: 'http://tu-amigo-flight.com/soap', // ← Cambiar aquí
      namespace: 'http://booking.esb/flight',
      timeout: 30000,
      enabled: true
    },
    car: {
      url: 'http://tu-amigo-car.com/soap',    // ← Cambiar aquí
      namespace: 'http://booking.esb/car',
      timeout: 30000,
      enabled: true
    }
  }
};
```

### Paso 2: Probar el ESB

Ejecuta los ejemplos para verificar que todo funciona:

```typescript
// En la consola del navegador o Node.js
import { buscarServiciosEjemplo, flujoReservaCompleto } from './esb/examples';

// Prueba de búsqueda
await buscarServiciosEjemplo();

// Prueba de flujo completo
await flujoReservaCompleto();
```

### Paso 3: Usar desde tu aplicación

Tu aplicación ya está usando el ESB automáticamente. Cuando hagas búsquedas desde el frontend, usará:

```typescript
// En src/services/search.service.ts
import { esbSearch } from './adapters/esb.adapter';

// Esta función ahora usa el ESB en lugar de mock data
const resultados = await esbSearch(query, filters);
```

## 📊 Arquitectura Implementada

```
┌──────────────────────────────────────────┐
│   FRONTEND (booking-mvc/src)            │
│   ├── Controllers                        │
│   ├── Views                              │
│   └── Services                           │
│       └── adapters/                      │
│           └── esb.adapter.ts  ← integrado│
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   ESB (booking-mvc/esb)                  │
│   ┌────────────────────────────────┐    │
│   │  ORCHESTRATION                 │    │
│   │  Coordina servicios SOAP       │    │
│   └────────────────────────────────┘    │
│               │                          │
│     ┌─────────┼─────────┐               │
│     ▼         ▼         ▼               │
│   ┌────┐  ┌────┐  ┌────────┐           │
│   │BLL │  │DAL │  │Gateway │           │
│   └────┘  └────┘  └────┬───┘           │
└────────────────────────┼────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │ Hotel  │      │ Flight │      │  Car   │
    │ SOAP   │      │ SOAP   │      │ SOAP   │
    │Service │      │Service │      │Service │
    └────────┘      └────────┘      └────────┘
    (Amigo 1)       (Amigo 2)       (Amigo 3)
```

## 🔧 APIs Implementadas

### Gestión Interna (CRUD Local)

✅ **Usuarios**
- `obtenerUsuarios()`
- `obtenerUsuarioPorId(id)`
- `crearUsuario(usuario)`
- `actualizarUsuario(id, usuario)`
- `eliminarUsuario(id)`

✅ **Reservas**
- `obtenerReservas()`
- `crearReserva(reserva)`
- `actualizarReserva(id, reserva)`
- `cancelarReserva(id)`
- `confirmarReserva(id)`

✅ **Pagos**
- `obtenerPagos()`
- `crearPago(pago)`
- `capturarPago(id)`
- `reembolsarPago(id)`

### Integración Externa (SOAP)

✅ **Búsqueda Unificada**
- `buscarServicios(filtros)` → Busca en todos los servicios SOAP

✅ **Pre-Reservas**
- `crearPreReserva(itinerario, cliente)` → Bloquea temporalmente
- `confirmarReserva(preBookingId, pago)` → Confirma reserva

✅ **Verificación**
- `verificarDisponibilidad(sku, fechas)` → Chequea disponibilidad
- `cotizarReserva(items)` → Calcula precio total

✅ **Cancelación**
- `cancelarReservaIntegracion(bookingId, motivo)` → Cancela en todos los servicios

## 🧪 Modo de Prueba

Actualmente, el ESB funciona en **modo simulado**:
- Si los endpoints SOAP no están disponibles → usa datos mock
- Los repositorios son in-memory → los datos no persisten
- El procesamiento de pagos es simulado → siempre aprueba

### Para modo producción:

1. **Configura endpoints reales** en `esb/utils/config.ts`
2. **Conecta una base de datos** en los repositorios DAL
3. **Integra un gateway de pagos real** (Stripe, PayPal, etc.)

## 📝 Ejemplo de Uso Completo

```typescript
import ESB from './esb';

async function reservarHotel() {
  // 1. Buscar hoteles
  const hoteles = await ESB.buscarServicios({
    serviceType: ['hotel'],
    ciudad: 'Quito',
    fechaInicio: new Date('2025-12-01'),
    fechaFin: new Date('2025-12-05'),
    adults: 2,
    precioMax: 200
  });

  // 2. Seleccionar hotel
  const hotel = hoteles[0];

  // 3. Crear itinerario
  const itinerario = [{
    idReserva: '',
    tipoServicio: 'hotel',
    idServicio: hotel.idServicio!,
    cantidad: 1,
    precioUnitario: hotel.precio,
    subtotal: hotel.precio * 4, // 4 noches
    noches: 4
  }];

  // 4. Cotizar
  const cotizacion = await ESB.cotizarReserva(itinerario);
  console.log('Total:', cotizacion.total);

  // 5. Pre-reservar
  const preReserva = await ESB.crearPreReserva(
    itinerario,
    { nombre: 'Juan', email: 'juan@mail.com' },
    30 // minutos
  );

  // 6. Confirmar con pago
  const reserva = await ESB.confirmarReserva(
    preReserva.preBookingId!,
    'tarjeta',
    { cardNumber: '****' }
  );

  console.log('✅ Reserva confirmada:', reserva.idReserva);
  return reserva;
}
```

## 🎨 Características Destacadas

✅ **Orquestación Inteligente** - Llamadas paralelas a múltiples servicios  
✅ **Caché Local** - Reduce llamadas SOAP repetidas  
✅ **Retry Logic** - Reintentos automáticos en fallos  
✅ **Fallback** - Usa mock si SOAP falla  
✅ **Idempotencia** - Previene duplicados  
✅ **Logging** - Registro completo de operaciones  
✅ **TypeScript** - Tipado fuerte en toda la arquitectura  

## 📖 Documentación

- **README del ESB**: `esb/README.md` - Documentación completa
- **Ejemplos**: `esb/examples.ts` - Casos de uso
- **Configuración**: `esb/utils/config.ts` - Endpoints
- **Modelos**: `esb/models/` - Entidades y DTOs

## 🚀 Ejecución

El ESB se ejecuta automáticamente cuando usas tu aplicación booking-mvc:

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

## ❓ Preguntas Frecuentes

**Q: ¿Cómo conecto con los servicios SOAP reales?**  
A: Edita `esb/utils/config.ts` con las URLs de tus amigos.

**Q: ¿Los datos se guardan permanentemente?**  
A: No, actualmente es in-memory. Para persistencia, conecta una base de datos en los repositorios.

**Q: ¿Puedo agregar más servicios (Restaurant, Package)?**  
A: Sí! Sigue el patrón de los adaptadores existentes (hotel, flight, car).

**Q: ¿Cómo pruebo sin servicios SOAP?**  
A: El ESB usa fallback a mock data automáticamente.

---

## 🎉 ¡Listo para usar!

Tu ESB está completamente funcional. Cuando tengas los endpoints SOAP de tus amigos, solo actualiza la configuración y todo funcionará automáticamente.

**Creado con ❤️ para el proyecto Booking MVC**
