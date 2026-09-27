import { apiRequest } from './apiClient';

export const getContenido = () => apiRequest('/contenido', { autenticado: false });
export const guardarContenido = (datos) =>
  apiRequest('/contenido', { method: 'PUT', body: JSON.stringify(datos) });
