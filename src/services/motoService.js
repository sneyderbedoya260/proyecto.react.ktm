import carouselData from '../components/carouselData';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function adaptarMoto(moto) {
  return {
    ...moto,
    id: String(moto.id),
    imagen: moto.imagen || moto.imagen_url,
  };
}

export async function getMotos() {
  try {
    const response = await fetch(`${API_URL}/productos`);
    if (!response.ok) throw new Error('No fue posible cargar el catálogo.');
    const productos = await response.json();
    return productos.map(adaptarMoto);
  } catch {
    return carouselData;
  }
}

export async function getMotoById(id) {
  try {
    const response = await fetch(`${API_URL}/productos/${encodeURIComponent(id)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('No fue posible cargar el modelo.');
    return adaptarMoto(await response.json());
  } catch {
    return carouselData.find((moto) => String(moto.id) === String(id)) || null;
  }
}