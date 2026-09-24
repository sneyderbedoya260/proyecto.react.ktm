import { getToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function mensajeError(data) {
  if (data?.detail?.mensaje) return data.detail.mensaje;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) return data.detail.map((e) => e.msg).filter(Boolean).join(' ');
  return data?.mensaje || 'Error en la solicitud.';
}

// Cliente HTTP centralizado: agrega la URL base, el token y el manejo de errores.
export async function apiRequest(endpoint, { autenticado = true, ...options } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (autenticado) headers.Authorization = `Bearer ${getToken()}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(mensajeError(data));
  return data;
}

// Para descargas (PDF/Excel): devuelve un Blob y dispara la descarga.
export async function apiDescargar(endpoint, nombreArchivo) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(mensajeError(data));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function query(filtros = {}) {
  const p = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

export { query };
