import './footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <p className="footer-kicker">KTM</p>
          <h3>Catálogo oficial</h3>
          <p>
            Descubre la moto perfecta para tu estilo, ya sea ciudad, aventura o pista.
          </p>
        </div>

        <div className="footer-contact">
          <h4>Contacto</h4>
          <ul>
            <li>📩 contacto@ktmcatalogo.com</li>
            <li>📞 +57 300 000 0000</li>
            <li>📍 Medellín, Colombia</li>
          </ul>
        </div>

        <div className="footer-whatsapp">
          <h4>¿Quieres asesoría?</h4>
          <a
            href="https://wa.me/573000000000?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20modelos%20KTM"
            target="_blank"
            rel="noreferrer"
            className="whatsapp-button"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} <span>KTM Catálogo</span>. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;