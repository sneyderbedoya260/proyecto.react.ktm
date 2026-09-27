import Carousel from '../components/carousel';
import Catalog from '../components/catalog';
import { useContenido } from '../context/ContenidoContext';
import './index.css';

// Resalta la palabra "KTM" del título en color naranja.
function tituloConMarca(texto) {
  const partes = (texto || 'Catálogo KTM').split(/(KTM)/g);
  return partes.map((p, i) => (p === 'KTM' ? <span key={i}>{p}</span> : p));
}

function Index() {
  const { contenido } = useContenido();

  return (
    <div className="home">
      <section className="hero">
        <p className="hero-kicker">{contenido.home_kicker || 'Ready to Race'}</p>
        <h1 className="hero-title">{tituloConMarca(contenido.home_titulo)}</h1>
        <p className="hero-subtitle">
          {contenido.home_subtitulo ||
            'Descubre nuestra línea de motocicletas de alta gama, diseñadas para dominar la ciudad, la carretera y el terreno.'}
        </p>
      </section>
      <Carousel />
      <Catalog />
    </div>
  );
}

export default Index;