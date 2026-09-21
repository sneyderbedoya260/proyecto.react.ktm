function Contacto() {
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
        Contacto
      </h1>
      <div
        style={{
          display: 'inline-block',
          textAlign: 'left',
          marginTop: '20px',
          padding: '25px 35px',
          border: '2px solid var(--ktm-orange)',
          borderRadius: '10px',
          backgroundColor: '#141414',
        }}
      >
        <p style={{ margin: '8px 0' }}>
          <strong style={{ color: 'var(--ktm-orange)' }}>Correo:</strong> contacto@ktmcatalogo.com
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong style={{ color: 'var(--ktm-orange)' }}>Teléfono:</strong> +57 300 000 0000
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong style={{ color: 'var(--ktm-orange)' }}>Dirección:</strong> Concesionario ktm autocolombiana-medellin 
        </p>
      </div>
    </div>
  );
}

export default Contacto;