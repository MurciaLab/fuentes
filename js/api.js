// Cliente del Apps Script. Fallos de red se silencian para no romper la UI
// (devolvemos shape vacía coherente con el éxito).

const Api = (() => {
  async function get(action, params) {
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error('http_' + res.status);
    return res.json();
  }

  function getState() {
    return get('state').catch(() => ({ fuentes: [], updated_at: null }));
  }

  function getFuente(id) {
    return get('fuente', { id }).catch(() => ({ id, revisiones: [] }));
  }

  return { getState, getFuente };
})();
