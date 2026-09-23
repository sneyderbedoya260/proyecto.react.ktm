# Backend FastAPI — KTM Catálogo (Quinto Avance)

Este backend reemplaza al anterior en Node/Express (`backend-ktm`, que queda
obsoleto pero no se borró, por si necesitas comparar algo).

## 1. Instalar dependencias

```bash
cd backend-fastapi
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

## 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa tus datos reales:

```bash
cp .env.example .env
```

Debes poner ahí: los datos de tu MySQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`,
`DB_NAME`), el mismo `JWT_SECRET` que usabas antes (o uno nuevo, ya no
importa continuidad), `FRONTEND_URL`, y `EMAIL_USER`/`EMAIL_PASS` (la
contraseña de aplicación de Gmail que ya tenías configurada).

## 3. Actualizar la base de datos

Tu base de datos `ktm_motos` (con `roles`, `usuarios`, `productos`) **no se
toca**. Solo agrega las tablas nuevas ejecutando:

```bash
mysql -u root -p ktm_motos < db/schema_fastapi.sql
```

Esto crea `ventas`, `detalle_ventas`, `facturas`, `detalle_facturas`, `pqr`,
`conversaciones` y `mensajes`. Tus usuarios y productos actuales siguen
funcionando igual — los passwords con bcrypt son compatibles entre Node y
Python sin que nadie tenga que registrarse de nuevo.

## 4. Imágenes

Las imágenes del catálogo inicial viven en `public/images/` **del frontend**
(la raíz del repo), y se sirven como archivos estáticos.

Las que subas por el panel de admin **no** se guardan en disco: van a la tabla
`imagenes` de la base y se sirven desde `/api/imagenes/{nombre}`. Es lo que
permite que la subida también funcione desplegado, donde el disco es de solo
lectura (ver la sección de despliegue más abajo).

## 5. Levantar el servidor

```bash
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva automática (para probar todo sin Postman todavía):
**http://localhost:8000/docs**

## 6. Frontend

Ya actualicé `carrusel-jostin/.env` para que apunte a
`http://localhost:8000/api` en vez de `http://localhost:4000/api`. Corre el
frontend normalmente con `npm run dev`. El login, registro, recuperar
contraseña, listar productos y crear/editar/eliminar productos (incluida la
foto por explorador de archivos) ya funcionan contra este nuevo backend sin
más cambios.

---

## Endpoints nuevos de este avance (REQ-01 a REQ-09, REQ-21, REQ-22)

| Método | Ruta | Requerimiento |
|---|---|---|
| POST | `/api/ventas` | REQ-01, REQ-02 — crear solicitud de interés/cotización |
| GET | `/api/ventas?fecha_inicio=&fecha_fin=&cliente_id=&producto_id=&estado=` | REQ-03 — historial con filtros |
| GET | `/api/ventas/{id}` | Detalle de una venta |
| PUT | `/api/ventas/{id}/estado` | Cambiar estado (Admin/Empleado) |
| GET | `/api/reportes/ventas-diario?fecha=YYYY-MM-DD` | REQ-04 — reporte diario JSON |
| GET | `/api/reportes/ventas-diario/pdf?fecha=YYYY-MM-DD` | REQ-05 — reporte en PDF |
| GET | `/api/reportes/ventas-diario/excel?fecha=YYYY-MM-DD` | REQ-06 — reporte en Excel |
| POST | `/api/facturas/generar/{venta_id}` | REQ-07 — generar factura desde una venta |
| GET | `/api/facturas?numero_factura=&cliente_id=&fecha_inicio=&fecha_fin=` | REQ-08 — consultar facturas |
| GET | `/api/facturas/{id}/descargar` | REQ-09 — descargar factura en PDF |
| POST | `/api/productos/upload` | Subida de imagen desde el explorador de archivos |

## Endpoints del Dashboard (REQ-10 a REQ-13)

| Método | Ruta | Requerimiento |
|---|---|---|
| GET | `/api/dashboard/resumen` | REQ-10 — Cards: usuarios, productos, ventas, facturación, PQR |
| GET | `/api/dashboard/filtros` | Opciones para poblar los `<select>` de filtros |
| GET | `/api/dashboard/ventas?fecha_inicio=&fecha_fin=&agrupacion=dia\|semana\|mes&producto_id=&cliente_id=&estado=` | REQ-11, REQ-13 — gráfico de barras/línea con filtros |

**REQ-12 (seguridad por roles):** todo `/api/dashboard/*` exige rol
Administrador o Empleado (`requerir_rol`). Un Cliente recibe 403 si intenta
acceder — ya lo verifiqué en la prueba de humo. En el frontend, la página
`/dashboard` también se oculta del menú y bloquea la vista si el usuario no
es staff.

En el frontend, la nueva página está en `src/pages/dashboard.jsx` (con sus
estilos en `dashboard.css`) y usa la librería `recharts` para las gráficas
(ya la agregué a `package.json`, corre `npm install` para traerla). Aparece
un enlace "Dashboard" en el menú superior solo para Admin/Empleado.

Todos los endpoints de auth (`/api/auth/...`) y productos (`/api/productos...`)
siguen con la misma forma que tenía el backend Node, para que el frontend no
necesite cambios además de la URL base.

## Qué falta para completar los 25 requerimientos

Ya construido: **REQ-01 a REQ-13, REQ-21, REQ-22** (base de datos, ventas/
cotizaciones, reportes, facturación y dashboards con gráficos).

Pendiente para las siguientes fases que acordamos:
- **REQ-16 a REQ-19**: Módulo de PQR y Chatbot con IA (las tablas `pqr`,
  `conversaciones` y `mensajes` ya están creadas, listas para usarse).
- **REQ-14, REQ-15, REQ-23**: ya cubierto en su mayoría — el frontend
  consume FastAPI en vivo (sin datos "quemados") para productos, ventas,
  facturas y dashboard. Faltaría conectar PQR/Chatbot cuando se construyan.
- **REQ-20, REQ-24, REQ-25**: despliegue en la nube, revisión final de
  seguridad, y pruebas documentadas con Postman.

## Despliegue en producción (Neon + Vercel)

El proyecto está desplegado en **dos proyectos de Vercel** que comparten la
misma base de datos en Neon:

| Pieza | Dónde vive | URL |
|---|---|---|
| Frontend (React + Vite) | Vercel, proyecto `proyecto-react-ktm`, root `.` | https://proyecto-react-ktm.vercel.app |
| Backend (FastAPI) | Vercel, proyecto `ktm-catalogo-api`, root `backend-fastapi` | https://ktm-catalogo-api.vercel.app |
| Base de datos | Neon, proyecto `react.ktm` (`damp-voice-05288984`) | endpoint pooled `...-pooler...neon.tech` |

Vercel detecta FastAPI automáticamente por `requirements.txt` y toma
`app/main.py` como punto de entrada; no hace falta `vercel.json` en el backend.

### Variables de entorno

En el proyecto **`ktm-catalogo-api`** (Production, Preview y Development):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Cadena **pooled** de Neon (`postgresql://...-pooler...?sslmode=require`) |
| `JWT_SECRET` | Clave larga y aleatoria |
| `FRONTEND_URL` | `https://proyecto-react-ktm.vercel.app` (acepta varias separadas por coma) |
| `IVA_PORCENTAJE` | `0.19` |
| `EMAIL_USER` / `EMAIL_PASS` | Correo y contraseña de aplicación de Gmail |

En el proyecto **`proyecto-react-ktm`**:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://ktm-catalogo-api.vercel.app/api` |

### Crear la base desde cero

```bash
export DATABASE_URL="postgresql://...-pooler...neon.tech/neondb?sslmode=require"
python db/inicializar_neon.py
```

Crea el esquema (`db/schema_neon.sql`), el usuario administrador y el catálogo
inicial. Es idempotente: se puede volver a correr sin duplicar nada.

### Volver a desplegar

```bash
cd backend-fastapi && npx vercel deploy --prod   # backend
cd ..              && npx vercel deploy --prod   # frontend
```

### Diferencias con el entorno local

Dos cosas cambian al correr en Vercel, porque una función serverless tiene el
disco en **solo lectura** y no conserva nada entre invocaciones:

- Las imágenes subidas desde el panel de administración **se guardan en la base
  de datos** (tabla `imagenes`) y se sirven desde `/api/imagenes/{nombre}`, no
  en `public/images/`.
- Las imágenes del catálogo inicial se sirven como estáticos desde
  `public/images/` **del frontend**, por eso sus rutas son relativas
  (`/images/moto3.jpg`).

También se usa `NullPool` en SQLAlchemy cuando `VERCEL` está definido: cada
invocación puede caer en una instancia distinta, así que mantener un pool
propio solo agotaría las conexiones de Neon.
