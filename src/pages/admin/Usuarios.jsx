import { useEffect, useState } from 'react';
import { listarUsuarios, listarRoles, crearUsuario, cambiarEstadoUsuario } from '../../services/usuarioService';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2';
const formularioVacio = {
  nombre: '', apellido: '', tipoDocumento: 'CC', numeroDocumento: '', direccion: '',
  telefono: '', email: '', password: '', rol_id: 3,
};

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const [us, rs] = await Promise.all([listarUsuarios(), listarRoles()]);
      setUsuarios(us);
      setRoles(rs);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const actualizarCampo = (e) => {
    const { name, value } = e.target;
    setFormulario((a) => ({ ...a, [name]: name === 'rol_id' ? Number(value) : value }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje(''); setError('');
    setEnviando(true);
    try {
      await crearUsuario(formulario);
      setMensaje(`Usuario "${formulario.nombre}" creado correctamente.`);
      setFormulario(formularioVacio);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const alternarEstado = async (u) => {
    const nuevo = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await cambiarEstadoUsuario(u.id, nuevo);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Administración</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Usuarios</h1>
      <p className="mt-2 text-neutral-300">Crea usuarios y asígnales su rol (Administrador, Empleado o Cliente).</p>

      {mensaje && <p className="mt-5 border-l-4 border-green-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm">{mensaje}</p>}
      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      <form onSubmit={enviar} className="mt-6 grid gap-4 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 sm:grid-cols-2">
        <h2 className="sm:col-span-2 m-0 text-xl font-bold">Nuevo usuario</h2>
        <label className="grid gap-1 text-sm">Nombre<input className={inp} name="nombre" value={formulario.nombre} onChange={actualizarCampo} required /></label>
        <label className="grid gap-1 text-sm">Apellido<input className={inp} name="apellido" value={formulario.apellido} onChange={actualizarCampo} required /></label>
        <label className="grid gap-1 text-sm">Tipo de documento
          <select className={inp} name="tipoDocumento" value={formulario.tipoDocumento} onChange={actualizarCampo}>
            <option value="CC">CC</option><option value="CE">CE</option><option value="TI">TI</option><option value="PP">PP</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">Número de documento<input className={inp} name="numeroDocumento" value={formulario.numeroDocumento} onChange={actualizarCampo} required /></label>
        <label className="grid gap-1 text-sm">Correo<input className={inp} type="email" name="email" value={formulario.email} onChange={actualizarCampo} required /></label>
        <label className="grid gap-1 text-sm">Teléfono<input className={inp} name="telefono" value={formulario.telefono} onChange={actualizarCampo} required /></label>
        <label className="grid gap-1 text-sm sm:col-span-2">Dirección<input className={inp} name="direccion" value={formulario.direccion} onChange={actualizarCampo} required /></label>
        <label className="grid gap-1 text-sm">Contraseña<input className={inp} type="password" name="password" value={formulario.password} onChange={actualizarCampo} placeholder="Mínimo 8 caracteres" required /></label>
        <label className="grid gap-1 text-sm">Rol
          <select className={inp} name="rol_id" value={formulario.rol_id} onChange={actualizarCampo}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black transition hover:bg-[var(--ktm-orange-dark)] disabled:opacity-60" type="submit" disabled={enviando}>
            {enviando ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-xl font-bold">Usuarios registrados</h2>
      {cargando ? <p className="mt-4 text-neutral-300">Cargando...</p> : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-700">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--ktm-gray)] text-neutral-300">
                <th className="p-3">Nombre</th><th className="p-3">Correo</th><th className="p-3">Teléfono</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-neutral-700">
                  <td className="p-3 font-semibold">{u.nombre} {u.apellido}</td>
                  <td className="p-3 text-neutral-300">{u.correo}</td>
                  <td className="p-3 text-neutral-300">{u.telefono}</td>
                  <td className="p-3 text-neutral-300">{u.rol}</td>
                  <td className="p-3"><span className={u.estado === 'Activo' ? 'text-green-400' : 'text-red-400'}>{u.estado}</span></td>
                  <td className="p-3">
                    <button className="rounded border border-neutral-500 px-3 py-1 text-xs font-bold uppercase text-neutral-200 hover:border-[var(--ktm-orange)] hover:text-[var(--ktm-orange)]" onClick={() => alternarEstado(u)} type="button">
                      {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && <tr><td className="p-4 text-center text-neutral-400" colSpan={6}>No hay usuarios.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsuarios;
