// Orquestación: init mapa, paneles de progreso y capas, ubicación,
// refresco de estado y persistencia ligera de preferencias de capas.

const Toast = (() => {
  let timer = null;
  function show(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('visible'), 2400);
  }
  return { show };
})();

const App = (() => {
  const LAYERS_LS_KEY = 'murcialab.layers';
  let currentStates = {};
  let dropdowns = [];

  function readLayerPrefs() {
    try {
      const raw = localStorage.getItem(LAYERS_LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch (e) { return null; }
  }

  function writeLayerPrefs(prefs) {
    try { localStorage.setItem(LAYERS_LS_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function initialKeysOn() {
    const prefs = readLayerPrefs();
    const out = [];
    for (const cfg of (CONFIG.LAYERS || [])) {
      const saved = prefs && Object.prototype.hasOwnProperty.call(prefs, cfg.key);
      const on = saved ? !!prefs[cfg.key] : !!cfg.defaultOn;
      if (on) out.push(cfg.key);
    }
    return out;
  }

  function buildLayerCheckboxes(panel, keysOn) {
    const onSet = new Set(keysOn);
    panel.innerHTML = (CONFIG.LAYERS || []).map((cfg) =>
      `<label class="layer-row">` +
        `<input type="checkbox" data-layer="${cfg.key}"${onSet.has(cfg.key) ? ' checked' : ''}>` +
        `<span>${cfg.label}</span>` +
      `</label>`
    ).join('');
  }

  function savePrefsFromPanel(panel) {
    const prefs = {};
    panel.querySelectorAll('input[data-layer]').forEach((inp) => {
      prefs[inp.dataset.layer] = inp.checked;
    });
    writeLayerPrefs(prefs);
  }

  // Dropdown del banner. Botón con aria-expanded, panel con clase .open,
  // se cierra al tocar fuera o al abrir cualquier otro registrado.
  function attachDropdown(btn, panel) {
    function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }
    function close() {
      btn.setAttribute('aria-expanded', 'false');
      panel.classList.remove('open');
    }
    function open() {
      // Cerrar el resto antes de abrir este.
      for (const d of dropdowns) if (d.btn !== btn) d.close();
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.add('open');
    }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen()) close(); else open();
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
    const api = { btn, panel, open, close, isOpen };
    dropdowns.push(api);
    return api;
  }

  function refreshProgress(summaryEl, detailEl) {
    const features = MapView.getVisibleFeatures();
    Progress.render(features, currentStates, summaryEl, detailEl);
  }

  async function refreshState() {
    const data = await Api.getState();

    const m = {};

    for (const f of (data.fuentes || [])) {
      if (f && f.id != null) {
        m[String(f.id)] = f;
      }
    }

    currentStates = m;

    MapView.setStates(currentStates);

    refreshProgress(
      document.getElementById('btn-progress-label'),
      document.getElementById('progress-detail')
    );

    console.log('Estado actualizado:', currentStates);
  }

  // ------------------------------------------------------------------
  // Añadir fuente nueva
  // ------------------------------------------------------------------

  // Distancia ortodrómica en metros (Haversine). Suficientemente precisa a
  // la escala que nos interesa (decenas de metros).
  function distanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // Busca la fuente visible más cercana al punto dado dentro de
  // CONFIG.DUPLICADO_RADIO_M. Devuelve { feature, dist } o null.
  function fuenteCercana(lat, lon) {
    const radio = CONFIG.DUPLICADO_RADIO_M || 25;
    const features = MapView.getVisibleFeatures();
    let mejor = null;
    for (const f of features) {
      if (!f.geometry || !f.geometry.coordinates) continue;
      const [flon, flat] = f.geometry.coordinates;
      const d = distanciaMetros(lat, lon, flat, flon);
      if (d <= radio && (!mejor || d < mejor.dist)) {
        mejor = { feature: f, dist: d };
      }
    }
    return mejor;
  }

  function handleAddFuente(btn) {
    MapView.requestPosition({
      onPending: () => { btn.disabled = true; Toast.show('Obteniendo tu ubicación…'); },
      onError: (msg) => {
        btn.disabled = false;
        // GPS obligatorio: si falla, no se abre el form.
        Toast.show(msg + '. Es obligatoria para añadir una fuente.');
      },
      onSuccess: (pos) => {
        btn.disabled = false;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const cercana = fuenteCercana(lat, lon);
        if (cercana) {
          const nombre = (cercana.feature.properties && cercana.feature.properties.nombre) || 'otra fuente';
          const ok = window.confirm(
            `Parece que ya existe una fuente cerca (${nombre}, a ${Math.round(cercana.dist)} m).\n\n` +
            '¿Quieres continuar y añadir una nueva igualmente?'
          );
          if (!ok) return;
        }
        Form.openNuevaFuente({ lat: lat, lon: lon, accuracy: accuracy });
      }
    });
  }

  async function init() {
    await MapView.init('map');

    MapView.onMarkerTap((feature) => {
      const info = currentStates[feature.properties.id];
      Sheet.show(feature, info);
    });

    // Capas iniciales (preferencias guardadas o defaults).
    const keysOn = initialKeysOn();
    await MapView.activateInitial(keysOn);

    // Refs UI.
    const layersBtn = document.getElementById('btn-layers');
    const layersPanel = document.getElementById('layers-panel');
    const progressBtn = document.getElementById('btn-progress');
    const progressDetail = document.getElementById('progress-detail');
    const progressLabel = document.getElementById('btn-progress-label');

    buildLayerCheckboxes(layersPanel, keysOn);
    attachDropdown(layersBtn, layersPanel);
    attachDropdown(progressBtn, progressDetail);

    // Cierre al tocar en cualquier punto del documento (mapa, sheet, etc.).
    document.addEventListener('click', () => {
      for (const d of dropdowns) if (d.isOpen()) d.close();
    });

    // Toggle de capa: lazy-load + persistir + recalcular progreso.
    layersPanel.addEventListener('change', async (e) => {
      const input = e.target;
      if (!input || input.tagName !== 'INPUT' || !input.dataset.layer) return;
      const key = input.dataset.layer;
      const checked = input.checked;
      input.disabled = true;
      const willLazyLoad = checked && !MapView.isLayerLoaded(key);
      if (willLazyLoad) Toast.show('Cargando capa…');
      await MapView.setLayerVisible(key, checked);
      input.disabled = false;
      savePrefsFromPanel(layersPanel);
      refreshProgress(progressLabel, progressDetail);
      if (willLazyLoad) MapView.fitToVisible();
    });

    // Botón "Mi ubicación" con feedback.
    const ubiBtn = document.getElementById('btn-ubicacion');
    ubiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      MapView.centerOnUser({
        onPending: () => { ubiBtn.disabled = true; Toast.show('Buscando tu ubicación…'); },
        onSuccess: () => { ubiBtn.disabled = false; },
        onError: (msg) => { ubiBtn.disabled = false; Toast.show(msg); }
      });
    });

    // Botón "Añadir fuente": pide GPS (obligatorio), comprueba duplicado,
    // abre el Form independiente pre-rellenado.
    const addBtn = document.getElementById('btn-add-fuente');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAddFuente(addBtn);
      });
    }

    // Render inicial del progreso con las capas activadas.
    refreshProgress(progressLabel, progressDetail);

    // Estado real desde Apps Script.
    await refreshState();

    // Refresco al volver del Form y de seguridad cada minuto.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(refreshState, 800);
      }
    });

    window.addEventListener('focus', () => {
      setTimeout(refreshState, 800);
    });

    setInterval(refreshState, CONFIG.REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { refreshState };
})();
