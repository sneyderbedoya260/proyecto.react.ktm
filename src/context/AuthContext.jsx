import { createContext, useContext, useState } from 'react';
import { getUsuarioActual, logoutUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(getUsuarioActual());

  const iniciarSesion = (datosUsuario) => setUsuario(datosUsuario);
  const cerrarSesion = () => {
    logoutUser();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
