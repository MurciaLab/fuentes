// Construye la URL pre-rellenada del Form y la abre en pestaña nueva.
// El "equipo" se guarda en localStorage tras pedirlo la primera vez.

const Form = (() => {
  const KEY_EQUIPO = 'murcialab.equipo';

  function openRevisar(idFuente, nombreFuente) {
    //const equipo = getEquipo();
    //if (!equipo) return;
    let url;
    try {
      url = new URL(CONFIG.FORM_URL);
    } catch (e) {
      return;
    }
    url.searchParams.set(CONFIG.FORM_ENTRIES.id, String(idFuente));
    url.searchParams.set(CONFIG.FORM_ENTRIES.nombre, String(nombreFuente || ''));
    //url.searchParams.set(CONFIG.FORM_ENTRIES.equipo, equipo);
    url.searchParams.set('usp', 'pp_url');
    window.location.href = url.toString();
  }

  // Abre el Form independiente para añadir una fuente nueva, pre-rellenado
  // con la posición GPS del usuario (obligatoria) y la fecha/hora actual.
  // `coords` = { lat: Number, lon: Number, accuracy: Number? }.
  function openNuevaFuente(coords) {
    let url;
    try {
      url = new URL(CONFIG.NUEVA_FUENTE_FORM_URL);
    } catch (e) {
      return;
    }
    const entries = CONFIG.NUEVA_FUENTE_ENTRIES || {};
    if (entries.lat) url.searchParams.set(entries.lat, coords.lat.toFixed(6));
    if (entries.lon) url.searchParams.set(entries.lon, coords.lon.toFixed(6));
    if (entries.precision && coords.accuracy != null) {
      url.searchParams.set(entries.precision, String(Math.round(coords.accuracy)));
    }
    if (entries.fecha) url.searchParams.set(entries.fecha, new Date().toISOString());
    url.searchParams.set('usp', 'pp_url');
    //window.location.href = url.toString();
    window.location.href = url.toString();
  }

  return { openRevisar, openNuevaFuente };
})();
