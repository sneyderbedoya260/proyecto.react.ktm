import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarVentas, crearVenta, cambiarEstadoVenta } from '../../services/ventaService';
import { listarProductosAdmin } from '../../services/productService';
import { listarClientes } from '../../services/usuarioService';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2 text-sm';
const ESTADOS = ['Pendiente', 'Cotizado', 'Confirmado', 'Cancelado'];
const pesos = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const filtroVacio = { fecha_inicio: '', fecha_fin: '', cliente_id: '', producto_id: '', estado: '' };

function AdminVentas() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState(filtroVacio);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Formulario de nueva venta
  const [clienteId, setClienteId] = useState('');
  const [items, setItems] = useState([]);
  const [prodSel, setProdSel] = useState('');
  const [cant, setCant] = useState(1);
  const [descuento, setDescuento] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarVentas = async (f = filtroVacio) => {
    setCargando(true);
    try {
      setVentas(await listarVentas(f));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [ps, cs] = await Promise.all([listarProductosAdmin(), listarClientes()]);
        setProductos(ps);
        setClientes(cs);
      } catch (e) { setError(e.message); }
    })();
    cargarVentas();
  }, []);

  const productoPorId = useMemo(() => Object.fromEntries(productos.map((p) => [String(p.id), p])), [productos]);

  const agregarItem = () => {
    if (!prodSel) return;
    const p = productoPorId[prodSel];
    if (!p) return;
    setItems((a) => {
      const existe = a.find((i) => i.producto_id === p.id);
      if (existe) return a.map((i) => i.producto_id === p.id ? { ...i, cantidad: i.cantidad + Number(cant) } : i);
      return [...a, { producto_id: p.id, titulo: p.titulo, precio: Number(p.precio), cantidad: Number(cant) }];
    });
    setProdSel(''); setCant(1);
  };

  const quitarItem = (id) => setItems((a) => a.filter((i) => i.producto_id !== id));

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const desc = Number(descuento) || 0;
  const impuestos = Math.max(0, (subtotal - desc)) * 0.19;
  const total = subtotal - desc + impuestos;

  const registrar = async (e) => {
    e.preventDefault();
    setError(''); setMensaje('');
    if (!clienteId) { setError('Selecciona un cliente.'); return; }
    if (items.length === 0) { setError('Agrega al menos un producto.'); return; }
    setEnviando(true);
    try {
      await crearVenta({
        cliente_id: Number(clienteId),
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        descuento: desc,
        notas: notas || null,
      });
      setMensaje('Venta registrada correctamente.');
      setClienteId(''); setItems([]); setDescuento(''); setNotas('');
      cargarVentas(filtros);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try { await cambiarEstadoVenta(id, estado); cargarVentas(filtros); }
    catch (err) { setError(err.message); }
  };

  const actualizarFiltro = (e) => setFiltros((a) => ({ ...a, [e.target.name]: e.target.value }));

  return (
    <div className="mx-auto max-w-6xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Comercial</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Ventas</h1>
      <p className="mt-2 text-neutral-300">Registra solicitudes de interés/cotización y consulta el historial.</p>

      {mensaje && <p className="mt-5 border-l-4 border-green-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm">{mensaje}</p>}
      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* Nueva venta */}
      <form onSubmit={registrar} className="mt-6 grid gap-4 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6">
        <h2 className="m-0 text-xl font-bold">Registrar venta</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Cliente
            <select className={inp} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} — {c.correo}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Descuento
            <input className={inp} type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} placeholder="0" />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="grid gap-1 text-sm">Producto
            <select className={inp} value={prodSel} onChange={(e) => setProdSel(e.target.value)}>
              <option value="">Selecciona un modelo</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.titulo} — {pesos(p.precio)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Cantidad
            <input className={`${inp} w-24`} type="number" min="1" value={cant} onChange={(e) => setCant(e.target.value)} />
          </label>
          <button type="button" onClick={agregarItem} className="rounded border border-[var(--ktm-orange)] px-4 py-2 text-sm font-bold uppercase text-[var(--ktm-orange)]">Agregar</button>
        </div>

        {items.length > 0 && (
          <div className="overflow-x-auto rounded border border-neutral-700">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead><tr className="text-neutral-400"><th className="p-2">Modelo</th><th className="p-2">Cant.</th><th className="p-2">Precio</th><th className="p-2">Subtotal</th><th className="p-2"></th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.producto_id} className="border-t border-neutral-800">
                    <td className="p-2">{i.titulo}</td><td className="p-2">{i.cantidad}</td><td className="p-2">{pesos(i.precio)}</td><td className="p-2">{pesos(i.precio * i.cantidad)}</td>
                    <td className="p-2"><button type="button" onClick={() => quitarItem(i.producto_id)} className="text-red-400">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <label className="grid gap-1 text-sm">Notas
          <input className={inp} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones de la solicitud" />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-700 pt-3 text-sm">
          <div className="text-neutral-300">Subtotal {pesos(subtotal)} · Descuento {pesos(desc)} · IVA {pesos(impuestos)} · <strong className="text-white">Total {pesos(total)}</strong></div>
          <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black transition hover:bg-[var(--ktm-orange-dark)] disabled:opacity-60" type="submit" disabled={enviando}>
            {enviando ? 'Registrando...' : 'Registrar venta'}
          </button>
        </div>
      </form>

      {/* Filtros del historial */}
      <h2 className="mt-10 text-xl font-bold">Historial de ventas</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-5">
        <input className={inp} type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={actualizarFiltro} />
        <input className={inp} type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={actualizarFiltro} />
        <select className={inp} name="cliente_id" value={filtros.cliente_id} onChange={actualizarFiltro}>
          <option value="">Todos los clientes</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
        <select className={inp} name="producto_id" value={filtros.producto_id} onChange={actualizarFiltro}>
          <option value="">Todos los productos</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
        </select>
        <select className={inp} name="estado" value={filtros.estado} onChange={actualizarFiltro}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-[var(--ktm-orange)] px-4 py-2 text-sm font-bold uppercase text-black" onClick={() => cargarVentas(filtros)} type="button">Filtrar</button>
        <button className="rounded border border-neutral-500 px-4 py-2 text-sm font-bold uppercase text-neutral-200" onClick={() => { setFiltros(filtroVacio); cargarVentas(filtroVacio); }} type="button">Limpiar</button>
      </div>

      {cargando ? <p className="mt-4 text-neutral-300">Cargando...</p> : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-700">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--ktm-gray)] text-neutral-300">
                <th className="p-3">#</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Modelos</th><th className="p-3">Total</th><th className="p-3">Estado</th><th className="p-3">Factura</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className="border-t border-neutral-700 align-top">
                  <td className="p-3">{v.id}</td>
                  <td className="p-3 text-neutral-300">{new Date(v.fecha_hora).toLocaleDateString('es-CO')}</td>
                  <td className="p-3">{v.cliente_nombre || `#${v.cliente_id}`}</td>
                  <td className="p-3 text-neutral-300">{v.detalles.map((d) => `${d.cantidad}× ${d.producto_titulo}`).join(', ')}</td>
                  <td className="p-3">{pesos(v.total)}</td>
                  <td className="p-3">
                    <select className="rounded border border-neutral-600 bg-black/40 px-2 py-1 text-xs" value={v.estado} onChange={(e) => cambiarEstado(v.id, e.target.value)}>
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3"><Link to="/admin/facturas" className="text-[var(--ktm-orange)] underline">Gestionar</Link></td>
                </tr>
              ))}
              {ventas.length === 0 && <tr><td className="p-4 text-center text-neutral-400" colSpan={7}>No hay ventas para este filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminVentas;
