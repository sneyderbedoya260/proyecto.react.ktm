import Carousel from '../components/carousel';
import Catalog from '../components/catalog';
import './index.css';

function Index() {
  return (
    <div className="home">
      <section className="hero">
        <p className="hero-kicker">Ready to Race</p>
        <h1 className="hero-title">
          Catálogo <span>KTM</span>
        </h1>
        <p className="hero-subtitle">
          Descubre nuestra línea de motocicletas de alta gama, diseñadas para
          dominar la ciudad, la carretera y el terreno.
        </p>
      </section>
      <Carousel />
      <Catalog />
    </div>
  );
}

export default Index;