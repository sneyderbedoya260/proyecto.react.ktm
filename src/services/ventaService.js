import { apiRequest, query } from './apiClient';

export const listarVentas = (filtros) => apiRequest(`/ventas${query(filtros)}`);
export const obtenerVenta = (id) => apiRequest(`/ventas/${id}`);
export const crearVenta = (venta) => apiRequest('/ventas', { method: 'POST', body: JSON.stringify(venta) });
export const cambiarEstadoVenta = (id, estado) =>
  apiRequest(`/ventas/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) });
