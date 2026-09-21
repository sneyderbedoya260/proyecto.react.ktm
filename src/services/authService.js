const API_URL = import.meta.env.VITE_API_URL || '/api';

function getErrorMessage(data) {
  if (data?.mensaje) return data.mensaje;
  if (typeof data?.detail === 'string') return data.detail;
  if (data?.detail?.mensaje) return data.detail.mensaje;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((error) => error.msg).filter(Boolean).join(' ');
  }
  return 'Error en la solicitud.';
}

async function request(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!response.ok) throw new Error(getErrorMessage(data));

  return data;
}

export async function loginUser(credentials) {
  const data = await request('/auth/login', credentials);
  const storage = credentials.remember ? localStorage : sessionStorage;
  const otherStorage = credentials.remember ? sessionStorage : localStorage;
  otherStorage.removeItem('token');
  otherStorage.removeItem('usuario');
  storage.setItem('token', data.token);
  storage.setItem('usuario', JSON.stringify(data.usuario));
  return data;
}

export function registerUser(credentials) {
  return request('/auth/register', credentials);
}

export function recoverPassword(credentials) {
  return request('/auth/recover-password', credentials);
}

export function resetPassword(credentials) {
  return request('/auth/reset-password', credentials);
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
}

export function getUsuarioActual() {
  const data = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    logoutUser();
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}