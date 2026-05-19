// "Cómo llegar" — abre Google Maps con el deep link apropiado por plataforma.
// iOS: comgooglemaps:// con fallback a la URL web si la app no responde.
// Android: intent geo:.
// Resto: pestaña nueva con la URL universal de Google Maps.

const Nav = (() => {
  function isIOS() {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }

  function isAndroid() {
    return /Android/.test(navigator.userAgent || '');
  }

  function webUrl(lat, lon) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  }

  function comoLlegar(lat, lon, nombre) {
    const web = webUrl(lat, lon);

    if (isIOS()) {
      const app = `comgooglemaps://?daddr=${lat},${lon}`;
      // Si la app se abre, la pestaña pierde visibilidad antes del timeout.
      const fallback = setTimeout(() => {
        window.location.href = web;
      }, 1200);
      const onHidden = () => {
        if (document.hidden) clearTimeout(fallback);
      };
      document.addEventListener('visibilitychange', onHidden, { once: true });
      window.location.href = app;
      return;
    }

    if (isAndroid()) {
      const geo = `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(nombre || '')})`;
      window.location.href = geo;
      return;
    }

    window.open(web, '_blank', 'noopener');
  }

  return { comoLlegar };
})();
