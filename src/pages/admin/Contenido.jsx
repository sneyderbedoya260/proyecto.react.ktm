import { useEffect, useState } from 'react';
import { getContenido, guardarContenido } from '../../services/contenidoService';
import { useContenido } from '../../context/ContenidoContext';

const inp = 'rounded border border-neutral-600 bg-black/40 px-3 py-2 text-sm';

// Definición de los campos editables, agrupados por sección.
const GRUPOS = [
  {
    titulo: 'Portada (inicio)',
    campos: [
      { k: 'home_kicker', label: 'Etiqueta superior', tipo: 'text' },
      { k: 'home_titulo', label: 'Título (usa la palabra KTM para resaltarla)', tipo: 'text' },
      { k: 'home_subtitulo', label: 'Subtítulo', tipo: 'area' },
    ],
  },
  {
    titulo: 'Quiénes somos',
    campos: [
      { k: 'quienes_titulo', label: 'Título', tipo: 'text' },
      { k: 'quienes_texto', label: 'Texto (separa párrafos con una línea en blanco)', tipo: 'area', filas: 6 },
    ],
  },
  {
    titulo: 'Contacto',
    campos: [
      { k: 'contacto_email', label: 'Correo', tipo: 'text' },
      { k: 'contacto_telefono', label: 'Teléfono', tipo: 'text' },
      { k: 'contacto_direccion', label: 'Dirección', tipo: 'text' },
      { k: 'contacto_whatsapp', label: 'WhatsApp (solo números, con indicativo)', tipo: 'text' },
    ],
  },
  {
    titulo: 'Pie de página',
    campos: [
      { k: 'footer_titulo', label: 'Título', tipo: 'text' },
      { k: 'footer_texto', label: 'Texto', tipo: 'area' },
    ],
  },
];

function AdminContenido() {
  const { recargar } = useContenido();
  const [valores, setValores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getContenido()
      .then((d) => setValores(d))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const actualizar = (k, v) => setValores((a) => ({ ...a, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje(''); setError(''); setEnviando(true);
    try {
      await guardarContenido(valores);
      await recargar(); // refresca el contenido en todo el sitio
      setMensaje('Contenido guardado. Los cambios ya se ven en el sitio.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <p className="text-neutral-300">Cargando contenido...</p>;

  return (
    <div className="mx-auto max-w-3xl text-white">
      <p className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-[var(--ktm-orange)]">Administración</p>
      <h1 className="m-0 text-3xl font-extrabold uppercase">Contenido del sitio</h1>
      <p className="mt-2 text-neutral-300">Edita los textos y datos de contacto que aparecen en la página pública.</p>

      {mensaje && <p className="mt-5 border-l-4 border-green-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm">{mensaje}</p>}
      {error && <p className="mt-5 border-l-4 border-red-500 bg-[var(--ktm-gray)] px-4 py-3 text-sm text-red-300">{error}</p>}

      <form onSubmit={guardar} className="mt-6 grid gap-6">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo} className="rounded-lg border-t-4 border-[var(--ktm-orange)] bg-[var(--ktm-gray)] p-6">
            <h2 className="m-0 mb-4 text-lg font-bold uppercase">{grupo.titulo}</h2>
            <div className="grid gap-4">
              {grupo.campos.map((c) => (
                <label key={c.k} className="grid gap-1 text-sm">
                  {c.label}
                  {c.tipo === 'area' ? (
                    <textarea className={inp} rows={c.filas || 3} value={valores[c.k] || ''} onChange={(e) => actualizar(c.k, e.target.value)} />
                  ) : (
                    <input className={inp} value={valores[c.k] || ''} onChange={(e) => actualizar(c.k, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div>
          <button className="rounded bg-[var(--ktm-orange)] px-6 py-3 font-extrabold uppercase text-black transition hover:bg-[var(--ktm-orange-dark)] disabled:opacity-60" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminContenido;
