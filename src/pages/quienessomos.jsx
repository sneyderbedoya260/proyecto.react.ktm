function QuienesSomos() {
  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        backgroundColor: 'var(--ktm-black)',
        minHeight: '80vh',
        color: 'var(--ktm-white)',
      }}
    >
      <h1
        style={{
          color: 'var(--ktm-orange)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        ¿Quiénes Somos?
      </h1>
      <p style={{ maxWidth: '650px', margin: '20px auto', color: '#ddd', lineHeight: 1.6 }}>
        Somos un catálogo especializado en motocicletas <strong style={{ color: 'var(--ktm-orange)' }}>KTM</strong>,
        la marca austriaca sinónimo de rendimiento, tecnología y espíritu
        "Ready to Race". Ofrecemos un espacio digital donde explorar el
        rango completo de modelos KTM, desde naked urbanas hasta motos de
        aventura y enduro.
      </p>
      <p style={{ maxWidth: '650px', margin: '0 auto', color: '#ddd', lineHeight: 1.6 }}>
        Nuestro compromiso es acercarte la pasión naranja con información
        clara, imágenes reales y una experiencia moderna.
      </p>
    </div>
  );
}

export default QuienesSomos;