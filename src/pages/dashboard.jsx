import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getFiltrosDashboard, getResumenDashboard, getVentasDashboard } from '../services/dashboardService';
import './dashboard.css';

const filtroVacio = {
  fecha_inicio: '',
  fecha_fin: '',
  agrupacion: 'dia',
  producto_id: '',
  cliente_id: '',
  estado: '',
};

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);
}

function Dashboard() {
  const { usuario } = useAuth();
  const esStaff = usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Empleado');

  const [resumen, setResumen] = useState(null);
  const [opciones, setOpciones] = useState({ productos: [], clientes: [], estados: [] });
  const [filtros, setFiltros] = useState(filtroVacio);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [totalesPeriodo, setTotalesPeriodo] = useState({ total_periodo: 0, solicitudes_periodo: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarVentas = useCallback(async (filtrosActuales) => {
    try {
      const datos = await getVentasDashboard(filtrosActuales);
      const filas = datos.labels.map((etiqueta, indice) => ({
        periodo: etiqueta,
        solicitudes: datos.cantidad_solicitudes[indice],
        total: datos.totales[indice],
      }));
      setDatosGrafico(filas);
      setTotalesPeriodo({ total_periodo: datos.total_periodo, solicitudes_periodo: datos.solicitudes_periodo });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!esStaff) return;

    async function cargarTodo() {
      setCargando(true);
      setError('');
      try {
        const [datosResumen, datosFiltros] = await Promise.all([getResumenDashboard(), getFiltrosDashboard()]);
        setResumen(datosResumen);
        setOpciones(datosFiltros);
        await cargarVentas(filtroVacio);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarTodo();
  }, [esStaff, cargarVentas]);

  const actualizarFiltro = (evento) => {
    setFiltros((actual) => ({ ...actual, [evento.target.name]: evento.target.value }));
  };

  const aplicarFiltros = async (evento) => {
    evento.preventDefault();
    setError('');
    await cargarVentas(filtros);
  };

  const limpiarFiltros = async () => {
    setFiltros(filtroVacio);
    setError('');
    await cargarVentas(filtroVacio);
  };

  if (!usuario) return <Navigate to="/login" replace />;
  if (!esStaff) {
    return (
      <section className="dashboard-denegado">
        <h2>Acceso restringido</h2>
        <p>Esta sección solo está disponible para Administradores y Empleados.</p>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <div className="dashboard-heading">
        <p className="dashboard-kicker">Panel interno</p>
        <h2>Dashboard administrativo</h2>
        <p>Indicadores generales y comportamiento de las solicitudes de interés/cotización.</p>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {cargando ? (
        <p className="dashboard-cargando">Cargando indicadores...</p>
      ) : (
        <>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span className="dashboard-card-label">Usuarios</span>
              <strong>{resumen.total_usuarios}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Productos</span>
              <strong>{resumen.total_productos}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Solicitudes / Ventas</span>
              <strong>{resumen.total_ventas}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Facturación total</span>
              <strong>{formatoMoneda(resumen.total_facturacion)}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">PQR recibidas</span>
              <strong>{resumen.total_pqr}</strong>
            </div>
            <div className="dashboard-card dashboard-card-alerta">
              <span className="dashboard-card-label">PQR pendientes</span>
              <strong>{resumen.pqr_pendientes}</strong>
            </div>
          </div>

          <form className="dashboard-filtros" onSubmit={aplicarFiltros}>
            <label>
              Desde
              <input type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={actualizarFiltro} />
            </label>
            <label>
              Hasta
              <input type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={actualizarFiltro} />
            </label>
            <label>
              Agrupar por
              <select name="agrupacion" value={filtros.agrupacion} onChange={actualizarFiltro}>
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
              </select>
            </label>
            <label>
              Producto
              <select name="producto_id" value={filtros.producto_id} onChange={actualizarFiltro}>
                <option value="">Todos</option>
                {opciones.productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>{producto.titulo}</option>
                ))}
              </select>
            </label>
            <label>
              Cliente
              <select name="cliente_id" value={filtros.cliente_id} onChange={actualizarFiltro}>
                <option value="">Todos</option>
                {opciones.clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select name="estado" value={filtros.estado} onChange={actualizarFiltro}>
                <option value="">Todos</option>
                {opciones.estados.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </label>
            <div className="dashboard-filtros-botones">
              <button type="submit">Filtrar</button>
              <button type="button" className="dashboard-filtros-limpiar" onClick={limpiarFiltros}>Limpiar</button>
            </div>
          </form>

          <div className="dashboard-resumen-periodo">
            <span>Solicitudes en el periodo: <strong>{totalesPeriodo.solicitudes_periodo}</strong></span>
            <span>Total en el periodo: <strong>{formatoMoneda(totalesPeriodo.total_periodo)}</strong></span>
          </div>

          <div className="dashboard-graficos">
            <div className="dashboard-grafico-card">
              <h3>Solicitudes por periodo</h3>
              {datosGrafico.length === 0 ? (
                <p className="dashboard-sin-datos">No hay datos para este filtro.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="periodo" stroke="#a8a8a8" fontSize={12} />
                    <YAxis stroke="#a8a8a8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #FF6600' }} />
                    <Bar dataKey="solicitudes" name="Solicitudes" fill="#FF6600" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="dashboard-grafico-card">
              <h3>Total ($) por periodo</h3>
              {datosGrafico.length === 0 ? (
                <p className="dashboard-sin-datos">No hay datos para este filtro.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="periodo" stroke="#a8a8a8" fontSize={12} />
                    <YAxis stroke="#a8a8a8" fontSize={12} tickFormatter={(valor) => `$${(valor / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #FF6600' }}
                      formatter={(valor) => formatoMoneda(valor)}
                    />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#FF6600" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Dashboard;
