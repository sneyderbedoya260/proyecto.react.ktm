import { useContenido } from '../context/ContenidoContext';

function QuienesSomos() {
  const { contenido } = useContenido();
  const parrafos = (contenido.quienes_texto || '').split('\n\n').filter(Boolean);

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--ktm-black)', minHeight: '80vh', color: 'var(--ktm-white)' }}>
      <h1 style={{ color: 'var(--ktm-orange)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {contenido.quienes_titulo || '¿Quiénes Somos?'}
      </h1>
      {parrafos.length ? (
        parrafos.map((p, i) => (
          <p key={i} style={{ maxWidth: '650px', margin: '20px auto', color: '#ddd', lineHeight: 1.7 }}>{p}</p>
        ))
      ) : (
        <p style={{ maxWidth: '650px', margin: '20px auto', color: '#ddd', lineHeight: 1.7 }}>
          Somos un catálogo especializado en motocicletas KTM.
        </p>
      )}
    </div>
  );
}

export default QuienesSomos;
