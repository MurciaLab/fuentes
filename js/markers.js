// Iconos SVG inline para los 5 estados. Triple capa de accesibilidad:
// (1) símbolo distinto, (2) color de fondo, (3) tratamiento del borde.
// Renderizados como L.divIcon para que sean idénticos en iOS y Android.

const Markers = (() => {
  const C = CONFIG.COLORS;

  // Colores oscuros derivados para los bordes (mismo hue, contraste).
  const BORDER = {
    pendiente: '#1e3a8a',
    funciona: '#064e3b',
    perro: '#78350f',
    no_funciona: '#7f1d1d',
    no_encontrada: '#1f2937'
  };

  // Símbolos en blanco, dibujados sobre un viewBox 36x36, centrados en (18,18).
  const SYMBOLS = {
    // Gota
    pendiente:
      '<path d="M18 8 C13 14, 13 19, 18 26 C23 19, 23 14, 18 8 Z" fill="#fff"/>',
    // Check
    funciona:
      '<path d="M11 18 L16 23 L25 13" fill="none" stroke="#fff" stroke-width="3.5" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    // Huella canina: 4 dedos + almohadilla
    perro:
      '<ellipse cx="18" cy="23" rx="5.5" ry="3.5" fill="#fff"/>' +
      '<ellipse cx="15" cy="11" rx="1.8" ry="2.4" fill="#fff"/>' +
      '<ellipse cx="21" cy="11" rx="1.8" ry="2.4" fill="#fff"/>' +
      '<ellipse cx="10" cy="15" rx="1.8" ry="2.4" fill="#fff"/>' +
      '<ellipse cx="26" cy="15" rx="1.8" ry="2.4" fill="#fff"/>',
    // Cruz
    no_funciona:
      '<path d="M12 12 L24 24 M24 12 L12 24" stroke="#fff" stroke-width="3.2" ' +
      'stroke-linecap="round"/>',
    // Interrogación
    no_encontrada:
      '<path d="M14 14 C14 10, 22 10, 22 14 C22 17, 18 17, 18 21" fill="none" ' +
      'stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="18" cy="25.5" r="1.8" fill="#fff"/>'
  };

  // Anillo coloreado con la variación de borde por estado.
  function ring(estado) {
    const c = C[estado];
    const b = BORDER[estado];
    switch (estado) {
      case 'pendiente':
        return `<circle cx="18" cy="18" r="14" fill="${c}" stroke="${b}" stroke-width="1.5"/>`;
      case 'funciona':
        return `<circle cx="18" cy="18" r="14" fill="${c}" stroke="${b}" stroke-width="3"/>`;
      case 'perro':
        return (
          `<circle cx="18" cy="18" r="14" fill="${c}" stroke="${b}" stroke-width="2"/>` +
          `<circle cx="18" cy="18" r="11" fill="none" stroke="${b}" stroke-width="1"/>`
        );
      case 'no_funciona':
        return (
          `<circle cx="18" cy="18" r="14" fill="${c}" stroke="${b}" stroke-width="3"/>` +
          `<circle cx="18" cy="18" r="9" fill="none" stroke="${b}" stroke-width="1.2"/>`
        );
      case 'no_encontrada':
        return (
          `<circle cx="18" cy="18" r="14" fill="${c}" stroke="${b}" stroke-width="2" ` +
          `stroke-dasharray="3 2"/>`
        );
      default:
        return ring('pendiente');
    }
  }

  const LABELS = {
    pendiente: 'pendiente de revisión',
    funciona: 'funciona',
    perro: 'para perros',
    no_funciona: 'no funciona',
    no_encontrada: 'no encontrada'
  };

  function svgString(estado) {
    return (
      `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" ` +
      `role="img" aria-label="Fuente ${LABELS[estado] || estado}">` +
      ring(estado) +
      SYMBOLS[estado] +
      `</svg>`
    );
  }

  function icon(estado) {
    const state = SYMBOLS[estado] ? estado : 'pendiente';
    return L.divIcon({
      html: svgString(state),
      className: 'fuente-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  }

  // Marker del usuario: círculo azul con halo, distinto a los markers de fuente.
  function userIcon() {
    return L.divIcon({
      html:
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Tu ubicación">' +
        '<circle cx="12" cy="12" r="11" fill="rgba(59,130,246,0.25)"/>' +
        '<circle cx="12" cy="12" r="6" fill="#3B82F6" stroke="#fff" stroke-width="2"/>' +
        '</svg>',
      className: 'user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  // Mini SVG para badges (mismo aspecto, tamaño 14x14 lo decide el CSS).
  function badgeSvg(estado) {
    return svgString(SYMBOLS[estado] ? estado : 'pendiente');
  }

  return { icon, userIcon, badgeSvg, LABELS };
})();