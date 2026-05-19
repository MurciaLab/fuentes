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
    window.open(url.toString(), '_blank', 'noopener');
  }

  return { openRevisar };
})();
