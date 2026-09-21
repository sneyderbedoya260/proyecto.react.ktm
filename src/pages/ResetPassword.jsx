import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthField from '../components/AuthField';
import { resetPassword } from '../services/authService';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [formulario, setFormulario] = useState({ password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
    setMensaje('');
    setError('');
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    if (formulario.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (formulario.password !== formulario.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    setError('');
    try {
      const data = await resetPassword({ token, password: formulario.password });
      setMensaje(data.mensaje || 'Contraseña actualizada correctamente.');
      setExito(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (requestError) {
      setMensaje(requestError.message || 'No fue posible restablecer la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-[var(--ktm-black)] px-5 py-12 text-center text-white">
        <section className="w-full max-w-lg rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 sm:p-9">
          <h1 className="m-0 text-2xl font-extrabold uppercase">Enlace inválido</h1>
          <p className="mt-3 text-neutral-300">Este enlace no incluye un token válido. Solicita uno nuevo desde recuperar contraseña.</p>
          <Link className="mt-6 inline-block font-bold text-[var(--ktm-orange)] underline" to="/recuperar-contrasena">Solicitar enlace nuevo</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[var(--ktm-black)] px-5 py-12">
      <section className="w-full max-w-lg rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 text-white shadow-2xl sm:p-9">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Cuenta KTM</p>
        <h1 className="m-0 text-3xl font-extrabold uppercase">Nueva contraseña</h1>
        <p className="mt-3 text-neutral-300">Escribe tu nueva contraseña para tu cuenta.</p>
        {!exito ? (
          <form className="mt-7 grid gap-4" onSubmit={enviarFormulario} noValidate>
            <AuthField label="Nueva contraseña" name="password" type="password" value={formulario.password} onChange={actualizarCampo} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            <AuthField label="Confirmar contraseña" name="confirmar" type="password" value={formulario.confirmar} onChange={actualizarCampo} placeholder="Repite la contraseña" autoComplete="new-password" />
            {error && <p className="text-xs font-normal text-red-400">{error}</p>}
            <button className="mt-2 rounded bg-[var(--ktm-orange)] px-4 py-3 font-extrabold uppercase text-[var(--ktm-black)] transition hover:bg-[var(--ktm-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60" disabled={enviando} type="submit">
              {enviando ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        ) : null}
        {mensaje && <p className="mt-5 border-l-4 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-300" aria-live="polite">{mensaje}</p>}
        <Link className="mt-6 block text-center font-bold text-[var(--ktm-orange)] underline" to="/login">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}

export default ResetPassword;
