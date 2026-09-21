import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import logo from '../assets/images/logo.jpg.png';
import { useAuth } from '../context/AuthContext';
import './header.css';

function Header() {
  const { usuario, cerrarSesion } = useAuth();
  const [oculto, setOculto] = useState(false);
  const ultimaPosicion = useRef(0);

  useEffect(() => {
    const controlarScroll = () => {
      const posicionActual = window.scrollY;

      if (posicionActual <= 20) {
        setOculto(false);
      } else if (posicionActual > ultimaPosicion.current) {
        setOculto(true);
      } else {
        setOculto(false);
      }

      ultimaPosicion.current = posicionActual;
    };

    window.addEventListener('scroll', controlarScroll, { passive: true });
    return () => window.removeEventListener('scroll', controlarScroll);
  }, []);

  return (
    <header className={`header ${oculto ? 'header-hidden' : ''}`}>
      <Link className="header-logo" to="/" aria-label="Ir al inicio">
        <img src={logo} alt="KTM" />
      </Link>
      <nav className="navbar">
        <ul className="navbar-menu">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/quienes-somos">¿Quiénes Somos?</Link></li>
          <li><Link to="/contacto">Contacto</Link></li>
          {usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Empleado') && (
            <li><Link to="/dashboard">Dashboard</Link></li>
          )}
          {usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Empleado') && (
            <li><Link to="/admin">Panel Admin</Link></li>
          )}
          {usuario ? (
            <li><button type="button" onClick={cerrarSesion}>Cerrar sesión</button></li>
          ) : <li><Link to="/login">Iniciar sesión</Link></li>}
        </ul>
      </nav>
    </header>
  );
}

export default Header;