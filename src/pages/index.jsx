import Carousel from '../components/carousel';
import Catalog from '../components/catalog';

function Index() {
  return (
    <div style={{ backgroundColor: 'var(--ktm-black)', minHeight: '80vh', padding: '30px 20px' }}>
      <h1
        style={{
          textAlign: 'center',
          marginTop: '10px',
          marginBottom: '5px',
          color: 'var(--ktm-white)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontSize: '2.2rem',
        }}
      >
        Catálogo <span style={{ color: 'var(--ktm-orange)' }}>KTM</span>
      </h1>
      <p
        style={{
          textAlign: 'center',
          color: '#ccc',
          maxWidth: '600px',
          margin: '0 auto 20px',
        }}
      >
        Ready to Race. Descubre nuestra línea de motocicletas naranjas, hechas
        para dominar la ciudad y el terreno.
      </p>
      <Carousel />
      <Catalog />
    </div>
  );
}

export default Index;