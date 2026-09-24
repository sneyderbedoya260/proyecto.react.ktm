# Mostrar el modelo relacional en phpMyAdmin

Guía para importar la base normalizada y ver el diagrama de relaciones
(entidad–relación) en phpMyAdmin. Archivo del esquema: **`schema_mysql.sql`**
(en esta misma carpeta `backend-fastapi/db/`).

> Esto es para la base **MySQL/MariaDB local** (XAMPP). El sitio en producción
> corre en PostgreSQL (Neon) y no se toca. phpMyAdmin solo administra
> MySQL/MariaDB, por eso este esquema es aparte.

---

## 1. Arrancar XAMPP

1. Abre el **Panel de control de XAMPP**.
2. Pulsa **Start** en **Apache** y en **MySQL**. Ambos deben quedar en verde.

## 2. Abrir phpMyAdmin

En el navegador entra a: **http://localhost/phpmyadmin**

## 3. Importar el esquema

> ⚠️ El archivo empieza borrando las tablas de `ktm_motos` (`DROP TABLE IF
> EXISTS`) para que la importación quede limpia. Si en esa base ya tienes datos
> que quieras conservar, primero expórtalos. Si es solo la base vieja del
> proyecto, puedes importar sin problema.

1. En phpMyAdmin, arriba, pestaña **Importar**.
2. **Seleccionar archivo** → elige `backend-fastapi/db/schema_mysql.sql`.
3. Baja y pulsa **Continuar** (Go).
4. Debe salir el mensaje verde *"La importación se ejecutó correctamente"* y a
   la izquierda aparecerá la base **ktm_motos** con sus 11 tablas.

## 4. Ver el diagrama de relaciones (lo que hay que mostrar)

1. En la lista de la izquierda, haz clic en la base **ktm_motos**.
2. En el menú de arriba entra a la pestaña **Diseñador** (Designer). Si no la
   ves directa, está en **Más ▾ → Diseñador**.
3. phpMyAdmin dibuja **todas las tablas y las líneas de relación** entre ellas
   automáticamente (las lee de las claves foráneas). Puedes arrastrar las
   tablas para acomodarlas y que el diagrama se vea ordenado.

### Exportar el diagrama como imagen o PDF

Dentro del **Diseñador**, en la barra de iconos de la izquierda busca
**"Exportar esquema"** (icono de guardar / documento). Elige formato **PDF**
o **PNG** y descárgalo: ese archivo es el entregable del modelo relacional.

> Alternativa por tabla: entra a una tabla → pestaña **Estructura** → enlace
> **Vista de relaciones**. Ahí se ve, columna por columna, a qué tabla y
> columna apunta cada clave foránea.

---

## Relaciones del modelo (6 claves foráneas)

| Tabla | Columna | Apunta a |
|---|---|---|
| usuarios | rol_id | roles |
| usuarios | tipo_documento_id | tipos_documento |
| productos | categoria_id | categorias |
| pqr | cliente_id | usuarios |
| conversaciones | usuario_id | usuarios |
| mensajes | conversacion_id | conversaciones |

## Normalización (por si te lo preguntan)

- **1FN:** cada campo guarda un solo valor; nada de listas dentro de una celda.
- **2FN:** cada tabla tiene su propia clave primaria (`id`); no hay claves
  compuestas con dependencias parciales.
- **3FN:** los valores que antes se repetían como texto se movieron a tablas de
  catálogo — **roles**, **tipos_documento** y **categorias** — enlazadas por
  clave foránea. Así no hay datos repetidos ni inconsistentes.
- Relación **1:N**: una conversación del chatbot tiene muchos mensajes
  (`mensajes.conversacion_id → conversaciones`).

## Usuarios de ejemplo (ya vienen en el esquema)

| Correo | Contraseña | Rol |
|---|---|---|
| admin@ktm.com | Admin1234 | Administrador |
| cliente@demo.com | Admin1234 | Cliente |
