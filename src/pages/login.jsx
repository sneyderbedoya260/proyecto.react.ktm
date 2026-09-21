import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthField from '../components/AuthField';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import Registro from './registro';

const correoValido = /^\S+@\S+\.\S+$/;

function Login() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [formulario, setFormulario] = useState({ email: '', password: '', remember: false });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [registroAbierto, setRegistroAbierto] = useState(false);

  useEffect(() => {
    if (!registroAbierto) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setRegistroAbierto(false);
    };

    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [registroAbierto]);

  const validarCampo = (name, value) => {
    if (name === 'email' && value && !correoValido.test(value)) return 'Escribe un correo electrónico válido.';
    if (name === 'password' && value && value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    return '';
  };

  const actualizarCampo = (event) => {
    const { name, value, type, checked } = event.target;
    const nuevoValor = type === 'checkbox' ? checked : value;
    setFormulario((actual) => ({ ...actual, [name]: nuevoValor }));
    if (type !== 'checkbox') {
      setErrores((actuales) => ({ ...actuales, [name]: validarCampo(name, value) }));
    }
    setMensaje('');
  };

  const validarFormulario = () => {
    const nuevosErrores = {
      email: !formulario.email ? 'El correo electrónico es obligatorio.' : validarCampo('email', formulario.email),
      password: !formulario.password ? 'La contraseña es obligatoria.' : validarCampo('password', formulario.password),
    };
    const erroresActivos = Object.fromEntries(Object.entries(nuevosErrores).filter(([, error]) => error));
    setErrores(erroresActivos);
    return Object.keys(erroresActivos).length === 0;
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setMensaje('');
    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      const data = await loginUser(formulario);
      iniciarSesion(data.usuario);
      setMensaje('Inicio de sesión correcto.');
      navigate('/');
    } catch (error) {
      setMensaje(error.message || 'No fue posible iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[var(--ktm-black)] px-5 py-12">
      <section className="w-full max-w-lg rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 text-white shadow-2xl sm:p-9">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Cuenta KTM</p>
        <h1 className="m-0 text-3xl font-extrabold uppercase">Iniciar sesión</h1>
        <p className="mt-3 text-neutral-300">Guarda tus modelos favoritos y recibe novedades.</p>
        <form className="mt-7 grid gap-4" onSubmit={enviarFormulario} noValidate>
          <AuthField label="Correo electrónico" name="email" type="email" value={formulario.email} onChange={actualizarCampo} error={errores.email} placeholder="tu@correo.com" autoComplete="email" />
          <AuthField label="Contraseña" name="password" type="password" value={formulario.password} onChange={actualizarCampo} error={errores.password} placeholder="Mínimo 8 caracteres" autoComplete="current-password" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-neutral-300">
              <input className="h-4 w-4 accent-[var(--ktm-orange)]" name="remember" type="checkbox" checked={formulario.remember} onChange={actualizarCampo} />
              Recordarme
            </label>
            <Link className="font-bold text-[var(--ktm-orange)] underline" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          </div>
          <button className="mt-2 rounded bg-[var(--ktm-orange)] px-4 py-3 font-extrabold uppercase text-[var(--ktm-black)] transition hover:bg-[var(--ktm-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60" disabled={enviando} type="submit">
            {enviando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
          {mensaje && <p className="border-l-4 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-300" aria-live="polite">{mensaje}</p>}
        </form>
        <p className="mt-6 text-center text-sm text-neutral-300">¿Aún no tienes cuenta? <button className="font-bold text-[var(--ktm-orange)] underline" onClick={() => setRegistroAbierto(true)} type="button">Crear una cuenta</button></p>
      </section>
      {registroAbierto && <Registro onClose={() => setRegistroAbierto(false)} />}
    </main>
  );
}

export default Login;
