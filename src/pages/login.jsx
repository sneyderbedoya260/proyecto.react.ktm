import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthField from '../components/AuthField';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import Registro from './registro';

const correoValido = /^\S+@\S+\.\S+$/;

function Login() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  // El inicio de sesión va en dos pasos: primero el correo, luego la contraseña.
  //
  // El paso del correo NO consulta al servidor a propósito. Si preguntáramos
  // "¿existe este correo?" antes de pedir la contraseña, cualquiera podría
  // averiguar qué correos tienen cuenta probando direcciones una por una
  // (enumeración de usuarios). La autenticación sigue ocurriendo de una sola
  // vez, con correo y contraseña juntos, en el paso 2.
  const [paso, setPaso] = useState('correo');

  const [formulario, setFormulario] = useState({ email: '', password: '', remember: false });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [registroAbierto, setRegistroAbierto] = useState(false);
  const campoPassword = useRef(null);

  useEffect(() => {
    if (paso === 'password') campoPassword.current?.focus();
  }, [paso]);

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

  const continuarAlPassword = (event) => {
    event.preventDefault();
    setMensaje('');
    const error = !formulario.email
      ? 'El correo electrónico es obligatorio.'
      : validarCampo('email', formulario.email);

    if (error) {
      setErrores((actuales) => ({ ...actuales, email: error }));
      return;
    }

    setErrores({});
    setPaso('password');
  };

  const volverAlCorreo = () => {
    setPaso('correo');
    setFormulario((actual) => ({ ...actual, password: '' }));
    setErrores({});
    setMensaje('');
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setMensaje('');

    const error = !formulario.password
      ? 'La contraseña es obligatoria.'
      : validarCampo('password', formulario.password);

    if (error) {
      setErrores((actuales) => ({ ...actuales, password: error }));
      return;
    }

    setEnviando(true);
    try {
      const data = await loginUser(formulario);
      iniciarSesion(data.usuario);
      setMensaje('Inicio de sesión correcto.');
      navigate('/');
    } catch (err) {
      setMensaje(err.message || 'No fue posible iniciar sesión.');
      // El correo puede ser el equivocado, así que dejamos volver atrás sin
      // perder lo escrito; solo limpiamos la contraseña.
      setFormulario((actual) => ({ ...actual, password: '' }));
      campoPassword.current?.focus();
    } finally {
      setEnviando(false);
    }
  };

  const claseBoton =
    'mt-2 rounded bg-[var(--ktm-orange)] px-4 py-3 font-extrabold uppercase text-[var(--ktm-black)] transition hover:bg-[var(--ktm-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[var(--ktm-black)] px-5 py-12">
      <section className="w-full max-w-lg rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 text-white shadow-2xl sm:p-9">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Cuenta KTM</p>
        <h1 className="m-0 text-3xl font-extrabold uppercase">Iniciar sesión</h1>

        <div className="mt-4 flex items-center gap-2" aria-hidden="true">
          <span className="h-1 flex-1 rounded bg-[var(--ktm-orange)]" />
          <span className={`h-1 flex-1 rounded ${paso === 'password' ? 'bg-[var(--ktm-orange)]' : 'bg-neutral-700'}`} />
        </div>
        <p className="mt-2 text-xs uppercase tracking-[1px] text-neutral-400">
          Paso {paso === 'correo' ? '1' : '2'} de 2
        </p>

        {paso === 'correo' ? (
          <>
            <p className="mt-4 text-neutral-300">Escribe tu correo para continuar.</p>
            <form className="mt-6 grid gap-4" onSubmit={continuarAlPassword} noValidate>
              <AuthField
                label="Correo electrónico"
                name="email"
                type="email"
                value={formulario.email}
                onChange={actualizarCampo}
                error={errores.email}
                placeholder="tu@correo.com"
                autoComplete="username"
                autoFocus
              />
              <button className={claseBoton} type="submit">Continuar</button>
              {mensaje && (
                <p className="border-l-4 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-300" aria-live="polite">{mensaje}</p>
              )}
            </form>
            <p className="mt-6 text-center text-sm text-neutral-300">
              ¿Aún no tienes cuenta?{' '}
              <button className="font-bold text-[var(--ktm-orange)] underline" onClick={() => setRegistroAbierto(true)} type="button">
                Crear una cuenta
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-700 bg-neutral-950 px-3 py-2">
              <span className="truncate text-sm text-neutral-300">{formulario.email}</span>
              <button className="text-sm font-bold text-[var(--ktm-orange)] underline" onClick={volverAlCorreo} type="button">
                Cambiar
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={enviarFormulario} noValidate>
              <AuthField
                ref={campoPassword}
                label="Contraseña"
                name="password"
                type="password"
                value={formulario.password}
                onChange={actualizarCampo}
                error={errores.password}
                placeholder="Mínimo 8 caracteres"
                autoComplete="current-password"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-neutral-300">
                  <input className="h-4 w-4 accent-[var(--ktm-orange)]" name="remember" type="checkbox" checked={formulario.remember} onChange={actualizarCampo} />
                  Recordarme
                </label>
                <Link className="font-bold text-[var(--ktm-orange)] underline" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
              </div>
              <button className={claseBoton} disabled={enviando} type="submit">
                {enviando ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
              {mensaje && (
                <p className="border-l-4 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-300" aria-live="polite">{mensaje}</p>
              )}
            </form>
          </>
        )}
      </section>
      {registroAbierto && <Registro onClose={() => setRegistroAbierto(false)} />}
    </main>
  );
}

export default Login;
