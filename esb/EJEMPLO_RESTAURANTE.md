# 🍽️ Guía de Uso - Servicio de Restaurante

## Información del Servicio

- **Endpoint**: `http://sanctumcortejo.runasp.net/Ws_IntegracionRestaurante.asmx`
- **Namespace**: `http://sanctumcortejo.ec/Integracion`
- **Proveedor**: Sanctum Cortejo (Ecuador)
- **Estado**: ✅ Operacional (con excepción de buscarServicios que tiene error de BD)

## Operaciones Disponibles

### ✅ 1. Cotizar Reserva
Calcula el precio total incluyendo impuestos y fees.

```typescript
import { ESB } from './esb';

const items = [
  {
    Nombre: 'Menú Ejecutivo',
    Cantidad: 2,
    PrecioUnitario: 12.50,
    PrecioTotal: 25.00
  },
  {
    Nombre: 'Bebida',
    Cantidad: 2,
    PrecioUnitario: 3.00,
    PrecioTotal: 6.00
  }
];

const cotizacion = await ESB.restaurante.cotizar(items);
console.log('Total:', cotizacion.Total); // 37.51 (incluye impuestos)
console.log('Desglose:', cotizacion.Breakdown);
```

**Resultado:**
```json
{
  "Total": 37.51,
  "Breakdown": [
    { "Nombre": "Menú Ejecutivo", "Cantidad": 2, "PrecioUnitario": 12.5, "PrecioTotal": 25 },
    { "Nombre": "Bebida", "Cantidad": 2, "PrecioUnitario": 3, "PrecioTotal": 6 }
  ]
}
```

### ✅ 2. Crear Pre-Reserva
Bloquea disponibilidad temporalmente (hold).

```typescript
import { ESB } from './esb';

const preReserva = await ESB.restaurante.crearPreReserva({
  itinerario: JSON.stringify({
    fecha: new Date().toISOString(),
    personas: 4,
    hora: '19:00'
  }),
  cliente: JSON.stringify({
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '0987654321'
  }),
  holdMinutes: 15,
  idemKey: `BOOKING-${Date.now()}`
});

console.log('Pre-Reserva ID:', preReserva.PreBookingId);
console.log('Expira en:', preReserva.ExpiraEn);
```

**Resultado:**
```json
{
  "PreBookingId": "ede88e27-16cf-4017-a3ef-e8faf9143e3b",
  "ExpiraEn": "2025-10-25T21:23:11.7473489+02:00"
}
```

### ✅ 3. Confirmar Reserva
Convierte la pre-reserva en reserva confirmada.

```typescript
import { ESB } from './esb';

const reserva = await ESB.restaurante.confirmarReserva({
  preBookingId: 'ede88e27-16cf-4017-a3ef-e8faf9143e3b',
  metodoPago: 'TARJETA_CREDITO',
  datosPago: JSON.stringify({
    numeroTarjeta: '**** **** **** 1234',
    titular: 'Juan Pérez',
    cvv: '***'
  })
});

console.log('Booking ID:', reserva.BookingId);
console.log('Estado:', reserva.Estado);
```

**Resultado:**
```json
{
  "BookingId": "9758",
  "Estado": "CONFIRMADA"
}
```

### ✅ 4. Cancelar Reserva
Cancela una reserva confirmada aplicando reglas tarifarias.

```typescript
import { ESB } from './esb';

const resultado = await ESB.restaurante.cancelar({
  bookingId: '9758',
  motivo: 'Cliente solicitó cancelación'
});

console.log('Cancelación exitosa:', resultado.Cancelacion);
```

**Resultado:**
```json
{
  "Cancelacion": true
}
```

### ✅ 5. Verificar Disponibilidad
Valida cupo/stock por fechas.

```typescript
import { ESB } from './esb';

const disponibilidad = await ESB.restaurante.verificarDisponibilidad({
  sku: 123,
  inicio: '2025-10-26T19:00:00',
  fin: '2025-10-26T21:00:00',
  unidades: 2
});

console.log('Disponible:', disponibilidad.Disponible);
console.log('Mensaje:', disponibilidad.Mensaje);
```

### ⚠️ 6. Buscar Servicios
**NOTA**: Esta operación actualmente tiene un error de base de datos en el servidor.

```typescript
import { ESB } from './esb';

try {
  const servicios = await ESB.restaurante.buscarServicios('ecuatoriano');
  console.log('Servicios encontrados:', servicios);
} catch (error) {
  console.error('Error:', error);
  // Error: Login failed for user 'db3047'
}
```

### ✅ 7. Obtener Detalle de Servicio
Obtiene información completa de un servicio específico.

```typescript
import { ESB } from './esb';

const detalle = await ESB.restaurante.obtenerDetalle(123);

console.log('Nombre:', detalle.Nombre);
console.log('Descripción:', detalle.Descripcion);
console.log('Políticas:', detalle.Politicas);
console.log('Reglas:', detalle.Reglas);
console.log('Precio:', detalle.Precio);
console.log('Ciudad:', detalle.Ciudad);
```

## Flujo Completo de Reserva

```typescript
import { ESB } from './esb';

async function reservarRestaurante() {
  try {
    // 1. Cotizar la reserva
    const cotizacion = await ESB.restaurante.cotizar([
      { Nombre: 'Mesa para 4', Cantidad: 1, PrecioUnitario: 50, PrecioTotal: 50 }
    ]);
    console.log('💰 Total a pagar:', cotizacion.Total);
    
    // 2. Crear pre-reserva (hold por 15 minutos)
    const preReserva = await ESB.restaurante.crearPreReserva({
      itinerario: JSON.stringify({ fecha: '2025-10-26', hora: '20:00', personas: 4 }),
      cliente: JSON.stringify({ nombre: 'María García', email: 'maria@email.com' }),
      holdMinutes: 15,
      idemKey: `RES-${Date.now()}`
    });
    console.log('⏳ Pre-reserva creada:', preReserva.PreBookingId);
    
    // 3. Usuario completa el pago...
    
    // 4. Confirmar reserva
    const reserva = await ESB.restaurante.confirmarReserva({
      preBookingId: preReserva.PreBookingId,
      metodoPago: 'TARJETA_CREDITO',
      datosPago: JSON.stringify({ /* datos de pago */ })
    });
    console.log('✅ Reserva confirmada:', reserva.BookingId);
    
    return reserva;
    
  } catch (error) {
    console.error('❌ Error en el proceso de reserva:', error);
    throw error;
  }
}
```

## Integración con el Frontend

### En un Controller (MVC)

```typescript
// src/controllers/RestaurantController.ts
import { ESB } from '../esb';

export class RestaurantController {
  async cotizarReserva(items: ItemDetalle[]) {
    try {
      const cotizacion = await ESB.restaurante.cotizar(items);
      return cotizacion;
    } catch (error) {
      console.error('Error al cotizar:', error);
      throw error;
    }
  }
  
  async crearReserva(datos: any) {
    // 1. Crear pre-reserva
    const preReserva = await ESB.restaurante.crearPreReserva({
      itinerario: JSON.stringify(datos.itinerario),
      cliente: JSON.stringify(datos.cliente),
      holdMinutes: 15,
      idemKey: datos.idemKey
    });
    
    // 2. Confirmar con pago
    const reserva = await ESB.restaurante.confirmarReserva({
      preBookingId: preReserva.PreBookingId,
      metodoPago: datos.metodoPago,
      datosPago: JSON.stringify(datos.datosPago)
    });
    
    return reserva;
  }
}
```

## Manejo de Errores

```typescript
import { ESB } from './esb';

try {
  const resultado = await ESB.restaurante.cotizar(items);
  // Éxito
} catch (error: any) {
  if (error.message.includes('500')) {
    // Error del servidor
    console.error('El servicio de restaurante no está disponible');
  } else if (error.message.includes('timeout')) {
    // Timeout
    console.error('La solicitud tardó demasiado');
  } else {
    // Otro error
    console.error('Error inesperado:', error.message);
  }
}
```

## Notas Importantes

1. ⚠️ **buscarServicios** actualmente falla con error de BD del servidor
2. ✅ Las otras 6 operaciones funcionan correctamente
3. 🔄 Las pre-reservas expiran después del tiempo especificado (holdMinutes)
4. 💳 Los datos de pago deben enviarse como JSON string
5. 🔑 Usa idemKey único para evitar duplicados

## Pruebas

Ejecuta el script de pruebas completo:

```bash
npx tsx esb/test-restaurant.ts
```

Este script prueba todas las operaciones del servicio de restaurante con datos reales.
