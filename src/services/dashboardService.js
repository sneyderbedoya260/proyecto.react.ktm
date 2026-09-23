import { getToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function solicitar(ruta) {
  const response = await fetch(`${API_URL}${ruta}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.mensaje || 'No fue posible cargar la información del dashboard.');
  }
  return data;
}

export function getResumenDashboard() {
  return solicitar('/dashboard/resumen');
}

export function getFiltrosDashboard() {
  return solicitar('/dashboard/filtros');
}

export function getCatalogoDashboard(filtros = {}) {
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) {
      parametros.append(clave, valor);
    }
  });
  const query = parametros.toString();
  return solicitar(`/dashboard/catalogo${query ? `?${query}` : ''}`);
}
