import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthField from '../components/AuthField';
import { recoverPassword } from '../services/authService';

function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const actualizarCorreo = (event) => {
    const nuevoCorreo = event.target.value;
    setEmail(nuevoCorreo);
    setMensaje('');
    setError(nuevoCorreo && !/^\S+@\S+\.\S+$/.test(nuevoCorreo) ? 'Escribe un correo electrónico válido.' : '');
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Escribe un correo electrónico válido.');
      return;
    }

    setEnviando(true);
    setError('');
    setMensaje('Enviando instrucciones...');

    try {
      await recoverPassword({ email });
      setMensaje('Si el correo existe, recibirás instrucciones para recuperar tu contraseña.');
    } catch (requestError) {
      setMensaje(requestError.message || 'No fue posible procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[var(--ktm-black)] px-5 py-12">
      <section className="w-full max-w-lg rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 text-white shadow-2xl sm:p-9">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Cuenta KTM</p>
        <h1 className="m-0 text-3xl font-extrabold uppercase">Recuperar contraseña</h1>
        <p className="mt-3 text-neutral-300">Te enviaremos un enlace para crear una nueva contraseña.</p>
        <form className="mt-7 grid gap-4" onSubmit={enviarFormulario} noValidate>
          <AuthField label="Correo electrónico" name="email" type="email" value={email} onChange={actualizarCorreo} error={error} placeholder="tu@correo.com" />
          <button className="mt-2 rounded bg-[var(--ktm-orange)] px-4 py-3 font-extrabold uppercase text-[var(--ktm-black)] transition hover:bg-[var(--ktm-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60" disabled={enviando} type="submit">
            {enviando ? 'Enviando...' : 'Recuperar contraseña'}
          </button>
          {mensaje && <p className="border-l-4 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-300" aria-live="polite">{mensaje}</p>}
        </form>
        <Link className="mt-6 block text-center font-bold text-[var(--ktm-orange)] underline" to="/login">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}

export default RecoverPassword;