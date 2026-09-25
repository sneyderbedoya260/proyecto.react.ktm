// Fichas técnicas, descripciones (en español) y esquemas de color de cada
// modelo, solo para mostrar en la página de detalle. Es información de
// referencia del catálogo: no hay ventas, cotizaciones ni pedidos.
//
// Los "colores" son esquemas de visualización: el mismo estudio de la moto con
// un tratamiento de color para que se pueda ver el modelo en distintas
// configuraciones.

// Paleta de esquemas de color reutilizable (el filtro se aplica a la foto).
const NARANJA = { nombre: 'Naranja KTM', hex: '#FF6600', filtro: 'none' };
const NEGRO = { nombre: 'Negro Carbón', hex: '#17181c', filtro: 'grayscale(0.92) brightness(0.72) contrast(1.18)' };
const AZUL = { nombre: 'Azul Eléctrico', hex: '#1f5fd6', filtro: 'hue-rotate(155deg) saturate(1.25)' };
const BLANCO = { nombre: 'Blanco Táctico', hex: '#dfe3e8', filtro: 'grayscale(0.7) brightness(1.22) contrast(0.95)' };

const COLORES_BASE = [NARANJA, NEGRO, AZUL];

export const FICHAS = {
  'ktm 1390 super adventure': {
    subtitulo: 'Conquista cualquier horizonte',
    descripcion:
      'La gran trail de KTM lleva la aventura de largo recorrido a otro nivel. Su bicilíndrico LC8 entrega una potencia contundente y a la vez dócil, mientras la electrónica de última generación y la suspensión semiactiva WP mantienen el control tanto en autopista como fuera del asfalto. Pensada para devorar kilómetros con comodidad, seguridad y carácter KTM.',
    colores: [NARANJA, NEGRO, BLANCO],
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Bicilíndrico en V a 75°, 4 tiempos, LC8' },
        { e: 'Cilindrada', v: '1.350 cm³' },
        { e: 'Potencia', v: '173 hp' },
        { e: 'Par máximo', v: '145 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC, accionamiento hidráulico' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero cromo-molibdeno' },
        { e: 'Suspensión delantera', v: 'WP APEX semiactiva, 200 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX semiactivo, 200 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Doble disco 320 mm, pinzas radiales' },
        { e: 'Freno trasero', v: 'Disco 267 mm' },
        { e: 'Ruedas', v: '21" delantera / 18" trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '849 / 869 mm' },
        { e: 'Depósito', v: '23 L' },
        { e: 'Peso (en seco)', v: '≈ 220 kg' },
      ],
    },
  },

  'ktm 990 duke': {
    subtitulo: 'El filo de la ciudad',
    descripcion:
      'Una naked de media cilindrada afilada y agresiva. El bicilíndrico LC8c de 947 cm³ combina un empuje inmediato con un chasis ágil que hace de cada curva un juego. Ligera, directa y con la electrónica justa para exprimirla, la 990 Duke es pura diversión urbana con alma de pista.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Bicilíndrico en paralelo, 4 tiempos, LC8c' },
        { e: 'Cilindrada', v: '947 cm³' },
        { e: 'Potencia', v: '123 hp' },
        { e: 'Par máximo', v: '103 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'Horquilla invertida WP APEX, 140 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 150 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Doble disco 300 mm, pinzas radiales' },
        { e: 'Freno trasero', v: 'Disco 240 mm' },
        { e: 'Ruedas', v: '17" delantera y trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '825 mm' },
        { e: 'Depósito', v: '14,8 L' },
        { e: 'Peso (en seco)', v: '≈ 179 kg' },
      ],
    },
  },

  'ktm 690 smc r': {
    subtitulo: 'Supermoto de raza',
    descripcion:
      'La supermoto más pura de la gama. Su monocilíndrico LC4 de 693 cm³ entrega un par brutal en un chasis ligerísimo, perfecto para el asfalto técnico y las curvas cerradas. Directa, ágil y descarada: nació para bailar entre conos y dominar la ciudad.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Monocilíndrico LC4, 4 tiempos' },
        { e: 'Cilindrada', v: '693 cm³' },
        { e: 'Potencia', v: '74 hp' },
        { e: 'Par máximo', v: '73,5 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero cromo-molibdeno' },
        { e: 'Suspensión delantera', v: 'Horquilla invertida WP APEX, 215 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 240 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Disco 320 mm, pinza radial' },
        { e: 'Freno trasero', v: 'Disco 240 mm' },
        { e: 'Ruedas', v: '17" delantera y trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '890 mm' },
        { e: 'Depósito', v: '13,5 L' },
        { e: 'Peso (en seco)', v: '≈ 147 kg' },
      ],
    },
  },

  'ktm 890 adventure r': {
    subtitulo: 'Sin límites de terreno',
    descripcion:
      'La trail off-road por excelencia. Con su bicilíndrico de 889 cm³, suspensión WP XPLOR de largo recorrido y rueda delantera de 21", la 890 Adventure R está hecha para llegar donde otras se detienen. Robusta, capaz y equilibrada, es la compañera ideal para la aventura más exigente.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Bicilíndrico en paralelo, 4 tiempos' },
        { e: 'Cilindrada', v: '889 cm³' },
        { e: 'Potencia', v: '105 hp' },
        { e: 'Par máximo', v: '100 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'WP XPLOR, 240 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP XPLOR, 240 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Doble disco 320 mm' },
        { e: 'Freno trasero', v: 'Disco 260 mm' },
        { e: 'Ruedas', v: '21" delantera / 18" trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '880 mm' },
        { e: 'Depósito', v: '20 L' },
        { e: 'Peso (en seco)', v: '≈ 196 kg' },
      ],
    },
  },

  'ktm 690 enduro r': {
    subtitulo: 'Enduro para todo',
    descripcion:
      'Una enduro homologada para calle con corazón de campo. El potente monocilíndrico LC4 y su chasis ligero le dan una versatilidad enorme: rueda a diario por ciudad y se adentra en el terreno más difícil sin despeinarse. Ligera, fuerte y lista para cualquier ruta.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Monocilíndrico LC4, 4 tiempos' },
        { e: 'Cilindrada', v: '693 cm³' },
        { e: 'Potencia', v: '74 hp' },
        { e: 'Par máximo', v: '73,5 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero cromo-molibdeno' },
        { e: 'Suspensión delantera', v: 'WP XPLOR, 250 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP XPLOR, 250 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Disco 300 mm' },
        { e: 'Freno trasero', v: 'Disco 240 mm' },
        { e: 'Ruedas', v: '21" delantera / 18" trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '910 mm' },
        { e: 'Depósito', v: '13,5 L' },
        { e: 'Peso (en seco)', v: '≈ 146 kg' },
      ],
    },
  },

  'ktm 890 smt': {
    subtitulo: 'Sport touring sin concesiones',
    descripcion:
      'La fusión perfecta entre deportividad y viaje. Toma el bicilíndrico de 889 cm³ de la familia 890, lo monta en una ergonomía cómoda de largo recorrido y le suma la electrónica y las opciones de equipaje para devorar carreteras. Rápida en la curva, incansable en la ruta.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Bicilíndrico en paralelo, 4 tiempos' },
        { e: 'Cilindrada', v: '889 cm³' },
        { e: 'Potencia', v: '105 hp' },
        { e: 'Par máximo', v: '100 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'Horquilla invertida WP APEX, 180 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 180 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Doble disco 320 mm' },
        { e: 'Freno trasero', v: 'Disco 260 mm' },
        { e: 'Ruedas', v: '17" delantera y trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '860 mm' },
        { e: 'Depósito', v: '15,8 L' },
        { e: 'Peso (en seco)', v: '≈ 195 kg' },
      ],
    },
  },

  'ktm 390 adventure r': {
    subtitulo: 'Tu primera gran aventura',
    descripcion:
      'La puerta de entrada al mundo trail, con genes de las grandes. Su monocilíndrico de 399 cm³ es accesible y divertido, mientras la suspensión de largo recorrido y las ayudas electrónicas dan confianza dentro y fuera del asfalto. Ligera y manejable, ideal para empezar a rodar lejos.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Monocilíndrico, 4 tiempos' },
        { e: 'Cilindrada', v: '399 cm³' },
        { e: 'Potencia', v: '45 hp' },
        { e: 'Par máximo', v: '39 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'WP APEX, 230 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 230 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Disco 320 mm' },
        { e: 'Freno trasero', v: 'Disco 240 mm' },
        { e: 'Ruedas', v: '21" delantera / 17" trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '870 mm' },
        { e: 'Depósito', v: '14,5 L' },
        { e: 'Peso (en seco)', v: '≈ 177 kg' },
      ],
    },
  },

  'ktm 390 smc r': {
    subtitulo: 'Supermoto ligera y traviesa',
    descripcion:
      'Toda la diversión de una supermoto en un formato ligero y accesible. Con 399 cm³, poco peso y una agilidad endiablada, la 390 SMC R es perfecta para la ciudad y las curvas. Fácil de manejar y difícil de soltar.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Monocilíndrico, 4 tiempos' },
        { e: 'Cilindrada', v: '399 cm³' },
        { e: 'Potencia', v: '45 hp' },
        { e: 'Par máximo', v: '39 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'Horquilla invertida WP APEX, 230 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 240 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Disco 320 mm' },
        { e: 'Freno trasero', v: 'Disco 230 mm' },
        { e: 'Ruedas', v: '17" delantera y trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '890 mm' },
        { e: 'Depósito', v: '9 L' },
        { e: 'Peso (en seco)', v: '≈ 149 kg' },
      ],
    },
  },

  'ktm 990 rc r': {
    subtitulo: 'Alma de circuito',
    descripcion:
      'Una deportiva de calle con actitud de pista. Comparte el potente bicilíndrico de 947 cm³ con la familia 990 y lo envuelve en una aerodinámica afilada y una posición de conducción totalmente deportiva. Precisa, rápida y emocionante en cada trazada.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Bicilíndrico en paralelo, 4 tiempos, LC8c' },
        { e: 'Cilindrada', v: '947 cm³' },
        { e: 'Potencia', v: '128 hp' },
        { e: 'Par máximo', v: '103 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'Horquilla invertida WP APEX, 120 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 130 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Doble disco 300 mm, pinzas radiales' },
        { e: 'Freno trasero', v: 'Disco 240 mm' },
        { e: 'Ruedas', v: '17" delantera y trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '830 mm' },
        { e: 'Depósito', v: '14,8 L' },
        { e: 'Peso (en seco)', v: '≈ 179 kg' },
      ],
    },
  },

  'ktm 390 enduro r': {
    subtitulo: 'Diversión todo terreno',
    descripcion:
      'La enduro ligera para disfrutar del campo sin complicaciones. Su monocilíndrico de 399 cm³ y su chasis con suspensión de largo recorrido la hacen accesible, ágil y divertida en cualquier sendero. Perfecta para dar el salto al off-road.',
    colores: COLORES_BASE,
    specs: {
      Motor: [
        { e: 'Tipo', v: 'Monocilíndrico, 4 tiempos' },
        { e: 'Cilindrada', v: '399 cm³' },
        { e: 'Potencia', v: '45 hp' },
        { e: 'Par máximo', v: '39 Nm' },
        { e: 'Refrigeración', v: 'Líquida' },
      ],
      Transmisión: [
        { e: 'Cambio', v: '6 marchas' },
        { e: 'Embrague', v: 'Antirrebote PASC' },
      ],
      'Chasis y suspensión': [
        { e: 'Chasis', v: 'Tubular de acero' },
        { e: 'Suspensión delantera', v: 'WP APEX, 230 mm' },
        { e: 'Suspensión trasera', v: 'Monoamortiguador WP APEX, 230 mm' },
      ],
      'Frenos y ruedas': [
        { e: 'Freno delantero', v: 'Disco 320 mm' },
        { e: 'Freno trasero', v: 'Disco 240 mm' },
        { e: 'Ruedas', v: '21" delantera / 18" trasera' },
      ],
      'Dimensiones y peso': [
        { e: 'Altura del asiento', v: '880 mm' },
        { e: 'Depósito', v: '9 L' },
        { e: 'Peso (en seco)', v: '≈ 147 kg' },
      ],
    },
  },
};

// Ficha por defecto para cualquier modelo sin datos propios (se rellena con la
// info que ya trae el producto).
export const COLORES_DEFECTO = COLORES_BASE;

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function obtenerFicha(titulo) {
  return FICHAS[normalizar(titulo)] || null;
}
