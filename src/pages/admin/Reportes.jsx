import { useState } from 'react';
import { reporteDiario, descargarReportePdf, descargarReporteExcel } from '../../services/reporteService';

const pesos = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const hoy = new Date().toISOString().slice(0, 10);

function AdminReportes() {
  const [fecha, setFecha] = useState(hoy);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const consultar = async () => {
    setError(''); setCargando(true); setReporte(null);
    try {
      setReporte(await reporteDiario(fecha));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const descargar = async (tipo) => {
    setError('');
    try {
      if (tipo === 'pdf') await descargarReportePdf(fecha);
      else await descargarReporteExcel(fecha);
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="mx-auto max-w-5xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Comercial</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Reporte diario de ventas</h1>
      <p className="mt-2 text-neutral-300">Consulta las ventas de una fecha y expórtalas en PDF o Excel.</p>

      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6">
        <label className="grid gap-1 text-sm">Fecha
          <input className="rounded border border-neutral-600 bg-black/40 px-3 py-2" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black" onClick={consultar} type="button">Consultar</button>
        <button className="rounded border border-[var(--ktm-orange)] px-4 py-2.5 font-bold uppercase text-[var(--ktm-orange)]" onClick={() => descargar('pdf')} type="button">PDF</button>
        <button className="rounded border border-[var(--ktm-orange)] px-4 py-2.5 font-bold uppercase text-[var(--ktm-orange)]" onClick={() => descargar('excel')} type="button">Excel</button>
      </div>

      {cargando && <p className="mt-4 text-neutral-300">Consultando...</p>}

      {reporte && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[var(--ktm-gray)] p-4"><span className="text-xs uppercase text-neutral-400">Solicitudes</span><p className="m-0 text-2xl font-extrabold">{reporte.total_solicitudes}</p></div>
            <div className="rounded-lg bg-[var(--ktm-gray)] p-4"><span className="text-xs uppercase text-neutral-400">Unidades</span><p className="m-0 text-2xl font-extrabold">{reporte.total_unidades}</p></div>
            <div className="rounded-lg bg-[var(--ktm-gray)] p-4"><span className="text-xs uppercase text-neutral-400">Total recaudado</span><p className="m-0 text-2xl font-extrabold">{pesos(reporte.total_recaudado)}</p></div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-700">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[var(--ktm-gray)] text-neutral-300">
                  <th className="p-3">N° Venta</th><th className="p-3">Hora</th><th className="p-3">Cliente</th><th className="p-3">Productos</th><th className="p-3">Cant.</th><th className="p-3">Total</th><th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {reporte.ventas.map((v) => (
                  <tr key={v.numero_venta} className="border-t border-neutral-700">
                    <td className="p-3">{v.numero_venta}</td>
                    <td className="p-3 text-neutral-300">{new Date(v.fecha_hora).toLocaleTimeString('es-CO')}</td>
                    <td className="p-3">{v.cliente}</td>
                    <td className="p-3 text-neutral-300">{v.productos}</td>
                    <td className="p-3">{v.cantidad_total}</td>
                    <td className="p-3">{pesos(v.total)}</td>
                    <td className="p-3 text-neutral-300">{v.estado}</td>
                  </tr>
                ))}
                {reporte.ventas.length === 0 && <tr><td className="p-4 text-center text-neutral-400" colSpan={7}>No hay ventas en esta fecha.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportes;
