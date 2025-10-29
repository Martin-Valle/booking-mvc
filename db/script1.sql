-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- gen_random_uuid()
-- (Opcional) Si tienes permisos y prefieres CITEXT, puedes activarla.
-- CREATE EXTENSION IF NOT EXISTS citext;

-- =======================
--  USUARIOS
-- =======================
CREATE TABLE IF NOT EXISTS usuario (
  "idUsuario"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre"        TEXT NOT NULL,
  "apellido"      TEXT NOT NULL,
  "email"         TEXT NOT NULL,               -- si usas CITEXT, cámbialo a CITEXT
  "telefono"      TEXT,
  "fechaRegistro" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "activo"        BOOLEAN NOT NULL DEFAULT TRUE,
  "passHash"      TEXT NOT NULL,               -- bcrypt hash
  "role"          TEXT NOT NULL DEFAULT 'user' CHECK ("role" IN ('user','admin'))
);

-- Email único (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_email_lower ON usuario (lower(email));
CREATE INDEX IF NOT EXISTS idx_usuario_activo ON usuario("activo");

-- =======================
--  SERVICIOS
-- =======================
CREATE TABLE IF NOT EXISTS servicio (
  "idServicio"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "serviceType"      TEXT NOT NULL CHECK ("serviceType" IN ('hotel','car','flight','restaurant','package')),
  "nombre"           TEXT NOT NULL,
  "descripcion"      TEXT,
  "ciudad"           TEXT,
  "precio"           NUMERIC(12,2) NOT NULL,
  "currency"         TEXT NOT NULL DEFAULT 'USD',
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

-- =======================
--  RESERVAS
-- =======================
CREATE TABLE IF NOT EXISTS reserva (
  "idReserva"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idUsuario"    UUID NOT NULL REFERENCES usuario("idUsuario") ON DELETE RESTRICT,
  "fechaReserva" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "estado"       TEXT NOT NULL CHECK ("estado" IN ('PENDIENTE','CONFIRMADA','CANCELADA','COMPLETADA')),
  "totalPrice"   NUMERIC(12,2) NOT NULL,
  "currency"     TEXT NOT NULL DEFAULT 'USD'
);

CREATE INDEX IF NOT EXISTS idx_reserva_usuario_estado ON reserva("idUsuario","estado");

-- =======================
--  DETALLES DE RESERVA
-- =======================
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

-- =======================
--  PAGOS
-- =======================
CREATE TABLE IF NOT EXISTS pago (
  "idPago"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idReserva"     UUID NOT NULL REFERENCES reserva("idReserva") ON DELETE CASCADE,
  "monto"         NUMERIC(12,2) NOT NULL,
  "currency"      TEXT NOT NULL DEFAULT 'USD',
  "metodoPago"    TEXT NOT NULL CHECK ("metodoPago" IN ('tarjeta','transferencia','efectivo','paypal')),
  "estado"        TEXT NOT NULL CHECK ("estado" IN ('PENDIENTE','AUTORIZADO','CAPTURADO','RECHAZADO','REEMBOLSADO')),
  "fechaPago"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "transaccionId" TEXT,
  "metadata"      JSONB
);

CREATE INDEX IF NOT EXISTS idx_pago_reserva_estado ON pago("idReserva","estado");
CREATE INDEX IF NOT EXISTS idx_pago_transaccion ON pago("transaccionId");

-- =======================
--  PRE-RESERVAS
-- =======================
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

-- (Opcional) Semilla de admin: descomenta y cambia email/clave cuando quieras
-- INSERT INTO usuario ("nombre","apellido","email","telefono","activo","passHash","role")
-- VALUES ('Admin','Root','admin@tu-dominio.com',NULL,TRUE,'<hash-bcrypt>', 'admin')
-- ON CONFLICT DO NOTHING;
