import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarProductosAdmin, crearProducto, actualizarProducto, eliminarProducto, subirImagenProducto } from '../services/productService';

import { CATEGORIAS_DISPONIBLES } from '../data/categorias';

const formularioVacio = {
  titulo: '',
  descripcion: '',
  detalle: '',
  categoria: '',
  imagen_url: '',
  precio: '',
  estado: 'Disponible',
};

function Admin() {
  const { usuario } = useAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const esAdmin = usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Empleado');

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const datos = await listarProductosAdmin();
      setProductos(datos);
    } catch (error) {
      setMensaje(error.message || 'No fue posible cargar los productos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (esAdmin) cargarProductos();
  }, [esAdmin]);

  if (!usuario) return <Navigate to="/login" replace />;
  if (!esAdmin) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-5 text-center text-white">
        <p className="text-lg">No tienes permisos para acceder al panel de administración.</p>
      </main>
    );
  }

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const manejarArchivoSeleccionado = async (event) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagen(true);
    setMensaje('');
    try {
      const resultado = await subirImagenProducto(archivo);
      setFormulario((actual) => ({ ...actual, imagen_url: resultado.url }));
    } catch (error) {
      setMensaje(error.message || 'No fue posible subir la imagen.');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const iniciarEdicion = (producto) => {
    setEditandoId(producto.id);
    setFormulario({
      titulo: producto.titulo || '',
      descripcion: producto.descripcion || '',
      detalle: producto.detalle || '',
      categoria: producto.categoria || '',
      imagen_url: producto.imagen_url || '',
      precio: producto.precio || '',
      estado: producto.estado || 'Disponible',
    });
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario(formularioVacio);
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    if (!formulario.titulo.trim()) {
      setMensaje('El título es obligatorio.');
      return;
    }
    setEnviando(true);
    setMensaje('');
    try {
      if (editandoId) {
        await actualizarProducto(editandoId, formulario);
        setMensaje('Producto actualizado correctamente.');
      } else {
        await crearProducto(formulario);
        setMensaje('Producto creado correctamente.');
      }
      cancelarEdicion();
      cargarProductos();
    } catch (error) {
      setMensaje(error.message || 'No fue posible guardar el producto.');
    } finally {
      setEnviando(false);
    }
  };

  const manejarEliminar = async (producto) => {
    if (usuario.rol !== 'Administrador') {
      setMensaje('Solo un Administrador puede eliminar productos.');
      return;
    }
    if (!window.confirm(`¿Eliminar "${producto.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarProducto(producto.id);
      setMensaje('Producto eliminado.');
      cargarProductos();
    } catch (error) {
      setMensaje(error.message || 'No fue posible eliminar el producto.');
    }
  };

  return (
    <main className="mx-auto min-h-[80vh] max-w-6xl px-5 py-10 text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Panel interno</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Administrar productos</h1>
      <p className="mt-2 text-neutral-300">Agrega, edita o elimina los modelos que aparecen en el catálogo y el carrusel.</p>

      {mensaje && (
        <p className="mt-5 border-l-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] px-4 py-3 text-sm" aria-live="polite">
          {mensaje}
        </p>
      )}

      <form onSubmit={enviarFormulario} className="mt-6 grid gap-4 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 sm:grid-cols-2">
        <h2 className="sm:col-span-2 m-0 text-xl font-bold">{editandoId ? `Editando producto #${editandoId}` : 'Nuevo producto'}</h2>

        <label className="grid gap-1 text-sm">
          Título
          <input className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="titulo" value={formulario.titulo} onChange={actualizarCampo} placeholder="KTM Duke 390" required />
        </label>

        <label className="grid gap-1 text-sm">
          Categoría
          <select className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="categoria" value={formulario.categoria} onChange={actualizarCampo}>
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS_DISPONIBLES.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Descripción corta
          <input className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} placeholder="Frase corta para el catálogo" />
        </label>

        <label className="grid gap-1 text-sm">
          Precio
          <input className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="precio" type="number" min="0" step="0.01" value={formulario.precio} onChange={actualizarCampo} placeholder="0.00" />
        </label>

        <div className="grid gap-2 text-sm sm:col-span-2">
          <label className="grid gap-1">
            Imagen del producto
            <input
              type="file"
              accept="image/*"
              className="rounded border border-neutral-600 bg-black/40 px-3 py-2 text-neutral-200 file:mr-3 file:rounded file:border-0 file:bg-[var(--ktm-orange)] file:px-3 file:py-2 file:font-bold file:text-black"
              onChange={manejarArchivoSeleccionado}
              disabled={subiendoImagen}
            />
          </label>
          {subiendoImagen && <span className="text-xs text-neutral-400">Subiendo imagen...</span>}
          {formulario.imagen_url && !subiendoImagen && (
            <img src={formulario.imagen_url} alt="Vista previa" className="h-24 w-36 rounded object-cover border border-neutral-700" />
          )}

          <label className="grid gap-1">
            O pega una URL de imagen
            <input className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="imagen_url" value={formulario.imagen_url} onChange={actualizarCampo} placeholder="http://localhost:8000/images/moto1.jpg" />
          </label>
        </div>

        <label className="grid gap-1 text-sm sm:col-span-2">
          Detalle completo
          <textarea className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="detalle" value={formulario.detalle} onChange={actualizarCampo} rows={3} placeholder="Ficha técnica, motor, potencia, etc." />
        </label>

        <label className="grid gap-1 text-sm">
          Estado
          <select className="rounded border border-neutral-600 bg-black/40 px-3 py-2" name="estado" value={formulario.estado} onChange={actualizarCampo}>
            <option value="Disponible">Disponible</option>
            <option value="Agotado">Agotado</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </label>

        <div className="flex items-end gap-3 sm:col-span-2">
          <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black transition hover:bg-[var(--ktm-orange-dark)] disabled:opacity-60" type="submit" disabled={enviando || subiendoImagen}>
            {enviando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editandoId && (
            <button className="rounded border border-neutral-500 px-5 py-2.5 font-bold uppercase text-neutral-200" type="button" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-10 text-xl font-bold">Productos actuales</h2>
      {cargando ? (
        <p className="mt-4 text-neutral-300">Cargando productos...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-700">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--ktm-gray)] text-neutral-300">
                <th className="p-3">Foto</th>
                <th className="p-3">Título</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-t border-neutral-700">
                  <td className="p-3">
                    {producto.imagen_url ? (
                      <img src={producto.imagen_url} alt={producto.titulo} className="h-12 w-16 rounded object-cover" />
                    ) : (
                      <span className="text-neutral-500">Sin foto</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{producto.titulo}</td>
                  <td className="p-3 text-neutral-300">{producto.categoria || '—'}</td>
                  <td className="p-3 text-neutral-300">${Number(producto.precio || 0).toLocaleString('es-CO')}</td>
                  <td className="p-3 text-neutral-300">{producto.estado}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="rounded border border-[var(--ktm-orange)] px-3 py-1 text-xs font-bold uppercase text-[var(--ktm-orange)]" onClick={() => iniciarEdicion(producto)} type="button">
                        Editar
                      </button>
                      {usuario.rol === 'Administrador' && (
                        <button className="rounded border border-red-500 px-3 py-1 text-xs font-bold uppercase text-red-400" onClick={() => manejarEliminar(producto)} type="button">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-400" colSpan={6}>No hay productos todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Admin;
