import { useEffect, useState } from 'react';
import { listarFacturas, generarFactura, descargarFactura } from '../../services/facturaService';
import { listarVentas } from '../../services/ventaService';
import { listarClientes } from '../../services/usuarioService';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2 text-sm';
const pesos = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const filtroVacio = { numero_factura: '', cliente_id: '', fecha_inicio: '', fecha_fin: '' };

function AdminFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState(filtroVacio);
  const [ventaSel, setVentaSel] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = async (f = filtroVacio) => {
    setCargando(true);
    try {
      const [fs, vs, cs] = await Promise.all([listarFacturas(f), listarVentas(), listarClientes()]);
      setFacturas(fs);
      setVentas(vs);
      setClientes(cs);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const ventasFacturadas = new Set(facturas.map((f) => f.venta_id));
  const ventasSinFactura = ventas.filter((v) => !ventasFacturadas.has(v.id));

  const generar = async () => {
    if (!ventaSel) return;
    setError(''); setMensaje('');
    try {
      const f = await generarFactura(Number(ventaSel));
      setMensaje(`Factura ${f.numero_factura} generada.`);
      setVentaSel('');
      cargar(filtros);
    } catch (e) {
      setError(e.message);
    }
  };

  const descargar = async (f) => {
    try { await descargarFactura(f.id, f.numero_factura); }
    catch (e) { setError(e.message); }
  };

  const actualizarFiltro = (e) => setFiltros((a) => ({ ...a, [e.target.name]: e.target.value }));

  return (
    <div className="mx-auto max-w-6xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Comercial</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Facturas</h1>
      <p className="mt-2 text-neutral-300">Genera facturas a partir de una venta, consúltalas y descárgalas en PDF.</p>

      {mensaje && <p className="mt-5 border-l-4 border-green-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm">{mensaje}</p>}
      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 grid gap-3 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">Generar factura desde una venta
          <select className={inp} value={ventaSel} onChange={(e) => setVentaSel(e.target.value)}>
            <option value="">Selecciona una venta sin factura</option>
            {ventasSinFactura.map((v) => <option key={v.id} value={v.id}>Venta #{v.id} — {v.cliente_nombre} — {pesos(v.total)}</option>)}
          </select>
        </label>
        <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black disabled:opacity-60" onClick={generar} type="button" disabled={!ventaSel}>Generar</button>
      </div>

      <h2 className="mt-10 text-xl font-bold">Consultar facturas</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <input className={inp} name="numero_factura" value={filtros.numero_factura} onChange={actualizarFiltro} placeholder="N° factura (FAC-000001)" />
        <select className={inp} name="cliente_id" value={filtros.cliente_id} onChange={actualizarFiltro}>
          <option value="">Todos los clientes</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
        <input className={inp} type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={actualizarFiltro} />
        <input className={inp} type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={actualizarFiltro} />
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-[var(--ktm-orange)] px-4 py-2 text-sm font-bold uppercase text-black" onClick={() => cargar(filtros)} type="button">Filtrar</button>
        <button className="rounded border border-neutral-500 px-4 py-2 text-sm font-bold uppercase text-neutral-200" onClick={() => { setFiltros(filtroVacio); cargar(filtroVacio); }} type="button">Limpiar</button>
      </div>

      {cargando ? <p className="mt-4 text-neutral-300">Cargando...</p> : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-700">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--ktm-gray)] text-neutral-300">
                <th className="p-3">N° Factura</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Total</th><th className="p-3">Estado</th><th className="p-3">PDF</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-t border-neutral-700">
                  <td className="p-3 font-semibold">{f.numero_factura}</td>
                  <td className="p-3 text-neutral-300">{new Date(f.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="p-3">{f.cliente_nombre || `#${f.cliente_id}`}</td>
                  <td className="p-3">{pesos(f.total)}</td>
                  <td className="p-3 text-neutral-300">{f.estado}</td>
                  <td className="p-3"><button className="rounded border border-[var(--ktm-orange)] px-3 py-1 text-xs font-bold uppercase text-[var(--ktm-orange)]" onClick={() => descargar(f)} type="button">Descargar</button></td>
                </tr>
              ))}
              {facturas.length === 0 && <tr><td className="p-4 text-center text-neutral-400" colSpan={6}>No hay facturas para este filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminFacturas;
