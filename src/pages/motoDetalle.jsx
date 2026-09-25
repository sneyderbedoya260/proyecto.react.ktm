import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getMotoById, getMotos } from '../services/motoService';
import { obtenerFicha } from '../data/fichasTecnicas';
import './motoDetalle.css';

function MotoDetalle() {
  const { id } = useParams();
  const [moto, setMoto] = useState(undefined);
  const [todas, setTodas] = useState([]);
  const [colorActivo, setColorActivo] = useState(0);

  useEffect(() => {
    let activo = true;
    setMoto(undefined);
    setColorActivo(0);
    getMotoById(id).then((r) => { if (activo) setMoto(r); });
    getMotos().then((r) => { if (activo) setTodas(r); });
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => { activo = false; };
  }, [id]);

  const ficha = useMemo(() => (moto ? obtenerFicha(moto.titulo) : null), [moto]);
  // El configurador de color solo se muestra si el modelo tiene varias FOTOS
  // reales (cada color con su propia imagen). Sin ellas, no se inventan variantes.
  const colores = ficha && Array.isArray(ficha.colores) && ficha.colores.length ? ficha.colores : null;
  const tieneConfigurador = colores && colores.length > 1;
  const color = colores ? colores[Math.min(colorActivo, colores.length - 1)] : null;
  const imagenActiva = (color && color.imagen) || (moto && moto.imagen);

  const relacionados = useMemo(
    () => {
      if (!moto) return [];
      const otros = todas.filter((m) => String(m.id) !== String(moto.id));
      const misma = otros.filter((m) => (m.categoria || '').toLowerCase() === (moto.categoria || '').toLowerCase());
      return [...misma, ...otros.filter((m) => !misma.includes(m))].slice(0, 4);
    },
    [moto, todas],
  );

  if (moto === undefined) return <main className="md-state">Cargando modelo...</main>;
  if (!moto) {
    return (
      <main className="md-state">
        <h1>Modelo no encontrado</h1>
        <Link className="md-back-link" to="/">Volver al catálogo</Link>
      </main>
    );
  }

  const descripcion = ficha ? ficha.descripcion : moto.detalle || moto.descripcion;

  return (
    <main className="md">
      <Link className="md-back" to="/">← Volver al catálogo</Link>

      {/* HERO + CONFIGURADOR */}
      <section className="md-hero">
        <div className="md-hero-head">
          <span className="md-cat">{moto.categoria}</span>
          <h1 className="md-title">{moto.titulo}</h1>
          {ficha && <p className="md-tagline">{ficha.subtitulo}</p>}
        </div>

        <div className="md-stage">
          <div className="md-stage-glow" aria-hidden="true" />
          <img
            src={imagenActiva}
            alt={color ? `${moto.titulo} — ${color.nombre}` : moto.titulo}
            className="md-stage-img"
          />
          {moto.estado && moto.estado !== 'Disponible' && (
            <span className="md-estado">{moto.estado}</span>
          )}
        </div>

        {tieneConfigurador && (
          <div className="md-config">
            <p className="md-config-label">
              Configurador · Color <strong>{color.nombre}</strong>
            </p>
            <div className="md-swatches">
              {colores.map((c, i) => (
                <button
                  key={c.nombre}
                  type="button"
                  className={`md-swatch ${i === colorActivo ? 'is-active' : ''}`}
                  style={{ '--sw': c.hex }}
                  onClick={() => setColorActivo(i)}
                  aria-label={c.nombre}
                  aria-pressed={i === colorActivo}
                  title={c.nombre}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* DESCRIPCIÓN */}
      <section className="md-block">
        <p className="md-kicker">El modelo</p>
        <h2 className="md-block-title">{moto.descripcion || 'Carácter KTM'}</h2>
        <p className="md-lead">{descripcion}</p>
      </section>

      {/* FICHA TÉCNICA */}
      {ficha && (
        <section className="md-specs">
          <div className="md-specs-head">
            <p className="md-kicker">Ficha técnica</p>
            <h2 className="md-block-title">Detalles técnicos</h2>
          </div>
          <div className="md-specs-groups">
            {Object.entries(ficha.specs).map(([grupo, items]) => (
              <div className="md-spec-group" key={grupo}>
                <h3>{grupo}</h3>
                <ul>
                  {items.map((it) => (
                    <li key={it.e}>
                      <span className="md-spec-e">{it.e}</span>
                      <span className="md-spec-v">{it.v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RELACIONADOS */}
      {relacionados.length > 0 && (
        <section className="md-related">
          <div className="md-related-head">
            <p className="md-kicker">Explora más</p>
            <h2 className="md-block-title">Otros modelos</h2>
          </div>
          <div className="md-related-grid">
            {relacionados.map((m) => (
              <Link key={m.id} to={`/motos/${m.id}`} className="md-related-card">
                <div className="md-related-img">
                  <img src={m.imagen || m.imagen_url} alt={m.titulo} />
                </div>
                <div className="md-related-body">
                  <span className="md-related-cat">{m.categoria}</span>
                  <h3>{m.titulo}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default MotoDetalle;
