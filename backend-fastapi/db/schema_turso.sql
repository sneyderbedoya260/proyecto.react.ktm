-- Esquema SQLite para Turso.
-- Ejecutar este archivo con: turso db shell NOMBRE_DE_TU_DB < schema_turso.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  numero_documento TEXT NOT NULL UNIQUE,
  direccion TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  reset_token TEXT,
  reset_token_expira TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  detalle TEXT NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT NOT NULL,
  precio NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Agotado', 'Inactivo')),
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO roles (nombre) VALUES ('Administrador'), ('Empleado'), ('Cliente');

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  usuario_operador_id INTEGER REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  descuento NUMERIC NOT NULL DEFAULT 0,
  impuestos NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Cotizado', 'Confirmado', 'Cancelado')),
  notas TEXT
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL UNIQUE REFERENCES ventas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  numero_factura TEXT NOT NULL UNIQUE,
  cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal NUMERIC NOT NULL,
  descuento NUMERIC NOT NULL DEFAULT 0,
  impuestos NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Emitida' CHECK (estado IN ('Emitida', 'Anulada'))
);

CREATE TABLE IF NOT EXISTS detalle_facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id INTEGER NOT NULL REFERENCES facturas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS pqr (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('Peticion', 'Queja', 'Reclamo')),
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En proceso', 'Respondida', 'Cerrada')),
  respuesta TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
  iniciado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TEXT NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Cerrada'))
);

CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversacion_id INTEGER NOT NULL REFERENCES conversaciones(id) ON UPDATE CASCADE ON DELETE CASCADE,
  emisor TEXT NOT NULL CHECK (emisor IN ('Usuario', 'Bot')),
  contenido TEXT NOT NULL,
  enviado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas (estado);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON detalle_ventas (producto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas (fecha);