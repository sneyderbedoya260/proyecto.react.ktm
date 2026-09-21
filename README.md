# KTM Motos

## Puesta en marcha con MySQL

1. Asegúrate de que MySQL esté activo en `localhost:3306` y revisa las variables de [backend-ktm/.env](backend-ktm/.env).
2. Ejecuta [backend-ktm/db/schema.sql](backend-ktm/db/schema.sql) desde MySQL Workbench, phpMyAdmin o el cliente MySQL. El script crea la base `ktm_motos`, las tablas y los roles requeridos.
3. Instala y arranca el backend:

```text
cd backend-ktm
npm install
npm start
```

4. En otra terminal, arranca el frontend desde la raíz:

```text
npm install
npm run dev
```

El frontend usa `VITE_API_URL=http://localhost:4000/api`. El catálogo público consulta `GET /api/productos`; registro, login y recuperación usan las rutas de autenticación.

Para crear el primer administrador, registra un usuario desde `/registro` y cambia su `rol_id` a `1` directamente en MySQL. Las rutas de usuarios requieren el rol `Administrador`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
