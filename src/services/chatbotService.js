const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function enviarMensajeChat(mensaje, historial) {
  const response = await fetch(`${API_URL}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Solo mandamos rol y texto: es lo único que el backend necesita.
    body: JSON.stringify({
      mensaje,
      historial: historial.map(({ rol, texto }) => ({ rol, texto })),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail?.mensaje || data?.mensaje || 'El asistente no está disponible.');
  }
  return data.respuesta;
}
