import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/header';
import Footer from './components/footer';
import Chatbot from './components/Chatbot';
import Index from './pages/index';
import QuienesSomos from './pages/quienessomos';
import Contacto from './pages/contacto';
import MotoDetalle from './pages/motoDetalle';
import Login from './pages/login';
import Registro from './pages/registro';
import RecoverPassword from './pages/RecoverPassword';
import Admin from './pages/admin';
import Dashboard from './pages/dashboard';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <div className="App">
      <Header />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/motos/:id" element={<MotoDetalle />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-contrasena" element={<RecoverPassword />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
      </Routes>

      <Footer />
      <Chatbot />
    </div>
  );
}

export default App;