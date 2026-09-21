-- =========================================================================
-- QUINTO AVANCE — Ampliación del modelo relacional (REQ-04 a REQ-13, REQ-21, REQ-22)
-- Ejecutar sobre la base de datos ya existente `ktm_motos`.
-- Las tablas `roles`, `usuarios` y `productos` NO se modifican: se reutilizan.
--
-- NOTA IMPORTANTE SOBRE EL DOMINIO DEL PROYECTO:
-- Este catálogo NO vende ni procesa pagos reales. El concepto "venta" del
-- checklist se implementa aquí como una SOLICITUD DE INTERÉS / COTIZACIÓN
-- que un cliente genera sobre uno o varios modelos. Se modela con las
-- mismas entidades y relaciones que pide el requerimiento (ventas,
-- detalle_ventas, facturas, detalle_facturas) para que el flujo de
-- reportes y facturación tenga datos reales que procesar, sin simular
-- una pasarela de pagos que no existe en el negocio real del proyecto.
-- =========================================================================

USE ktm_motos;

-- -------------------------------------------------------------------------
-- Ampliar el estado de productos: el formulario de admin ya maneja
-- Disponible / Agotado / Inactivo, pero la BD original solo tenía
-- Activo / Inactivo. Se migra en dos pasos para no perder datos:
-- 1) se amplía el ENUM dejando también el valor viejo,
-- 2) se migran los datos,
-- 3) se deja el ENUM final ya sin el valor viejo.
-- -------------------------------------------------------------------------
ALTER TABLE productos
  MODIFY COLUMN estado ENUM('Activo', 'Disponible', 'Agotado', 'Inactivo') NOT NULL DEFAULT 'Disponible';

UPDATE productos SET estado = 'Disponible' WHERE estado = 'Activo';

ALTER TABLE productos
  MODIFY COLUMN estado ENUM('Disponible', 'Agotado', 'Inactivo') NOT NULL DEFAULT 'Disponible';

-- -------------------------------------------------------------------------
-- VENTAS  (= solicitudes de interés / cotización de un cliente)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  usuario_operador_id INT UNSIGNED NULL,
  fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado ENUM('Pendiente', 'Cotizado', 'Confirmado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
  notas VARCHAR(255) NULL,
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_operador FOREIGN KEY (usuario_operador_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- -------------------------------------------------------------------------
-- DETALLE_VENTAS  (relación N:N venta <-> producto con cantidades/precios)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_detalle_ventas_venta FOREIGN KEY (venta_id) REFERENCES ventas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_ventas_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- -------------------------------------------------------------------------
-- FACTURAS  (comprobante generado a partir de una venta/cotización)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL UNIQUE,
  numero_factura VARCHAR(30) NOT NULL UNIQUE,
  cliente_id INT UNSIGNED NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(12, 2) NOT NULL,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  estado ENUM('Emitida', 'Anulada') NOT NULL DEFAULT 'Emitida',
  CONSTRAINT fk_facturas_venta FOREIGN KEY (venta_id) REFERENCES ventas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_facturas_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- -------------------------------------------------------------------------
-- DETALLE_FACTURAS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_facturas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  factura_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_detalle_facturas_factura FOREIGN KEY (factura_id) REFERENCES facturas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_facturas_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- -------------------------------------------------------------------------
-- PQR  (Peticiones, Quejas y Reclamos) — base para la Fase 3 (REQ-16)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pqr (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  tipo ENUM('Peticion', 'Queja', 'Reclamo') NOT NULL,
  asunto VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  estado ENUM('Pendiente', 'En proceso', 'Respondida', 'Cerrada') NOT NULL DEFAULT 'Pendiente',
  respuesta TEXT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pqr_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- -------------------------------------------------------------------------
-- Índices de apoyo para los filtros de reportes y dashboards (REQ-04, REQ-13)
CREATE INDEX idx_ventas_fecha ON ventas (fecha_hora);
CREATE INDEX idx_ventas_estado ON ventas (estado);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas (producto_id);
CREATE INDEX idx_facturas_fecha ON facturas (fecha);
