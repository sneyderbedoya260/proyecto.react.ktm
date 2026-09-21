import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMotos } from '../services/motoService';
import { CATEGORIAS_DISPONIBLES, CATEGORIA_TODAS } from '../data/categorias';
import './catalog.css';

const HOVER_DELAY = 800;

function Catalog() {
  const [motos, setMotos] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIA_TODAS);
  const hoverTimer = useRef(null);

  useEffect(() => {
    getMotos().then(setMotos);
  }, []);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const motosFiltradas = categoriaActiva === CATEGORIA_TODAS
    ? motos
    : motos.filter((modelo) => String(modelo.categoria || '').toLowerCase() === String(categoriaActiva).toLowerCase());

  const handleEnter = (id) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setFocusedId(id), HOVER_DELAY);
  };

  const handleLeave = () => {
    clearTimeout(hoverTimer.current);
    setFocusedId(null);
  };

  return (
    <section className="catalog" aria-labelledby="catalog-title">
      <div className={`catalog-focus-overlay ${focusedId ? 'is-active' : ''}`} aria-hidden="true" />

      <div className="catalog-heading">
        <p className="catalog-kicker">Ready to Race</p>
        <h2 id="catalog-title">Todos los modelos</h2>
        <p>Encuentra la KTM que va con tu próxima aventura.</p>
      </div>

      <div className="catalog-filters" aria-label="Filtros de categoría">
        <button
          type="button"
          className={`catalog-filter ${categoriaActiva === CATEGORIA_TODAS ? 'is-active' : ''}`}
          onClick={() => setCategoriaActiva(CATEGORIA_TODAS)}
        >
          {CATEGORIA_TODAS}
        </button>
        {CATEGORIAS_DISPONIBLES.map((categoria) => (
          <button
            key={categoria.value}
            type="button"
            className={`catalog-filter ${categoriaActiva === categoria.value ? 'is-active' : ''}`}
            onClick={() => setCategoriaActiva(categoria.value)}
          >
            {categoria.label}
          </button>
        ))}
      </div>

      <div className={`catalog-grid ${focusedId ? 'has-focus' : ''}`}>
        {motosFiltradas.map((modelo, indice) => {
          const isFocused = focusedId === modelo.id;
          const isDimmed = focusedId !== null && !isFocused;

          return (
            <article
              className={`catalog-card ${isFocused ? 'is-focused' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
              key={modelo.id}
              onMouseEnter={() => handleEnter(modelo.id)}
              onMouseLeave={handleLeave}
              onFocus={() => handleEnter(modelo.id)}
              onBlur={handleLeave}
            >
              <div className="catalog-image-wrap">
                <img
                  src={modelo.imagen}
                  alt={modelo.titulo}
                  className="catalog-image"
                  loading={indice > 3 ? 'lazy' : 'eager'}
                />
                <span className="catalog-image-fade" aria-hidden="true" />
                <span className="catalog-number">{String(indice + 1).padStart(2, '0')}</span>
              </div>
              <div className="catalog-card-content">
                <h3>{modelo.titulo}</h3>
                <p>{modelo.descripcion}</p>
                <Link to={`/motos/${modelo.id}`} className="catalog-link">
                  Ver modelo <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {motosFiltradas.length === 0 && (
        <p className="catalog-empty">No hay modelos disponibles en esta categoría.</p>
      )}
    </section>
  );
}

export default Catalog;