import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listarProductosAdmin, crearProducto, actualizarProducto, eliminarProducto, subirImagenesProducto } from '../../services/productService';
import { CATEGORIAS_DISPONIBLES } from '../../data/categorias';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2';
const datosVacios = { titulo: '', descripcion: '', detalle: '', categoria: '', precio: '', estado: 'Disponible' };

function AdminProductos() {
  const { usuario } = useAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(datosVacios);
  const [imagenes, setImagenes] = useState([]); // lista de URLs (la primera es la portada)
  const [urlManual, setUrlManual] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      setProductos(await listarProductosAdmin());
    } catch (error) {
      setMensaje(error.message || 'No fue posible cargar los productos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarProductos(); }, []);

  const actualizarCampo = (e) => {
    const { name, value } = e.target;
    setFormulario((a) => ({ ...a, [name]: value }));
  };

  const manejarArchivos = async (e) => {
    const archivos = e.target.files;
    if (!archivos || !archivos.length) return;
    setSubiendo(true);
    setMensaje('');
    try {
      const resultado = await subirImagenesProducto(archivos);
      setImagenes((a) => [...a, ...(resultado.urls || [])]);
    } catch (error) {
      setMensaje(error.message || 'No fue posible subir las imágenes.');
    } finally {
      setSubiendo(false);
      e.target.value = ''; // permite volver a elegir los mismos archivos
    }
  };

  const agregarUrl = () => {
    const u = urlManual.trim();
    if (u) { setImagenes((a) => [...a, u]); setUrlManual(''); }
  };

  const quitarImagen = (i) => setImagenes((a) => a.filter((_, idx) => idx !== i));
  const hacerPortada = (i) => setImagenes((a) => [a[i], ...a.filter((_, idx) => idx !== i)]);

  const iniciarEdicion = (p) => {
    setEditandoId(p.id);
    setFormulario({
      titulo: p.titulo || '', descripcion: p.descripcion || '', detalle: p.detalle || '',
      categoria: p.categoria || '', precio: p.precio || '', estado: p.estado || 'Disponible',
    });
    // Galería: portada + extras (sin duplicar la portada).
    const galeria = Array.isArray(p.galeria) ? p.galeria : [];
    const todas = [p.imagen_url, ...galeria].filter(Boolean);
    setImagenes([...new Set(todas)]);
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => { setEditandoId(null); setFormulario(datosVacios); setImagenes([]); setUrlManual(''); };

  const enviarFormulario = async (e) => {
    e.preventDefault();
    if (!formulario.titulo.trim()) { setMensaje('El título es obligatorio.'); return; }
    if (!imagenes.length) { setMensaje('Agrega al menos una imagen.'); return; }
    setEnviando(true);
    setMensaje('');
    const payload = { ...formulario, imagen_url: imagenes[0], galeria: imagenes };
    try {
      if (editandoId) {
        await actualizarProducto(editandoId, payload);
        setMensaje('Producto actualizado correctamente.');
      } else {
        await crearProducto(payload);
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

  const manejarEliminar = async (p) => {
    if (usuario.rol !== 'Administrador') { setMensaje('Solo un Administrador puede eliminar productos.'); return; }
    if (!window.confirm(`¿Eliminar "${p.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarProducto(p.id);
      setMensaje('Producto eliminado.');
      cargarProductos();
    } catch (error) {
      setMensaje(error.message || 'No fue posible eliminar el producto.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Catálogo</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Administrar productos</h1>
      <p className="mt-2 text-neutral-300">Agrega, edita o elimina los modelos. Puedes subir varias fotos por modelo.</p>

      {mensaje && <p className="mt-5 border-l-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] px-4 py-3 text-sm" aria-live="polite">{mensaje}</p>}

      <form onSubmit={enviarFormulario} className="mt-6 grid gap-4 rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6 sm:grid-cols-2">
        <h2 className="sm:col-span-2 m-0 text-xl font-bold">{editandoId ? `Editando producto #${editandoId}` : 'Nuevo producto'}</h2>
        <label className="grid gap-1 text-sm">Título
          <input className={inp} name="titulo" value={formulario.titulo} onChange={actualizarCampo} placeholder="KTM Duke 390" required />
        </label>
        <label className="grid gap-1 text-sm">Categoría
          <select className={inp} name="categoria" value={formulario.categoria} onChange={actualizarCampo}>
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS_DISPONIBLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">Descripción corta
          <input className={inp} name="descripcion" value={formulario.descripcion} onChange={actualizarCampo} placeholder="Frase corta para el catálogo" />
        </label>
        <label className="grid gap-1 text-sm">Precio
          <input className={inp} name="precio" type="number" min="0" step="0.01" value={formulario.precio} onChange={actualizarCampo} placeholder="0.00" />
        </label>

        {/* Galería de imágenes */}
        <div className="grid gap-2 text-sm sm:col-span-2">
          <label className="grid gap-1">Imágenes del producto (puedes elegir varias)
            <input type="file" accept="image/*" multiple
              className="rounded border border-neutral-600 bg-black/40 px-3 py-2 text-neutral-200 file:mr-3 file:rounded file:border-0 file:bg-[var(--ktm-orange)] file:px-3 file:py-2 file:font-bold file:text-black"
              onChange={manejarArchivos} disabled={subiendo} />
          </label>
          {subiendo && <span className="text-xs text-neutral-400">Subiendo imágenes...</span>}

          {imagenes.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagenes.map((url, i) => (
                <div key={url + i} className="relative">
                  <img src={url} alt={`imagen ${i + 1}`} className={`h-24 w-32 rounded object-cover border ${i === 0 ? 'border-[var(--ktm-orange)]' : 'border-neutral-700'}`} />
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-[var(--ktm-orange)] px-1.5 py-0.5 text-[10px] font-bold text-black">PORTADA</span>}
                  <button type="button" onClick={() => quitarImagen(i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white" aria-label="Quitar">✕</button>
                  {i !== 0 && <button type="button" onClick={() => hacerPortada(i)} className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">Portada</button>}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input className={`${inp} flex-1`} value={urlManual} onChange={(e) => setUrlManual(e.target.value)} placeholder="O pega una URL de imagen y agrégala" />
            <button type="button" onClick={agregarUrl} className="rounded border border-neutral-500 px-4 text-sm font-bold uppercase text-neutral-200">Agregar</button>
          </div>
        </div>

        <label className="grid gap-1 text-sm sm:col-span-2">Detalle completo
          <textarea className={inp} name="detalle" value={formulario.detalle} onChange={actualizarCampo} rows={3} placeholder="Ficha técnica, motor, potencia, etc." />
        </label>
        <label className="grid gap-1 text-sm">Estado
          <select className={inp} name="estado" value={formulario.estado} onChange={actualizarCampo}>
            <option value="Disponible">Disponible</option>
            <option value="Agotado">Agotado</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </label>
        <div className="flex items-end gap-3 sm:col-span-2">
          <button className="rounded bg-[var(--ktm-orange)] px-5 py-2.5 font-extrabold uppercase text-black transition hover:bg-[var(--ktm-orange-dark)] disabled:opacity-60" type="submit" disabled={enviando || subiendo}>
            {enviando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editandoId && <button className="rounded border border-neutral-500 px-5 py-2.5 font-bold uppercase text-neutral-200" type="button" onClick={cancelarEdicion}>Cancelar</button>}
        </div>
      </form>

      <h2 className="mt-10 text-xl font-bold">Productos actuales</h2>
      {cargando ? <p className="mt-4 text-neutral-300">Cargando productos...</p> : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-700">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--ktm-gray)] text-neutral-300">
                <th className="p-3">Foto</th><th className="p-3">Título</th><th className="p-3">Fotos</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3">Estado</th><th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-t border-neutral-700">
                  <td className="p-3">{p.imagen_url ? <img src={p.imagen_url} alt={p.titulo} className="h-12 w-16 rounded object-cover" /> : <span className="text-neutral-500">Sin foto</span>}</td>
                  <td className="p-3 font-semibold">{p.titulo}</td>
                  <td className="p-3 text-neutral-300">{1 + (Array.isArray(p.galeria) ? p.galeria.filter((g) => g !== p.imagen_url).length : 0)}</td>
                  <td className="p-3 text-neutral-300">{p.categoria || '—'}</td>
                  <td className="p-3 text-neutral-300">${Number(p.precio || 0).toLocaleString('es-CO')}</td>
                  <td className="p-3 text-neutral-300">{p.estado}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="rounded border border-[var(--ktm-orange)] px-3 py-1 text-xs font-bold uppercase text-[var(--ktm-orange)]" onClick={() => iniciarEdicion(p)} type="button">Editar</button>
                      {usuario.rol === 'Administrador' && <button className="rounded border border-red-500 px-3 py-1 text-xs font-bold uppercase text-red-400" onClick={() => manejarEliminar(p)} type="button">Eliminar</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && <tr><td className="p-4 text-center text-neutral-400" colSpan={7}>No hay productos todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminProductos;
