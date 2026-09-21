import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthField from '../components/AuthField';
import { registerUser } from '../services/authService';

const correoValido = /^\S+@\S+\.\S+$/;

function Registro({ onClose }) {
  const navigate = useNavigate();
  const cerrarRegistro = () => (onClose ? onClose() : navigate('/login'));
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: '',
    numeroDocumento: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const validarCampo = (name, value, valores = formulario) => {
    if (!value.trim()) return 'Este campo es obligatorio.';
    if (name === 'email' && !correoValido.test(value)) return 'Escribe un correo electrónico válido.';
    if (name === 'password' && value.length < 8) return 'Debe tener al menos 8 caracteres.';
    if (name === 'password' && value.length > 20) return 'Debe tener máximo 20 caracteres.';
    if (name === 'confirmPassword' && value !== valores.password) return 'Las contraseñas no coinciden.';
    if (name === 'numeroDocumento' && !/^[0-9]{6,12}$/.test(value)) return 'Usa entre 6 y 12 dígitos.';
    if (name === 'telefono' && !/^[0-9]{7,10}$/.test(value)) return 'Usa entre 7 y 10 dígitos.';
    return '';
  };

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    const nuevosValores = { ...formulario, [name]: value };
    setFormulario(nuevosValores);
    setErrores((actuales) => ({
      ...actuales,
      [name]: value ? validarCampo(name, value, nuevosValores) : '',
      ...(name === 'password' && formulario.confirmPassword
        ? { confirmPassword: validarCampo('confirmPassword', formulario.confirmPassword, nuevosValores) }
        : {}),
    }));
    setMensaje('');
  };

  const validarFormulario = () => {
    const nuevosErrores = Object.fromEntries(
      Object.entries(formulario)
        .map(([name, value]) => [name, validarCampo(name, value)])
        .filter(([, error]) => error)
    );
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setMensaje('');
    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      await registerUser(formulario);
      setMensaje('Registro correcto.');
    } catch (error) {
      setMensaje(error.message || 'No fue posible completar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && cerrarRegistro()}
    >
      <section
        aria-labelledby="registro-modal-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 text-[var(--ktm-white)] shadow-2xl sm:p-9"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Ready to Race</p>
            <h2 className="m-0 text-2xl font-extrabold uppercase sm:text-3xl" id="registro-modal-title">Crear cuenta</h2>
            <p className="mt-2 text-sm text-neutral-300">Únete para guardar tus modelos KTM preferidos.</p>
          </div>
          <button
            aria-label="Cerrar registro"
            className="rounded p-2 text-2xl leading-none text-neutral-300 transition hover:bg-neutral-700 hover:text-[var(--ktm-orange)]"
            onClick={cerrarRegistro}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={enviarFormulario} noValidate>
          <AuthField label="Nombre" name="nombre" value={formulario.nombre} onChange={actualizarCampo} error={errores.nombre} autoComplete="given-name" />
          <AuthField label="Apellido" name="apellido" value={formulario.apellido} onChange={actualizarCampo} error={errores.apellido} autoComplete="family-name" />
          <label className="grid gap-2 text-sm font-bold">
            Tipo de documento
            <select className={`rounded border bg-neutral-950 px-3 py-3 font-normal text-white outline-none transition focus:ring-2 ${errores.tipoDocumento ? 'border-red-500 focus:ring-red-500/25' : 'border-neutral-600 focus:border-[var(--ktm-orange)] focus:ring-orange-600/30'}`} name="tipoDocumento" value={formulario.tipoDocumento} onChange={actualizarCampo}>
              <option value="">Selecciona una opción</option>
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="PAS">Pasaporte</option>
            </select>
            {errores.tipoDocumento && <span className="text-xs font-normal text-red-400">{errores.tipoDocumento}</span>}
          </label>
          <AuthField label="Número de documento" name="numeroDocumento" value={formulario.numeroDocumento} onChange={actualizarCampo} error={errores.numeroDocumento} inputMode="numeric" />
          <AuthField label="Dirección" name="direccion" value={formulario.direccion} onChange={actualizarCampo} error={errores.direccion} autoComplete="street-address" />
          <AuthField label="Teléfono" name="telefono" type="tel" value={formulario.telefono} onChange={actualizarCampo} error={errores.telefono} autoComplete="tel" />
          <div className="sm:col-span-2">
            <AuthField label="Correo electrónico" name="email" type="email" value={formulario.email} onChange={actualizarCampo} error={errores.email} autoComplete="email" />
          </div>
          <AuthField label="Contraseña" name="password" type="password" value={formulario.password} onChange={actualizarCampo} error={errores.password} autoComplete="new-password" />
          <AuthField label="Confirmación de contraseña" name="confirmPassword" type="password" value={formulario.confirmPassword} onChange={actualizarCampo} error={errores.confirmPassword} autoComplete="new-password" />
          <button className="mt-2 rounded bg-[var(--ktm-orange)] px-4 py-3 font-extrabold uppercase text-[var(--ktm-black)] transition hover:bg-[var(--ktm-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2" disabled={enviando} type="submit">{enviando ? 'Registrando...' : 'Registrarme'}</button>
          {mensaje && <p className="border-l-4 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-300" aria-live="polite">{mensaje}</p>}
        </form>
      </section>
    </div>
  );
}

export default Registro;
