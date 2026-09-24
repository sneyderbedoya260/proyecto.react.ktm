import { useEffect, useState } from 'react';
import { listarPqr, responderPqr } from '../../services/pqrService';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2 text-sm';
const ESTADOS = ['Pendiente', 'En proceso', 'Respondida', 'Cerrada'];
const TIPOS = ['Peticion', 'Queja', 'Reclamo'];
const colorEstado = (e) => ({
  Pendiente: 'text-yellow-400', 'En proceso': 'text-blue-400', Respondida: 'text-green-400', Cerrada: 'text-neutral-400',
}[e] || 'text-neutral-300');

function AdminPqr() {
  const [lista, setLista] = useState([]);
  const [filtros, setFiltros] = useState({ estado: '', tipo: '' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [borradores, setBorradores] = useState({});

  const cargar = async (f = {}) => {
    setCargando(true);
    try { setLista(await listarPqr(f)); }
    catch (e) { setError(e.message); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const setBorrador = (id, campo, valor) =>
    setBorradores((b) => ({ ...b, [id]: { ...b[id], [campo]: valor } }));

  const guardar = async (p) => {
    const b = borradores[p.id] || {};
    setError('');
    try {
      await responderPqr(p.id, {
        estado: b.estado || p.estado,
        respuesta: b.respuesta !== undefined ? b.respuesta : p.respuesta,
      });
      cargar(filtros);
    } catch (e) { setError(e.message); }
  };

  const actualizarFiltro = (e) => setFiltros((a) => ({ ...a, [e.target.name]: e.target.value }));

  return (
    <div className="mx-auto max-w-5xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Atención al cliente</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">PQR</h1>
      <p className="mt-2 text-neutral-300">Peticiones, quejas y reclamos de los clientes. Cambia el estado y responde.</p>

      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <select className={inp} name="estado" value={filtros.estado} onChange={actualizarFiltro}>
          <option value="">Todos los estados</option>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inp} name="tipo" value={filtros.tipo} onChange={actualizarFiltro}>
          <option value="">Todos los tipos</option>{TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="rounded bg-[var(--ktm-orange)] px-4 py-2 text-sm font-bold uppercase text-black" onClick={() => cargar(filtros)} type="button">Filtrar</button>
        <button className="rounded border border-neutral-500 px-4 py-2 text-sm font-bold uppercase text-neutral-200" onClick={() => { setFiltros({ estado: '', tipo: '' }); cargar({}); }} type="button">Limpiar</button>
      </div>

      {cargando ? <p className="mt-4 text-neutral-300">Cargando...</p> : (
        <div className="mt-5 grid gap-4">
          {lista.map((p) => (
            <article key={p.id} className="rounded-lg border border-neutral-700 bg-[var(--ktm-gray)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-bold uppercase text-[var(--ktm-orange)]">{p.tipo}</span>
                  <h3 className="m-0 mt-1 text-lg font-bold">{p.asunto}</h3>
                  <p className="m-0 text-xs text-neutral-400">{p.cliente_nombre} · {new Date(p.creado_en).toLocaleString('es-CO')}</p>
                </div>
                <span className={`text-sm font-bold ${colorEstado(p.estado)}`}>{p.estado}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-200">{p.mensaje}</p>

              <div className="mt-4 grid gap-2 border-t border-neutral-800 pt-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                <label className="grid gap-1 text-xs">Estado
                  <select className={inp} value={(borradores[p.id]?.estado) ?? p.estado} onChange={(e) => setBorrador(p.id, 'estado', e.target.value)}>
                    {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs">Respuesta
                  <input className={inp} value={(borradores[p.id]?.respuesta) ?? (p.respuesta || '')} onChange={(e) => setBorrador(p.id, 'respuesta', e.target.value)} placeholder="Escribe la respuesta al cliente" />
                </label>
                <button className="rounded bg-[var(--ktm-orange)] px-4 py-2 text-sm font-bold uppercase text-black" onClick={() => guardar(p)} type="button">Guardar</button>
              </div>
            </article>
          ))}
          {lista.length === 0 && <p className="text-neutral-400">No hay PQR para este filtro.</p>}
        </div>
      )}
    </div>
  );
}

export default AdminPqr;
