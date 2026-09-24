import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarPqr, crearPqr } from '../services/pqrService';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2 text-sm text-white';
const TIPOS = ['Peticion', 'Queja', 'Reclamo'];
const colorEstado = (e) => ({
  Pendiente: 'text-yellow-400', 'En proceso': 'text-blue-400', Respondida: 'text-green-400', Cerrada: 'text-neutral-400',
}[e] || 'text-neutral-300');

function Pqr() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [formulario, setFormulario] = useState({ tipo: 'Peticion', asunto: '', mensaje: '' });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try { setLista(await listarPqr()); }
    catch (e) { setError(e.message); }
    finally { setCargando(false); }
  };

  useEffect(() => { if (usuario) cargar(); }, [usuario]);

  if (!usuario) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[var(--ktm-black)] px-5 text-center text-white">
        <h1 className="text-3xl font-extrabold uppercase">PQR</h1>
        <p className="text-neutral-300">Inicia sesión para registrar una petición, queja o reclamo y ver su estado.</p>
        <Link to="/login" className="rounded bg-[var(--ktm-orange)] px-6 py-3 font-extrabold uppercase text-black">Iniciar sesión</Link>
      </main>
    );
  }

  const actualizarCampo = (e) => {
    const { name, value } = e.target;
    setFormulario((a) => ({ ...a, [name]: value }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje(''); setError('');
    setEnviando(true);
    try {
      await crearPqr(formulario);
      setMensaje('Tu PQR fue registrada. Te responderemos pronto.');
      setFormulario({ tipo: 'Peticion', asunto: '', mensaje: '' });
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10 text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Atención al cliente</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Peticiones, Quejas y Reclamos</h1>
      <p className="mt-2 text-neutral-300">Cuéntanos tu petición, queja o reclamo. Podrás consultar aquí mismo el estado.</p>

      {mensaje && <p className="mt-5 border-l-4 border-green-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm">{mensaje}</p>}
      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      <form onSubmit={enviar} className="mt-6 grid gap-4 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Tipo
            <select className={inp} name="tipo" value={formulario.tipo} onChange={actualizarCampo}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Asunto
            <input className={inp} name="asunto" value={formulario.asunto} onChange={actualizarCampo} placeholder="Resumen breve" required />
          </label>
        </div>
        <label className="grid gap-1 text-sm">Mensaje
          <textarea className={inp} name="mensaje" value={formulario.mensaje} onChange={actualizarCampo} rows={4} placeholder="Describe tu solicitud" required />
        </label>
        <div>
          <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black disabled:opacity-60" type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar PQR'}
          </button>
        </div>
      </form>

      <h2 className="mt-10 text-xl font-bold">Mis PQR</h2>
      {cargando ? <p className="mt-4 text-neutral-300">Cargando...</p> : (
        <div className="mt-4 grid gap-3">
          {lista.map((p) => (
            <article key={p.id} className="rounded-lg border border-neutral-700 bg-[var(--ktm-gray)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-bold uppercase text-[var(--ktm-orange)]">{p.tipo}</span>
                  <h3 className="m-0 mt-1 text-base font-bold">{p.asunto}</h3>
                </div>
                <span className={`text-sm font-bold ${colorEstado(p.estado)}`}>{p.estado}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{p.mensaje}</p>
              {p.respuesta && <p className="mt-2 border-l-2 border-[var(--ktm-orange)] pl-3 text-sm text-neutral-200"><strong>Respuesta:</strong> {p.respuesta}</p>}
              <p className="mt-2 text-xs text-neutral-500">{new Date(p.creado_en).toLocaleString('es-CO')}</p>
            </article>
          ))}
          {lista.length === 0 && <p className="text-neutral-400">Aún no has registrado ninguna PQR.</p>}
        </div>
      )}
    </main>
  );
}

export default Pqr;
