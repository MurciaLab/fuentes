// Constantes de configuración. Editar tras desplegar Apps Script y obtener
// el enlace pre-rellenado del Form.

const CONFIG = (() => {
  return {
    // URL del despliegue del Apps Script (acaba en /exec).
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwsS5n6hQ_2llKyqblfHD_O6mLkyW0LoeErzillNCl7L9pgBhv7ItNpfICXn_qdfLM9/exec',

    // URL base del Form pre-rellenado (la parte hasta viewform, sin query).
    FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScpaph9WkLrnDeaLzxNg9HRbQUKU1S3m9d4v9f_yq_hHf9yRQ/viewform',

    // IDs de los campos `entry.XXXXXX` que se rellenan automáticamente.
    FORM_ENTRIES: {
      id: 'entry.2069205819',
      nombre: 'entry.695094978'
    },

    // URL base del Form independiente para "Añadir fuente nueva".
    NUEVA_FUENTE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSdWSnPQHV-GP-_GhcUZ2zFp8akwQLqnEG4YhnxwcOhmzryP9A/viewform',

    // IDs entry.XXXXXX del Form "Añadir fuente" que se rellenan automáticamente.
    NUEVA_FUENTE_ENTRIES: {
      lat:       'entry.1933239795',
      lon:       'entry.89563928',
      precision: 'entry.1261184949',
      fecha:     'entry.693745364'
    },

    // Radio (en metros) para avisar de posibles duplicados al añadir una fuente.
    DUPLICADO_RADIO_M: 25,

    // Colores por estado. Replicados en CSS como custom properties.
    COLORS: {
      pendiente: '#3B82F6',
      funciona: '#10B981',
      perro: '#a16207',
      no_funciona: '#EF4444',
      no_encontrada: '#6B7280',
      propuesta: '#8B5CF6'
    },

    // Capas de fuentes. Cada entrada es un fichero GeoJSON con features Point
    // o, si `source: 'api'`, una capa dinámica servida por Apps Script.
    //
    // `defaultOn: true`  → la capa se carga y se muestra al iniciar.
    // `defaultOn: false` → la capa solo se carga si el usuario la activa
    //                      desde el selector "Capas".
    // `defaultEstado`    → estado por defecto de los marcadores de la capa
    //                      cuando no hay entrada en getState() para su id.
    LAYERS: [
      { key: 'centro',     label: 'Murcia Centro',          file: 'data/Murcia_Centro.geojson',    defaultOn: true },
      { key: 'norte',      label: 'Murcia Norte',           file: 'data/Murcia_Norte.geojson',     defaultOn: true },
      { key: 'este',       label: 'Murcia Este',            file: 'data/Murcia_Este.geojson',      defaultOn: true },
      { key: 'ladera',     label: 'Ladera Monte Sur',       file: 'data/Ladera_Monte_Sur.geojson', defaultOn: true },
      { key: 'sur',        label: 'Murcia Sur Río',         file: 'data/Murcia_Sur_Rio.geojson',   defaultOn: true },
      { key: 'oeste',      label: 'Murcia Oeste',           file: 'data/Murcia_Oeste.geojson',     defaultOn: true },
      { key: 'pedanias',   label: 'Pedanías Lejanas',       file: 'data/Pedanias_Lejanas.geojson', defaultOn: true },
      { key: 'todas',      label: 'Todas las fuentes',      file: 'data/fuentes.geojson',          defaultOn: false },
      { key: 'propuestas', label: 'Propuestas ciudadanas',  source: 'api', defaultEstado: 'propuesta', defaultOn: true }
    ],

    MAP: {
      center: [37.9922, -1.1307],
      zoom: 13,
      tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      tileAttribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },

    // Intervalo de refresco periódico del estado (ms).
    REFRESH_MS: 60000
  };
})();
