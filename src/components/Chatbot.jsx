import { useEffect, useRef, useState } from 'react';
import { enviarMensajeChat } from '../services/chatbotService';
import './chatbot.css';

const MENSAJE_BIENVENIDA = {
  rol: 'bot',
  texto: '¡Hola! Soy KTM Bot 🏍️ Pregúntame por cualquier modelo del catálogo o dime qué uso le vas a dar y te oriento.',
};

function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (abierto) {
      finRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [mensajes, abierto]);

  const enviar = async (event) => {
    event.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;

    const historial = mensajes.filter((m) => m !== MENSAJE_BIENVENIDA);
    const nuevoUsuario = { rol: 'usuario', texto: limpio };
    setMensajes((actual) => [...actual, nuevoUsuario]);
    setTexto('');
    setEnviando(true);

    try {
      const respuesta = await enviarMensajeChat(limpio, [...historial, nuevoUsuario]);
      setMensajes((actual) => [...actual, { rol: 'bot', texto: respuesta }]);
    } catch (error) {
      setMensajes((actual) => [
        ...actual,
        { rol: 'bot', texto: error.message || 'No pude responder en este momento. Intenta de nuevo.', error: true },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="chatbot">
      {abierto && (
        <section className="chatbot-panel" role="dialog" aria-label="Asistente KTM">
          <header className="chatbot-header">
            <div>
              <p className="chatbot-header-titulo">KTM Bot</p>
              <p className="chatbot-header-estado">Asistente del catálogo</p>
            </div>
            <button className="chatbot-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar chat" type="button">
              ✕
            </button>
          </header>

          <div className="chatbot-mensajes">
            {mensajes.map((mensaje, indice) => (
              <div
                key={indice}
                className={`chatbot-burbuja ${mensaje.rol === 'usuario' ? 'es-usuario' : 'es-bot'} ${
                  mensaje.error ? 'es-error' : ''
                }`}
              >
                {mensaje.texto}
              </div>
            ))}
            {enviando && (
              <div className="chatbot-burbuja es-bot chatbot-escribiendo" aria-live="polite">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form className="chatbot-form" onSubmit={enviar}>
            <input
              ref={inputRef}
              className="chatbot-input"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta..."
              maxLength={600}
              aria-label="Mensaje para el asistente"
            />
            <button className="chatbot-enviar" type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar">
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        className="chatbot-boton"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={abierto}
        type="button"
      >
        {abierto ? '✕' : '💬'}
      </button>
    </div>
  );
}

export default Chatbot;
