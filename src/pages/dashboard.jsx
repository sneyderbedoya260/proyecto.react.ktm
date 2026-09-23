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
import { getCatalogoDashboard, getFiltrosDashboard, getResumenDashboard } from '../services/dashboardService';
import './dashboard.css';

const filtroVacio = {
  fecha_inicio: '',
  fecha_fin: '',
  agrupacion: 'dia',
  categoria: '',
  estado: '',
};

function Dashboard() {
  const { usuario } = useAuth();
  const esStaff = usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Empleado');

  const [resumen, setResumen] = useState(null);
  const [opciones, setOpciones] = useState({ categorias: [], estados: [] });
  const [filtros, setFiltros] = useState(filtroVacio);
  const [porCategoria, setPorCategoria] = useState([]);
  const [porEstado, setPorEstado] = useState([]);
  const [publicados, setPublicados] = useState([]);
  const [totales, setTotales] = useState({ total_modelos: 0, total_categorias: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarCatalogo = useCallback(async (filtrosActuales) => {
    try {
      const datos = await getCatalogoDashboard(filtrosActuales);
      setPorCategoria(datos.por_categoria);
      setPorEstado(datos.por_estado);
      setPublicados(datos.labels.map((etiqueta, indice) => ({
        periodo: etiqueta,
        modelos: datos.publicados[indice],
      })));
      setTotales({ total_modelos: datos.total_modelos, total_categorias: datos.total_categorias });
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
        await cargarCatalogo(filtroVacio);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarTodo();
  }, [esStaff, cargarCatalogo]);

  const actualizarFiltro = (evento) => {
    setFiltros((actual) => ({ ...actual, [evento.target.name]: evento.target.value }));
  };

  const aplicarFiltros = async (evento) => {
    evento.preventDefault();
    setError('');
    await cargarCatalogo(filtros);
  };

  const limpiarFiltros = async () => {
    setFiltros(filtroVacio);
    setError('');
    await cargarCatalogo(filtroVacio);
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
        <p>Indicadores del catálogo de modelos y de la atención a los usuarios.</p>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {cargando ? (
        <p className="dashboard-cargando">Cargando indicadores...</p>
      ) : (
        <>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span className="dashboard-card-label">Modelos publicados</span>
              <strong>{resumen.total_productos}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Disponibles</span>
              <strong>{resumen.productos_disponibles}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Agotados</span>
              <strong>{resumen.productos_agotados}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Categorías</span>
              <strong>{resumen.total_categorias}</strong>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-card-label">Usuarios registrados</span>
              <strong>{resumen.total_usuarios}</strong>
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
              Categoría
              <select name="categoria" value={filtros.categoria} onChange={actualizarFiltro}>
                <option value="">Todas</option>
                {opciones.categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
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
            <span>Modelos en el filtro: <strong>{totales.total_modelos}</strong></span>
            <span>Categorías representadas: <strong>{totales.total_categorias}</strong></span>
          </div>

          <div className="dashboard-graficos">
            <div className="dashboard-grafico-card">
              <h3>Modelos por categoría</h3>
              {porCategoria.length === 0 ? (
                <p className="dashboard-sin-datos">No hay datos para este filtro.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={porCategoria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="categoria" stroke="#a8a8a8" fontSize={12} />
                    <YAxis stroke="#a8a8a8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #FF6600' }} />
                    <Bar dataKey="cantidad" name="Modelos" fill="#FF6600" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="dashboard-grafico-card">
              <h3>Modelos por estado</h3>
              {porEstado.length === 0 ? (
                <p className="dashboard-sin-datos">No hay datos para este filtro.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={porEstado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="estado" stroke="#a8a8a8" fontSize={12} />
                    <YAxis stroke="#a8a8a8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #FF6600' }} />
                    <Bar dataKey="cantidad" name="Modelos" fill="#FF6600" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="dashboard-grafico-card">
              <h3>Modelos publicados por periodo</h3>
              {publicados.length === 0 ? (
                <p className="dashboard-sin-datos">No hay datos para este filtro.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={publicados}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="periodo" stroke="#a8a8a8" fontSize={12} />
                    <YAxis stroke="#a8a8a8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #FF6600' }} />
                    <Line type="monotone" dataKey="modelos" name="Modelos" stroke="#FF6600" strokeWidth={2.5} dot={{ r: 3 }} />
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
