import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getContenido } from '../services/contenidoService';

const ContenidoContext = createContext({ contenido: {}, recargar: () => {} });

export function ContenidoProvider({ children }) {
  const [contenido, setContenido] = useState({});

  const recargar = useCallback(async () => {
    try {
      setContenido(await getContenido());
    } catch {
      // Si falla, las páginas usan sus valores por defecto.
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return (
    <ContenidoContext.Provider value={{ contenido, recargar }}>
      {children}
    </ContenidoContext.Provider>
  );
}

export function useContenido() {
  return useContext(ContenidoContext);
}
