# Manual Técnico — KTM Catálogo (Quinto Avance)

**Aprendiz:** Jostin Sneyder Bedoya Becerra
**Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO) — Ficha 3406211
**Proyecto:** Catálogo de Motos de Alta Gama — KTM
**Stack:** React + Vite · FastAPI · PostgreSQL · IA (Google Gemini)

- **Sitio en vivo:** https://proyecto-react-ktm.vercel.app
- **API en vivo:** https://ktm-catalogo-api.vercel.app
- **Documentación interactiva:** https://ktm-catalogo-api.vercel.app/docs
- **Repositorio:** https://github.com/sneyderbedoya260/proyecto.react.ktm

---

## 1. Arquitectura general

```
  Navegador
     │
     ▼
  Frontend React + Vite            Backend FastAPI                Base de datos
  (Vercel · estático)   ──HTTP──▶  (Vercel · serverless)  ──SQL──▶  PostgreSQL (Neon)
  proyecto-react-ktm               ktm-catalogo-api
                                        │
                                        └──HTTPS──▶  Google Gemini (IA del chatbot)
```

- El **frontend** es una SPA (React Router) que consume la API por un cliente
  HTTP centralizado; la URL del backend viene de la variable `VITE_API_URL`
  (no está quemada en el código).
- El **backend** es una API REST en FastAPI, desplegada como función
  *serverless* en Vercel. Detecta FastAPI por `requirements.txt` y usa
  `app/main.py` como punto de entrada.
- La **base de datos** en producción es PostgreSQL en Neon. Para la
  demostración del modelo relacional en phpMyAdmin existe además un esquema
  MySQL equivalente y normalizado (`backend-fastapi/db/schema_mysql.sql`).

## 2. Estructura del proyecto

```
carrusel-jostin/
├── src/                      # Frontend React
│   ├── components/           #   Chatbot, header, footer, catálogo, AuthField…
│   ├── pages/                #   index, login (2 pasos), admin, dashboard…
│   └── services/             #   authService, productService, dashboardService, chatbotService
├── api/  → (no)              # (FastAPI vive en backend-fastapi/)
├── backend-fastapi/
│   ├── app/
│   │   ├── main.py           # App FastAPI, CORS, cabeceras de seguridad
│   │   ├── config.py         # Variables de entorno (pydantic-settings)
│   │   ├── database.py       # Motor SQLAlchemy (NullPool en serverless)
│   │   ├── models.py         # Modelos ORM SQLAlchemy 2.0
│   │   ├── schemas.py        # Esquemas Pydantic v2 (entrada/salida)
│   │   ├── security.py       # bcrypt + JWT
│   │   ├── dependencies.py   # obtener_usuario_actual, requerir_rol
│   │   ├── rate_limit.py     # Límite de intentos (anti fuerza bruta)
│   │   └── routers/          # auth, productos, ventas, facturas, reportes,
│   │                         #   dashboard, imagenes, chatbot
│   ├── db/                   # schema_neon.sql, schema_mysql.sql, guía phpMyAdmin
│   ├── postman/              # Colección de pruebas Postman
│   ├── test_api.py           # Pruebas Pytest + TestClient
│   ├── requirements.txt
│   └── .env.example
└── vercel.json               # Rewrites SPA + cabeceras de seguridad del frontend
```

## 3. Ejecución local

### 3.1 Backend

```bash
cd backend-fastapi
python -m venv venv
venv\Scripts\activate            # Windows  (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt

copy .env.example .env           # y completa los valores (ver sección 4)
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva en http://localhost:8000/docs

La base de datos puede ser:
- **PostgreSQL/Neon:** define `DATABASE_URL` en `.env`.
- **MySQL local (XAMPP):** importa `db/schema_mysql.sql` en phpMyAdmin y define
  `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`.

Para crear el esquema y datos iniciales en Neon:

```bash
set DATABASE_URL=postgresql://...   # export en Mac/Linux
python db/inicializar_neon.py
```

### 3.2 Frontend

```bash
cd carrusel-jostin
npm install
# apunta al backend local:
echo VITE_API_URL=http://localhost:8000/api > .env
npm run dev
```

## 4. Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Neon, endpoint `-pooler`). |
| `JWT_SECRET` | Clave para firmar los tokens JWT. |
| `FRONTEND_URL` | URL(s) del frontend, para CORS y enlaces de correo. |
| `EMAIL_USER` / `EMAIL_PASS` | Correo Gmail y contraseña de aplicación (recuperación). |
| `IVA_PORCENTAJE` | Porcentaje de impuestos (0.19). |
| `GEMINI_API_KEY` | Llave de Google Gemini para el chatbot. **Solo en variables de entorno, nunca en el código.** |
| `GEMINI_MODEL` | Modelo Gemini (por defecto `gemini-3.5-flash-lite`). |

Las llaves y credenciales **nunca** se publican: `.env` está en `.gitignore` y
en producción viven en las variables de entorno de Vercel.

## 5. Pruebas

### 5.1 Automatizadas (Pytest + TestClient)

```bash
cd backend-fastapi
venv\Scripts\python -m pytest test_api.py -v
```

Cubren: salud, registro y login JWT, credenciales incorrectas, protección de
endpoints, CRUD completo de productos, seguridad por roles (cliente → 403),
flujo venta→factura→reportes (PDF/Excel), dashboards y límite de intentos.
**Resultado: 16 pruebas OK.**

### 5.2 Manuales (Postman)

Importa `backend-fastapi/postman/KTM_Catalogo.postman_collection.json`, ejecuta
primero **Auth → Login** (guarda el token solo) y luego el resto de peticiones
(GET, POST, PUT, DELETE) sobre ventas, facturas, reportes, dashboard y chatbot.

## 6. Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/recover-password` · `/reset-password` | Autenticación |
| GET/POST/PUT/DELETE | `/api/productos` | CRUD de productos |
| POST | `/api/productos/upload` | Subida de imagen |
| POST/GET/PUT | `/api/ventas` · `/api/ventas/{id}` · `/api/ventas/{id}/estado` | Ventas y detalle |
| POST/GET | `/api/facturas/generar/{id}` · `/api/facturas` · `/api/facturas/{id}/descargar` | Facturas |
| GET | `/api/reportes/ventas-diario[/pdf|/excel]` | Reporte diario JSON/PDF/Excel |
| GET | `/api/dashboard/resumen` · `/filtros` · `/catalogo` | Dashboard (rol Admin/Empleado) |
| POST | `/api/chatbot` | Chatbot con IA (Gemini) |
| GET | `/api/salud` | Estado del servicio |

## 7. Seguridad

- **Contraseñas:** hash con **bcrypt** (nunca en texto plano).
- **Autenticación:** JWT firmado (HS256); `Authorization: Bearer <token>`.
- **Autorización por rol:** `requerir_rol("Administrador", "Empleado")` protege
  los endpoints sensibles; un cliente recibe 403.
- **Fuerza bruta:** límite de intentos por IP y por correo (tabla
  `intentos_acceso`), respondiendo 429 al superarlo.
- **Anti-enumeración:** el login responde el mismo mensaje y en el mismo tiempo
  exista o no el correo.
- **CORS** restringido a los orígenes propios (no a cualquier dominio).
- **Cabeceras de seguridad** en API y frontend (X-Frame-Options,
  X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy).
- **Login en dos pasos** (correo → contraseña) sin revelar si el correo existe.

## 8. Chatbot con Inteligencia Artificial

El widget de chat está en todo el sitio (incluido el panel de administración).
El navegador **no** habla directo con Google: llama a `/api/chatbot`, y es el
backend quien consulta a **Google Gemini**. Así la `GEMINI_API_KEY` queda del
lado del servidor. Al bot se le inyecta el catálogo real de la base para que
responda con nombres y precios verdaderos, y tiene topes de mensaje, historial
y límite por IP para controlar costo y abuso.

## 9. Despliegue (nube)

- **Neon:** base PostgreSQL; se ejecuta `db/schema_neon.sql` (o
  `db/inicializar_neon.py`).
- **Vercel — backend** (`ktm-catalogo-api`): raíz `backend-fastapi`, variables
  de entorno configuradas, detección automática de FastAPI.
- **Vercel — frontend** (`proyecto-react-ktm`): raíz del repo, `VITE_API_URL`
  apuntando a la API.

## 10. Comparativa técnica: FastAPI vs Django REST Framework

| Criterio | FastAPI (usado en el proyecto) | Django REST Framework (DRF) |
|---|---|---|
| **Enfoque** | Micro-framework: se arma solo lo necesario. | Framework completo "baterías incluidas" sobre Django. |
| **Validación de datos** | Pydantic v2 (type hints); validación y serialización automáticas. | Serializers de DRF (declarativos, más verbosos). |
| **Documentación** | OpenAPI/Swagger (`/docs`, `/redoc`) automática. | Requiere `drf-spectacular` u otra librería aparte. |
| **Asincronía** | Nativa (`async/await`, ASGI) — encaja con serverless. | Soporte async parcial; núcleo históricamente síncrono (WSGI). |
| **Rendimiento** | Muy alto (Starlette + Uvicorn). | Bueno, pero con más sobrecarga del framework. |
| **ORM** | Libre elección (aquí SQLAlchemy 2.0). | ORM propio de Django, muy integrado con el admin. |
| **Curva de aprendizaje** | Baja para APIs pequeñas/medianas. | Mayor, pero trae admin, auth y migraciones listas. |
| **Ideal para** | APIs REST modernas, microservicios, IA/async. | Aplicaciones grandes con panel admin y muchas reglas de negocio. |

**Decisión del proyecto:** se eligió **FastAPI** por su documentación
automática (`/docs`), la validación con Pydantic, el soporte `async` nativo
(que encaja con el despliegue *serverless* en Vercel) y su bajo peso, adecuado
para una API de catálogo con integración de IA. DRF habría aportado el panel
de administración de Django, pero a costa de más peso y una configuración
menos alineada con el despliegue serverless usado.

## 11. Estado de cumplimiento y pendientes

Ver el archivo de la lista de chequeo para el detalle por requerimiento. En
resumen, el **backend está completo y probado** para ventas, facturas,
reportes, dashboard, seguridad, IA y despliegue. Queda pendiente, para una
siguiente iteración:

- **Módulo PQR (REQ-16):** la tabla existe; faltan endpoints e interfaz.
- **Interfaz React** para ventas/facturas/reportes (hoy son solo API).
- **Dashboard de ventas (REQ-11):** la infraestructura de gráficos existe, pero
  actualmente muestra datos del catálogo (el sitio se reenfocó como catálogo de
  consulta, no tienda). Reactivar la vista de ventas si el criterio lo exige.
