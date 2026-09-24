import { apiRequest, apiDescargar, query } from './apiClient';

export const listarFacturas = (filtros) => apiRequest(`/facturas${query(filtros)}`);
export const generarFactura = (ventaId) => apiRequest(`/facturas/generar/${ventaId}`, { method: 'POST' });
export const descargarFactura = (id, numero) => apiDescargar(`/facturas/${id}/descargar`, `${numero || 'factura'}.pdf`);
