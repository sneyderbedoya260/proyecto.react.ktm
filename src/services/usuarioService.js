import { apiRequest } from './apiClient';

export const listarUsuarios = () => apiRequest('/usuarios');
export const listarRoles = () => apiRequest('/usuarios/roles');
export const listarClientes = () => apiRequest('/usuarios/clientes');
export const crearUsuario = (usuario) => apiRequest('/usuarios', { method: 'POST', body: JSON.stringify(usuario) });
export const cambiarEstadoUsuario = (id, estado) =>
  apiRequest(`/usuarios/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) });
