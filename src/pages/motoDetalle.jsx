import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMotoById } from '../services/motoService';
import carouselData from '../components/carouselData';
import './motoDetalle.css';

function MotoDetalle() {
  const { id } = useParams();
  const [moto, setMoto] = useState(undefined);

  useEffect(() => {
    let activo = true;
    getMotoById(id).then((resultado) => {
      if (activo) setMoto(resultado);
    });
    return () => { activo = false; };
  }, [id]);

  const modelosRelacionados = carouselData
    .filter((modelo) => String(modelo.id) !== String(id))
    .slice(0, 4);

  if (moto === undefined) {
    return <main className="moto-state">Cargando modelo...</main>;
  }

  if (!moto) {
    return (
      <main className="moto-state">
        <h1>Modelo no encontrado</h1>
        <Link to="/">Volver al catálogo</Link>
      </main>
    );
  }

  return (
    <main className="moto-detail">
      <Link className="moto-back" to="/">← Volver al catálogo</Link>
      <div className="moto-detail-grid">
        <div className="moto-detail-image-wrap">
          <img src={moto.imagen} alt={moto.titulo} className="moto-detail-image" />
        </div>
        <div className="moto-detail-content">
          <span className="moto-detail-category">{moto.categoria}</span>
          <h1>{moto.titulo}</h1>
          <p className="moto-detail-summary">{moto.descripcion}</p>
          <div className="moto-detail-line" />
          <h2>Descripción</h2>
          <p>{moto.detalle}</p>
          <p className="moto-detail-note">Aquí podrás añadir especificaciones, precio y disponibilidad.</p>
        </div>
      </div>

      <section className="related-section">
        <div className="related-header">
          <p className="related-kicker">KTM</p>
          <h2>Te puede gustar</h2>
        </div>

        <div className="related-grid">
          {modelosRelacionados.map((modelo) => (
            <Link key={modelo.id} to={`/motos/${modelo.id}`} className="related-card">
              <img src={modelo.imagen} alt={modelo.titulo} />
              <div className="related-card-body">
                <span className="related-label">Catálogo principal</span>
                <h3>{modelo.titulo}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MotoDetalle;
