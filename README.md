# UniBooking - Sistema de Reservas con ESB 🚀

Sistema completo de reservas (hoteles, vuelos, autos) con arquitectura MVC en el frontend y Enterprise Service Bus (ESB) para integración con servicios SOAP.

---

## 📋 Tabla de Contenidos

- [Quick Start](#-quick-start)
- [Arquitectura](#️-arquitectura)
- [Enterprise Service Bus](#-enterprise-service-bus)
- [Funcionalidades](#-funcionalidades)
- [Documentación](#-documentación)
- [Configuración](#️-configuración)
- [Tecnologías](#-tecnologías)

---

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Abrir en navegador
http://localhost:5173
```

---

## 🏗️ Arquitectura

### Frontend (MVC Pattern)

```
src/
├── controllers/    # Orquestan vista y servicios
├── views/         # Render de UI (DOM)
├── services/      # Lógica de negocio
├── components/    # UI reutilizable
└── core/          # Router, HTTP, utilidades
```

### Backend Integration (ESB)

```
esb/
├── models/          # Entidades y DTOs
├── dal/             # Data Access Layer
├── bll/             # Business Logic Layer
├── gateway/         # Adaptadores SOAP
├── orchestration/   # Orquestador
└── utils/           # SOAP utilities
```

**Flujo de Datos:**
```
Frontend → ESB Adapter → Orchestrator → [BLL, DAL, Gateway] → SOAP Services
```

---

## 🌐 Enterprise Service Bus

El proyecto incluye un **ESB completo** para integración con múltiples servicios SOAP.

### Características del ESB

✅ **Orquestación** - Coordina llamadas a múltiples servicios  
✅ **Caché** - Almacenamiento local de resultados  
✅ **Retry Logic** - Reintentos automáticos  
✅ **Fallback** - Datos mock si SOAP falla  
✅ **Logging** - Registro completo de operaciones  
✅ **TypeScript** - Tipado fuerte  

### Uso Básico

```typescript
import ESB from './esb';

// Buscar servicios
const servicios = await ESB.buscarServicios({
  serviceType: ['hotel', 'flight', 'car'],
  ciudad: 'Quito',
  fechaInicio: new Date('2025-12-01'),
  fechaFin: new Date('2025-12-05')
});

// Crear y confirmar reserva
const preReserva = await ESB.crearPreReserva(itinerario, cliente);
const reserva = await ESB.confirmarReserva(preReserva.preBookingId!);
```

### Configurar Endpoints SOAP

Edita `esb/utils/config.ts`:

```typescript
endpoints: {
  hotel: {
    url: 'http://hotel-service.com/soap',
    namespace: 'http://hotel.service',
    enabled: true
  },
  flight: {
    url: 'http://flight-service.com/soap',
    namespace: 'http://flight.service',
    enabled: true
  },
  car: {
    url: 'http://car-service.com/soap',
    namespace: 'http://car.service',
    enabled: true
  }
}
```

---

## ✨ Funcionalidades

### Frontend Features

- ✅ **Búsqueda** - Con filtros por tipo, precio, ciudad, rating
- ✅ **Resultados** - Cards dinámicas por tipo de servicio
- ✅ **Detalle** - Vista específica (hotel/auto/vuelo)
- ✅ **Carrito** - Agregar, incrementar, decrementar, eliminar
- ✅ **Notificaciones** - Toast messages
- ✅ **Navegación** - Router SPA

### ESB Features

- ✅ **Gestión de Usuarios** - CRUD completo
- ✅ **Gestión de Reservas** - Ciclo completo
- ✅ **Gestión de Pagos** - Procesamiento y reembolsos
- ✅ **Pre-Reservas** - Sistema de bloqueo temporal
- ✅ **Búsqueda Unificada** - En todos los servicios
- ✅ **Cotización** - Cálculo de precios con impuestos
- ✅ **Cancelaciones** - En todos los servicios

---

## 📖 Documentación

### 📚 Índice de Documentación

👉 **[DOCUMENTACION_INDEX.md](./DOCUMENTACION_INDEX.md)** - Índice completo

### Guías Disponibles

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[RESUMEN_ESB.md](./RESUMEN_ESB.md)** | Vista general del ESB | Todos |
| **[ARQUITECTURA_ESB.md](./ARQUITECTURA_ESB.md)** | Diagramas técnicos | Desarrolladores |
| **[GUIA_ESB.md](./GUIA_ESB.md)** | Manual de uso | Desarrolladores |
| **[CONFIGURACION_ESB.md](./CONFIGURACION_ESB.md)** | Setup SOAP | DevOps |
| **[esb/README.md](./esb/README.md)** | Referencia técnica | Desarrolladores |

### Ejemplos de Código

Ver `esb/examples.ts` para casos de uso completos:
- Búsqueda de servicios
- Flujo de reserva completo
- Gestión de usuarios
- Procesamiento de pagos
- Cancelaciones

---

## ⚙️ Configuración

### Variables de Entorno

Crea `.env` basado en `.env.example`:

```env
# Modo mock (desarrollo)
VITE_USE_MOCK=1

# URL del ESB SOAP
VITE_ESB_BASE_URL=http://localhost:8080/soap
```

### Scripts NPM

```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
```

### Modo de Desarrollo

**Con datos Mock (por defecto):**
```env
VITE_USE_MOCK=1
```

**Con ESB SOAP real:**
```env
VITE_USE_MOCK=0
```

---

## 📦 Tecnologías

### Frontend
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **Bootstrap 5** - Framework CSS
- **SASS** - Preprocesador CSS
- **Patrón MVC** - Arquitectura limpia

### ESB
- **TypeScript** - Tipado fuerte
- **Axios** - Cliente HTTP/SOAP
- **Arquitectura en Capas** - DAL, BLL, Gateway, Orchestration
- **SOAP/XML** - Integración empresarial
- **Patrón Repository** - Acceso a datos
- **Patrón Adapter** - Integración SOAP
- **Patrón Orchestrator** - Coordinación de servicios

---

## 🚀 Despliegue

### Build de Producción

```bash
npm run build
```

Genera carpeta `/dist` lista para:
- Netlify
- Vercel
- GitHub Pages
- Cualquier servidor estático

### Preview Local

```bash
npm run preview
```

Sirve el build en `http://localhost:4173`

---

## 📊 Estructura del Proyecto

```
booking-mvc/
├── src/                      # Frontend MVC
│   ├── controllers/          # Controladores
│   ├── views/               # Vistas
│   ├── services/            # Servicios
│   │   └── adapters/        # Mock y ESB
│   ├── components/          # Componentes UI
│   ├── core/               # Utilidades
│   └── styles/             # Estilos SASS
│
├── esb/                     # Enterprise Service Bus
│   ├── models/             # Entidades y DTOs
│   ├── dal/                # Data Access Layer
│   ├── bll/                # Business Logic Layer
│   ├── gateway/            # Adaptadores SOAP
│   ├── orchestration/      # Orquestador
│   └── utils/              # Utilidades SOAP
│
├── public/                  # Assets estáticos
├── index.html              # HTML principal
├── tsconfig.json           # Config TypeScript
├── vite.config.ts          # Config Vite
│
└── docs/                    # Documentación
    ├── RESUMEN_ESB.md
    ├── ARQUITECTURA_ESB.md
    ├── GUIA_ESB.md
    └── CONFIGURACION_ESB.md
```

---

## 🎯 Casos de Uso

### 1. Buscar Hoteles

```typescript
import ESB from './esb';

const hoteles = await ESB.buscarServicios({
  serviceType: ['hotel'],
  ciudad: 'Quito',
  fechaInicio: new Date('2025-12-01'),
  fechaFin: new Date('2025-12-05'),
  adults: 2,
  precioMax: 200
});
```

### 2. Crear Reserva

```typescript
// Pre-reserva
const preReserva = await ESB.crearPreReserva(
  itinerario,
  { nombre: 'Juan', email: 'juan@mail.com' },
  30 // minutos
);

// Confirmar
const reserva = await ESB.confirmarReserva(
  preReserva.preBookingId!,
  'tarjeta',
  { cardNumber: '****' }
);
```

### 3. Procesar Pago

```typescript
const pago = await ESB.pagos.crear({
  idReserva: reserva.idReserva!,
  monto: 500,
  currency: 'USD',
  metodoPago: 'tarjeta'
});

await ESB.pagos.capturar(pago);
```

---

## 🧪 Testing

### Prueba con Datos Mock

```bash
# Configurar modo mock
VITE_USE_MOCK=1

# Ejecutar
npm run dev
```

### Prueba con SOAP Real

1. Configurar endpoints en `esb/utils/config.ts`
2. Establecer `VITE_USE_MOCK=0`
3. Ejecutar `npm run dev`

---

## 🛠️ Troubleshooting

### El ESB no conecta con SOAP

1. Verificar URLs en `esb/utils/config.ts`
2. Revisar CORS en el servidor SOAP
3. Comprobar namespaces
4. Ver logs: `ESBLogger.getInstance().getLogs()`

### Error de compilación TypeScript

```bash
npm install
rm -rf node_modules
npm install
```

### Datos no se muestran

1. Revisar consola del navegador
2. Verificar modo mock: `VITE_USE_MOCK=1`
3. Ver network tab en DevTools

---

## 📞 Soporte

Para ayuda:

1. **Revisa la documentación** - `DOCUMENTACION_INDEX.md`
2. **Consulta ejemplos** - `esb/examples.ts`
3. **Ve los logs** - `ESBLogger.getInstance().getLogs()`
4. **Revisa errores** - Consola del navegador

---

## 🏆 Características Destacadas

✅ **Arquitectura Profesional** - MVC + ESB en capas  
✅ **TypeScript** - Tipado fuerte en todo el código  
✅ **SOAP Integration** - ESB completo para servicios externos  
✅ **Cache & Retry** - Optimización y resiliencia  
✅ **Logging** - Trazabilidad completa  
✅ **Documentación** - Exhaustiva y detallada  
✅ **Ejemplos** - Código listo para usar  
✅ **Escalable** - Fácil agregar nuevos servicios  

---

## 📄 Licencia

Este proyecto es parte de un trabajo académico.

---

## 👥 Contribuciones

Proyecto desarrollado para demostrar:
- Arquitectura MVC en frontend
- Patrón Enterprise Service Bus
- Integración SOAP
- Arquitectura en capas
- Código limpio y mantenible

---

## 🎓 Conceptos Aplicados

- ✅ **Patrón MVC** - Separación de responsabilidades
- ✅ **Patrón ESB** - Integración empresarial
- ✅ **Patrón Repository** - Acceso a datos
- ✅ **Patrón Adapter** - Integración externa
- ✅ **Patrón Orchestrator** - Coordinación de servicios
- ✅ **SOLID Principles** - Diseño orientado a objetos
- ✅ **Clean Architecture** - Capas desacopladas
- ✅ **TypeScript** - Programación tipada

---

**Proyecto**: UniBooking  
**Versión**: 2.0.0 (con ESB)  
**Fecha**: Octubre 2025  
**Tecnologías**: TypeScript, Vite, Bootstrap, SOAP, ESB  

---

### 🚀 ¡Comienza Ahora!

```bash
npm install
npm run dev
```

**Documentación completa**: [DOCUMENTACION_INDEX.md](./DOCUMENTACION_INDEX.md)

---

**¡Happy Coding! 💻✨**
