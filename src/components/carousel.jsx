import { useEffect, useState } from 'react';
import { getMotos } from '../services/motoService';
import './carousel.css';

function Carousel() {
  const [motos, setMotos] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    getMotos().then(setMotos);
  }, []);

  useEffect(() => {
    if (pausado || motos.length < 2) return undefined;

    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % motos.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [motos.length, pausado]);

  if (motos.length === 0) return <div className="carousel-state">Cargando modelos...</div>;

  const anterior = () => {
    setIndiceActual((prev) =>
      prev === 0 ? motos.length - 1 : prev - 1
    );
  };

  const siguiente = () => {
    setIndiceActual((prev) =>
      prev === motos.length - 1 ? 0 : prev + 1
    );
  };

  const slideActual = motos[indiceActual];

  return (
    <div
      className="carousel mx-auto max-w-5xl"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPausado(false);
      }}
    >
      <button aria-label="Motocicleta anterior" className="carousel-btn carousel-btn-left rounded-full shadow-lg transition hover:shadow-orange-500/30" onClick={anterior}>
        ‹
      </button>

      <div className="carousel-slide rounded-xl border-2 border-[var(--ktm-orange)] shadow-2xl shadow-orange-950/30">
        <img
          src={slideActual.imagen}
          alt={slideActual.titulo}
          className="carousel-img h-[clamp(280px,48vw,500px)] object-cover"
        />
        <div className="carousel-caption bg-gradient-to-t from-black/95 via-black/70 to-transparent" aria-live="polite">
          <h3>{slideActual.titulo}</h3>
          <p>{slideActual.descripcion}</p>
        </div>
      </div>

      <button aria-label="Motocicleta siguiente" className="carousel-btn carousel-btn-right rounded-full shadow-lg transition hover:shadow-orange-500/30" onClick={siguiente}>
        ›
      </button>

      <div className="carousel-dots flex justify-center gap-1" role="tablist" aria-label="Seleccionar motocicleta">
        {motos.map((modelo, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Mostrar ${modelo.titulo}`}
            className={`dot ${i === indiceActual ? 'active' : ''}`}
            onClick={() => setIndiceActual(i)}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default Carousel;