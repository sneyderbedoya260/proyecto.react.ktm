import { getToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || 'Error en la solicitud.');
  return data;
}

export async function listarProductosAdmin() {
  const response = await fetch(`${API_URL}/productos`);
  if (!response.ok) throw new Error('No fue posible cargar los productos.');
  return response.json();
}

export async function subirImagenProducto(archivo) {
  const formData = new FormData();
  formData.append('imagen', archivo);
  const response = await fetch(`${API_URL}/productos/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || 'No fue posible subir la imagen.');
  return data;
}

export function crearProducto(producto) {
  return request('/productos', { method: 'POST', body: JSON.stringify(producto) });
}

export function actualizarProducto(id, producto) {
  return request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(producto) });
}

export function eliminarProducto(id) {
  return request(`/productos/${id}`, { method: 'DELETE' });
}
