CREATE EXTENSION IF NOT EXISTS pgcrypto; -- para gen_random_uuid()

-- Usuarios
CREATE TABLE IF NOT EXISTS usuario (
  "idUsuario"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre"        TEXT NOT NULL,
  "apellido"      TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "telefono"      TEXT,
  "fechaRegistro" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "activo"        BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuario_activo ON usuario("activo");

-- Servicios
CREATE TABLE IF NOT EXISTS servicio (
  "idServicio"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "serviceType"      TEXT NOT NULL CHECK ("serviceType" IN ('hotel','car','flight','restaurant','package')),
  "nombre"           TEXT NOT NULL,
  "descripcion"      TEXT,
  "ciudad"           TEXT,
  "precio"           NUMERIC(12,2) NOT NULL,
  "currency"         TEXT NOT NULL,
  "rating"           NUMERIC(3,2),
  "amenities"        TEXT[],             -- string[]
  "clasificacion"    TEXT,
  "fotos"            TEXT[],             -- string[] (URLs)
  "politicas"        TEXT,
  "disponible"       BOOLEAN NOT NULL DEFAULT TRUE,
  "datosEspecificos" JSONB               -- Hotel | Car | Flight | Restaurant | Package
);

CREATE INDEX IF NOT EXISTS idx_servicio_type_ciudad ON servicio("serviceType","ciudad");
CREATE INDEX IF NOT EXISTS idx_servicio_disponible ON servicio("disponible");

-- Reservas
CREATE TABLE IF NOT EXISTS reserva (
  "idReserva"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idUsuario"    UUID NOT NULL REFERENCES usuario("idUsuario") ON DELETE RESTRICT,
  "fechaReserva" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "estado"       TEXT NOT NULL CHECK ("estado" IN ('PENDIENTE','CONFIRMADA','CANCELADA','COMPLETADA')),
  "totalPrice"   NUMERIC(12,2) NOT NULL,
  "currency"     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reserva_usuario_estado ON reserva("idUsuario","estado");

-- Detalles de reserva
CREATE TABLE IF NOT EXISTS detalle_reserva (
  "idDetalle"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idReserva"      UUID NOT NULL REFERENCES reserva("idReserva") ON DELETE CASCADE,
  "tipoServicio"   TEXT NOT NULL CHECK ("tipoServicio" IN ('hotel','car','flight','restaurant','package')),
  "idServicio"     UUID NOT NULL REFERENCES servicio("idServicio") ON DELETE RESTRICT,
  "cantidad"       INTEGER NOT NULL DEFAULT 1,
  "precioUnitario" NUMERIC(12,2) NOT NULL,
  "subtotal"       NUMERIC(12,2) NOT NULL,
  "fechaInicio"    DATE,
  "fechaFin"       DATE,
  "noches"         INTEGER,
  "dias"           INTEGER,
  "tramos"         INTEGER
);

CREATE INDEX IF NOT EXISTS idx_detalle_reserva_reserva ON detalle_reserva("idReserva");
CREATE INDEX IF NOT EXISTS idx_detalle_reserva_tipo ON detalle_reserva("tipoServicio");

-- Pagos
CREATE TABLE IF NOT EXISTS pago (
  "idPago"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idReserva"     UUID NOT NULL REFERENCES reserva("idReserva") ON DELETE CASCADE,
  "monto"         NUMERIC(12,2) NOT NULL,
  "currency"      TEXT NOT NULL,
  "metodoPago"    TEXT NOT NULL CHECK ("metodoPago" IN ('tarjeta','transferencia','efectivo','paypal')),
  "estado"        TEXT NOT NULL CHECK ("estado" IN ('PENDIENTE','AUTORIZADO','CAPTURADO','RECHAZADO','REEMBOLSADO')),
  "fechaPago"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "transaccionId" TEXT,
  "metadata"      JSONB
);

CREATE INDEX IF NOT EXISTS idx_pago_reserva_estado ON pago("idReserva","estado");
CREATE INDEX IF NOT EXISTS idx_pago_transaccion ON pago("transaccionId");

-- Pre-Reservas (bloqueos con expiración)
CREATE TABLE IF NOT EXISTS pre_reserva (
  "preBookingId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "itinerario"   JSONB NOT NULL,   -- array de DetalleReserva (snapshots)
  "cliente"      JSONB NOT NULL,   -- { nombre, email, telefono? }
  "holdMinutes"  INTEGER NOT NULL,
  "expiraEn"     TIMESTAMPTZ NOT NULL,
  "idemKey"      TEXT UNIQUE,      -- idempotencia
  "estado"       TEXT NOT NULL CHECK ("estado" IN ('BLOQUEADO','EXPIRADO','CONFIRMADO'))
);

CREATE INDEX IF NOT EXISTS idx_pre_reserva_estado ON pre_reserva("estado");
CREATE INDEX IF NOT EXISTS idx_pre_reserva_expira ON pre_reserva("expiraEn");
