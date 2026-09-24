# Backend FastAPI — KTM Catálogo

API REST del catálogo de motos KTM. **Sitio de catálogo de consulta** (no una
tienda): productos, autenticación con roles, dashboard, PQR, gestión de
usuarios y chatbot con IA. Desplegada como función *serverless* en Vercel
contra PostgreSQL en Neon.

> Documentación técnica completa (arquitectura, despliegue, comparativa
> FastAPI vs Django REST, mapeo de requerimientos): **`../MANUAL_TECNICO.md`**.

## 1. Instalar

```bash
cd backend-fastapi
python -m venv venv
venv\Scripts\activate            # Windows  (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
```

## 2. Variables de entorno

```bash
copy .env.example .env           # completa los valores
```

Claves principales: `DATABASE_URL` (Neon/PostgreSQL), `JWT_SECRET`,
`FRONTEND_URL`, `EMAIL_USER`/`EMAIL_PASS` (recuperación de contraseña),
`GEMINI_API_KEY` (chatbot). Nunca se publican: `.env` está en `.gitignore`.

## 3. Base de datos

- **Producción (Neon/PostgreSQL):** ejecuta `db/schema_neon.sql`, o el script
  `python db/inicializar_neon.py` (crea esquema + admin + catálogo).
- **Demostración del modelo en phpMyAdmin (MySQL/XAMPP):** importa
  `db/schema_mysql.sql` y sigue `db/GUIA_phpmyadmin.md`.

## 4. Ejecutar

```bash
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: http://localhost:8000/docs

## 5. Pruebas

```bash
venv\Scripts\python -m pytest test_api.py -v
```

18 pruebas (Pytest + TestClient): CRUD de productos, autenticación JWT,
seguridad por roles, dashboard, gestión de usuarios, PQR y límite de intentos.
Colección Postman en `postman/`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/recover-password` · `/reset-password` | Autenticación (JWT) |
| GET/POST/PUT/DELETE | `/api/productos` · `/api/productos/{id}` | CRUD de productos |
| POST | `/api/productos/upload` | Subida de imagen |
| GET | `/api/imagenes/{nombre}` | Servir imagen subida |
| GET | `/api/dashboard/resumen` · `/filtros` · `/catalogo` | Dashboard (Admin/Empleado) |
| POST/GET | `/api/pqr` · GET/PUT `/api/pqr/{id}` | PQR (cliente crea/consulta; staff responde) |
| GET/POST/PUT | `/api/usuarios` · `/api/usuarios/roles` · `/api/usuarios/{id}` · `/api/usuarios/{id}/estado` | Gestión de usuarios y roles (Admin) |
| POST | `/api/chatbot` | Chatbot con IA (Google Gemini) |
| GET | `/api/salud` | Estado del servicio |

Todos los endpoints sensibles exigen `Authorization: Bearer <token>` y, según
el caso, rol Administrador o Empleado.
