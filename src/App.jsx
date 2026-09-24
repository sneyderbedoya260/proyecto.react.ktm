import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/header';
import Footer from './components/footer';
import Chatbot from './components/Chatbot';
import AdminLayout from './components/AdminLayout';
import Index from './pages/index';
import QuienesSomos from './pages/quienessomos';
import Contacto from './pages/contacto';
import MotoDetalle from './pages/motoDetalle';
import Login from './pages/login';
import Registro from './pages/registro';
import RecoverPassword from './pages/RecoverPassword';
import ResetPassword from './pages/ResetPassword';
import Pqr from './pages/pqr';
import Dashboard from './pages/dashboard';
import AdminProductos from './pages/admin/Productos';
import AdminUsuarios from './pages/admin/Usuarios';
import AdminPqr from './pages/admin/PqrAdmin';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const { pathname } = useLocation();
  // El panel de administración tiene su propio layout (sidebar), sin el
  // header/footer del sitio público.
  const esAdmin = pathname.startsWith('/admin');

  return (
    <div className={`App ${esAdmin ? 'App--admin' : ''}`}>
      {!esAdmin && <Header />}
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/motos/:id" element={<MotoDetalle />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-contrasena" element={<RecoverPassword />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
        <Route path="/pqr" element={<Pqr />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="pqr" element={<AdminPqr />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
        </Route>
      </Routes>

      {!esAdmin && <Footer />}
      <Chatbot />
    </div>
  );
}

export default App;
