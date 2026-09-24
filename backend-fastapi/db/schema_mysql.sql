-- =========================================================================
-- KTM Catálogo — Modelo relacional para MySQL / MariaDB (phpMyAdmin)
-- =========================================================================
-- Archivo autocontenido: crea la base `ktm_motos` desde cero, con todas las
-- tablas, sus claves foráneas y datos de ejemplo. Pensado para importarse en
-- phpMyAdmin (XAMPP) y mostrar el diagrama de relaciones en la pestaña
-- "Diseñador".
--
-- El sitio es un CATÁLOGO DE CONSULTA (no una tienda), así que el modelo no
-- incluye ventas ni facturación: cubre el catálogo de productos, los usuarios
-- y roles, las PQR y el chatbot.
--
-- Motor: InnoDB en todas las tablas. Es lo que hace que las claves foráneas
-- se apliquen de verdad y que phpMyAdmin dibuje las relaciones solo.
--
-- Normalización (hasta 3FN):
--   * roles, tipos_documento y categorias son tablas de catálogo (lookup):
--     sacan a tablas propias los valores que antes se repetían como texto,
--     evitando anomalías de inserción/actualización y datos inconsistentes.
--   * Cada tabla tiene clave primaria propia; los atributos no clave dependen
--     solo de la clave (sin dependencias transitivas).
--   * Una conversación del chatbot tiene muchos mensajes (relación 1:N).
-- =========================================================================

CREATE DATABASE IF NOT EXISTS ktm_motos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ktm_motos;

-- Borrado en orden seguro para poder reimportar sin errores de dependencias.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS conversaciones;
DROP TABLE IF EXISTS pqr;
DROP TABLE IF EXISTS intentos_acceso;
DROP TABLE IF EXISTS imagenes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS tipos_documento;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- TABLAS DE CATÁLOGO (lookup) — valores fijos que antes se repetían como texto
-- =========================================================================

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE tipos_documento (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,      -- CC, CE, TI, PP...
  nombre VARCHAR(60) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE categorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =========================================================================
-- USUARIOS  (rol_id -> roles, tipo_documento_id -> tipos_documento)
-- =========================================================================
CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80) NOT NULL,
  tipo_documento_id INT UNSIGNED NOT NULL,
  numero_documento VARCHAR(12) NOT NULL UNIQUE,
  direccion VARCHAR(180) NOT NULL,
  telefono VARCHAR(10) NOT NULL,
  correo VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  rol_id INT UNSIGNED NOT NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expira DATETIME NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_usuarios_tipo_doc FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================================
-- PRODUCTOS  (categoria_id -> categorias)  << normalización principal
-- =========================================================================
CREATE TABLE productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(140) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  detalle TEXT NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  imagen_url VARCHAR(500) NOT NULL,
  precio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado ENUM('Disponible', 'Agotado', 'Inactivo') NOT NULL DEFAULT 'Disponible',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================================
-- IMÁGENES subidas desde el panel de administración
-- =========================================================================
CREATE TABLE imagenes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  tipo_mime VARCHAR(60) NOT NULL,
  contenido LONGBLOB NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================================
-- PQR  (Peticiones, Quejas y Reclamos)  — cliente_id -> usuarios
-- =========================================================================
CREATE TABLE pqr (
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
) ENGINE=InnoDB;

-- =========================================================================
-- CHATBOT  (conversaciones 1:N mensajes)
-- =========================================================================
CREATE TABLE conversaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,   -- NULL = visitante sin sesión
  iniciado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('Activa', 'Cerrada') NOT NULL DEFAULT 'Activa',
  CONSTRAINT fk_conversaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE mensajes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversacion_id INT UNSIGNED NOT NULL,
  emisor ENUM('Usuario', 'Bot') NOT NULL,
  contenido TEXT NOT NULL,
  enviado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mensajes_conversacion FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================================
-- INTENTOS_ACCESO  (control de fuerza bruta; tabla operativa, sin relaciones)
-- =========================================================================
CREATE TABLE intentos_acceso (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(200) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_intentos_clave_fecha (clave, creado_en)
) ENGINE=InnoDB;

-- =========================================================================
-- ÍNDICE DE APOYO
-- =========================================================================
CREATE INDEX idx_productos_categoria ON productos (categoria_id);

-- =========================================================================
-- DATOS DE EJEMPLO
-- =========================================================================

INSERT INTO roles (nombre) VALUES
  ('Administrador'), ('Empleado'), ('Cliente');

INSERT INTO tipos_documento (codigo, nombre) VALUES
  ('CC', 'Cédula de ciudadanía'),
  ('CE', 'Cédula de extranjería'),
  ('TI', 'Tarjeta de identidad'),
  ('PP', 'Pasaporte');

INSERT INTO categorias (nombre) VALUES
  ('Naked'), ('Adventure'), ('Enduro'), ('Supermoto'),
  ('Sport'), ('Sport Touring'), ('Motocross');

-- Usuario administrador de ejemplo.
--   Correo: admin@ktm.com   Contraseña: Admin1234
-- (hash bcrypt, compatible con el backend)
INSERT INTO usuarios
  (nombre, apellido, tipo_documento_id, numero_documento, direccion, telefono, correo, password_hash, estado, rol_id)
VALUES
  ('Administrador', 'KTM',
   (SELECT id FROM tipos_documento WHERE codigo = 'CC'),
   '1000000000', 'Sede principal', '3000000000', 'admin@ktm.com',
   '$2b$10$khaM5WfYszBfCHGQwEZ9oO6OdfFEPx0QqaEAQzibRzgZTFcXHSrwS',
   'Activo',
   (SELECT id FROM roles WHERE nombre = 'Administrador'));

-- Cliente de ejemplo (para mostrar la relación usuarios<->roles y las PQR).
--   Correo: cliente@demo.com   Contraseña: Admin1234  (mismo hash de ejemplo)
INSERT INTO usuarios
  (nombre, apellido, tipo_documento_id, numero_documento, direccion, telefono, correo, password_hash, estado, rol_id)
VALUES
  ('Camila', 'Torres',
   (SELECT id FROM tipos_documento WHERE codigo = 'CC'),
   '1122334455', 'Calle 10 #20-30', '3011234567', 'cliente@demo.com',
   '$2b$10$khaM5WfYszBfCHGQwEZ9oO6OdfFEPx0QqaEAQzibRzgZTFcXHSrwS',
   'Activo',
   (SELECT id FROM roles WHERE nombre = 'Cliente'));

-- Catálogo de 10 modelos, cada uno enlazado a su categoría por clave foránea.
INSERT INTO productos (titulo, descripcion, detalle, categoria_id, imagen_url, precio, estado) VALUES
  ('KTM 1390 Super Adventure', 'La motocicleta ideal para la aventura.',
   'Motor de 1350 cc, 173 hp y 145 Nm de torque. Suspensión semiactiva y modos de conducción.',
   (SELECT id FROM categorias WHERE nombre = 'Adventure'), '/images/moto-1.png', 98000000, 'Disponible'),
  ('KTM 990 Duke', 'Potencia y estilo urbano.',
   'Bicilíndrica de 947 cc con 123 hp. La naked de media cilindrada más agresiva de la gama.',
   (SELECT id FROM categorias WHERE nombre = 'Naked'), '/images/moto2.jpg', 72000000, 'Disponible'),
  ('KTM 690 SMC R', 'Supermoto de calle y pista.',
   'Monocilíndrica LC4 de 693 cc, 74 hp y solo 147 kg. Chasis para el asfalto técnico.',
   (SELECT id FROM categorias WHERE nombre = 'Supermoto'), '/images/moto3.jpg', 58000000, 'Disponible'),
  ('KTM 890 Adventure R', 'Lista para cualquier terreno.',
   '889 cc, 105 hp, suspensión WP XPLOR de 240 mm y llanta delantera de 21 pulgadas.',
   (SELECT id FROM categorias WHERE nombre = 'Adventure'), '/images/moto4.jpg', 79000000, 'Disponible'),
  ('KTM 690 Enduro R', 'Aventura sin límites.',
   'Enduro homologada para calle con motor LC4 de 693 cc y 74 hp. Peso en seco de 146 kg.',
   (SELECT id FROM categorias WHERE nombre = 'Enduro'), '/images/moto5.jpg', 56000000, 'Disponible'),
  ('KTM 890 SMT', 'Sport touring de verdad.',
   '889 cc y 105 hp con ergonomía de viaje, maletas opcionales y electrónica completa.',
   (SELECT id FROM categorias WHERE nombre = 'Sport Touring'), '/images/moto6.jpg', 76000000, 'Disponible'),
  ('KTM 390 Adventure R', 'Tu primera gran aventura.',
   '399 cc, 45 hp, control de tracción desconectable y ABS off-road. Ideal para empezar.',
   (SELECT id FROM categorias WHERE nombre = 'Adventure'), '/images/moto7.jpg', 32000000, 'Disponible'),
  ('KTM 390 SMC R', 'Supermoto ligera y divertida.',
   'Monocilíndrica de 399 cc con 45 hp y 177 kg. Perfecta para ciudad y curvas.',
   (SELECT id FROM categorias WHERE nombre = 'Supermoto'), '/images/moto8.jpg', 30000000, 'Disponible'),
  ('KTM 990 RC R', 'Deportiva de calle con alma de pista.',
   '947 cc, 128 hp, aerodinámica activa y posición de conducción totalmente deportiva.',
   (SELECT id FROM categorias WHERE nombre = 'Sport'), '/images/moto9.jpg', 85000000, 'Disponible'),
  ('KTM 390 Enduro R', 'Pura diversión todo terreno.',
   '399 cc y 45 hp en un chasis enduro con suspensión de 230 mm de recorrido.',
   (SELECT id FROM categorias WHERE nombre = 'Enduro'), '/images/moto10.png', 31000000, 'Disponible');

-- PQR de ejemplo (relación pqr -> usuarios).
INSERT INTO pqr (cliente_id, tipo, asunto, mensaje, estado) VALUES
  ((SELECT id FROM usuarios WHERE correo = 'cliente@demo.com'),
   'Peticion', 'Disponibilidad de la 890 Adventure R',
   '¿Tienen disponible la KTM 890 Adventure R para verla en la sede?', 'Pendiente');
