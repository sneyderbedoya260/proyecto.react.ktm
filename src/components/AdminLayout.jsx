import { useState } from 'react';
import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import logo from '../assets/images/logo.jpg.png';
import { useAuth } from '../context/AuthContext';
import './adminLayout.css';

const ENLACES = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/productos', label: 'Productos', icon: '🏍️' },
  { to: '/admin/pqr', label: 'PQR', icon: '💬' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥', soloAdmin: true },
];

function AdminLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);

  const esStaff = usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Empleado');
  if (!usuario) return <Navigate to="/login" replace />;
  if (!esStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--ktm-black)] px-5 text-center text-white">
        <p className="text-lg">No tienes permisos para acceder al panel de administración.</p>
      </main>
    );
  }

  const enlaces = ENLACES.filter((e) => !e.soloAdmin || usuario.rol === 'Administrador');

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${abierto ? 'is-open' : ''}`}>
        <div className="admin-sidebar-top">
          <Link to="/admin" className="admin-brand" onClick={() => setAbierto(false)}>
            <img src={logo} alt="KTM" />
            <span>Panel KTM</span>
          </Link>
        </div>

        <nav className="admin-nav">
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
              onClick={() => setAbierto(false)}
            >
              <span className="admin-nav-icon" aria-hidden="true">{e.icon}</span>
              {e.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <p className="admin-user">
            <strong>{usuario.nombre} {usuario.apellido}</strong>
            <span>{usuario.rol}</span>
          </p>
          <Link to="/" className="admin-link-sitio" onClick={() => setAbierto(false)}>← Volver al sitio</Link>
          <button type="button" className="admin-logout" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </aside>

      {abierto && <div className="admin-backdrop" onClick={() => setAbierto(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-hamburguesa" onClick={() => setAbierto((v) => !v)} aria-label="Menú">
            ☰
          </button>
          <span className="admin-topbar-title">Panel de administración</span>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
