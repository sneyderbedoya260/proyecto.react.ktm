import { useContenido } from '../context/ContenidoContext';

function Contacto() {
  const { contenido } = useContenido();

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--ktm-black)', minHeight: '80vh', color: 'var(--ktm-white)' }}>
      <h1 style={{ color: 'var(--ktm-orange)', textTransform: 'uppercase', letterSpacing: '1px' }}>Contacto</h1>
      <div
        style={{
          display: 'inline-block', textAlign: 'left', marginTop: '20px', padding: '25px 35px',
          border: '1px solid rgba(255,102,0,0.5)', borderRadius: '12px', backgroundColor: '#141414',
        }}
      >
        <p style={{ margin: '10px 0' }}>
          <strong style={{ color: 'var(--ktm-orange)' }}>Correo:</strong> {contenido.contacto_email || 'contacto@ktmcatalogo.com'}
        </p>
        <p style={{ margin: '10px 0' }}>
          <strong style={{ color: 'var(--ktm-orange)' }}>Teléfono:</strong> {contenido.contacto_telefono || '+57 300 000 0000'}
        </p>
        <p style={{ margin: '10px 0' }}>
          <strong style={{ color: 'var(--ktm-orange)' }}>Dirección:</strong> {contenido.contacto_direccion || 'Medellín, Colombia'}
        </p>
      </div>
    </div>
  );
}

export default Contacto;
