import { apiRequest, query } from './apiClient';

export const listarPqr = (filtros) => apiRequest(`/pqr${query(filtros)}`);
export const crearPqr = (pqr) => apiRequest('/pqr', { method: 'POST', body: JSON.stringify(pqr) });
export const responderPqr = (id, datos) => apiRequest(`/pqr/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
