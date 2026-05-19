// Mapa Leaflet + gestión de capas de fuentes + posición del usuario.
//
// Cada capa es un L.layerGroup que se rellena bajo demanda la primera vez
// que se activa. Tras eso, mostrar/ocultar es solo addLayer/removeLayer.
// El namespace se llama MapView para no sombrear el `Map` nativo.

const MapView = (() => {
  let map = null;
  let userMarker = null;
  let tapHandler = null;
  let currentStates = {};

  // { key: { group, loaded, visible, markers: [{ id, marker, feature }] } }
  const layerState = {};

  function buildLayerState() {
    for (const cfg of (CONFIG.LAYERS || [])) {
      layerState[cfg.key] = {
        group: L.layerGroup(),
        loaded: false,
        visible: false,
        markers: []
      };
    }
  }

  async function loadLayer(cfg) {
    const st = layerState[cfg.key];
    if (!st || st.loaded) return;
    try {
      const res = await fetch(cfg.file);
      if (!res.ok) throw new Error('http_' + res.status);
      const gj = await res.json();
      for (const feat of (gj.features || [])) {
        // Solo puntos. Cualquier otra geometría se ignora silenciosamente.
        if (!feat.geometry || feat.geometry.type !== 'Point') continue;
        const props = feat.properties || {};
        const id = String(props.id);
        if (id == null) continue;
        const [lon, lat] = feat.geometry.coordinates;
        const estado = (currentStates[id] && currentStates[id].estado) || 'pendiente';
        const m = L.marker([lat, lon], {
          icon: Markers.icon(estado),
          keyboard: true,
          alt: 'Fuente ' + (props.nombre || id),
          riseOnHover: true
        });
        m.on('click', () => { if (tapHandler) tapHandler(feat); });
        m.addTo(st.group);
        st.markers.push({ id, marker: m, feature: feat });
      }
      st.loaded = true;
    } catch (e) {
      // Fallo silencioso: la capa queda no cargada y el checkbox se queda
      // marcado pero sin puntos. Reintentar = togglear off/on.
    }
  }

  async function setLayerVisible(key, visible) {
    const st = layerState[key];
    if (!st) return;
    const cfg = (CONFIG.LAYERS || []).find((c) => c.key === key);
    if (!cfg) return;
    if (visible) {
      if (!st.loaded) await loadLayer(cfg);
      if (!st.visible) {
        st.group.addTo(map);
        st.visible = true;
      }
    } else if (st.visible) {
      map.removeLayer(st.group);
      st.visible = false;
    }
  }

  function isLayerLoaded(key) {
    return !!(layerState[key] && layerState[key].loaded);
  }

  // Features de las capas actualmente visibles, deduplicadas por id.
  function getVisibleFeatures() {
    const seen = new Set();
    const out = [];
    for (const key in layerState) {
      const st = layerState[key];
      if (!st.visible) continue;
      for (const m of st.markers) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        out.push(m.feature);
      }
    }
    return out;
  }

  function setStates(statesById) {
    currentStates = statesById || {};

    for (const key in layerState) {
      for (const m of layerState[key].markers) {
        const id = String(m.id);

        const estado =
          (currentStates[id] && currentStates[id].estado)
          || 'pendiente';

        m.marker.setIcon(
          Markers.icon(estado)
        );
      }
    }
  }

  function fitToVisible() {
    const latlngs = [];
    for (const key in layerState) {
      if (!layerState[key].visible) continue;
      for (const m of layerState[key].markers) {
        const [lon, lat] = m.feature.geometry.coordinates;
        latlngs.push([lat, lon]);
      }
    }
    if (latlngs.length === 0) return;
    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
  }

  async function init(containerId) {
    map = L.map(containerId, {
      zoomControl: false,
      attributionControl: true,
      tap: true
    }).setView(CONFIG.MAP.center, CONFIG.MAP.zoom);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer(CONFIG.MAP.tileUrl, {
      attribution: CONFIG.MAP.tileAttribution,
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    buildLayerState();
  }

  // Activa las capas indicadas. Las que no estén en la lista quedan ocultas.
  // Devuelve la lista de keys que realmente quedaron visibles (las que tienen
  // fichero válido y al menos un punto).
  async function activateInitial(keysOn) {
    const onSet = new Set(keysOn);
    const cfgs = (CONFIG.LAYERS || []).filter((c) => onSet.has(c.key));
    await Promise.all(cfgs.map((c) => setLayerVisible(c.key, true)));
    fitToVisible();
    return cfgs.map((c) => c.key).filter((k) => layerState[k].visible);
  }

  function centerOnUser(callbacks) {
    callbacks = callbacks || {};
    if (!('geolocation' in navigator)) {
      callbacks.onError && callbacks.onError('Geolocalización no disponible en este dispositivo');
      return;
    }
    // Safari iOS y Chrome Android exigen contexto seguro (https) salvo localhost.
    const host = location.hostname;
    const secure = window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
    if (!secure) {
      callbacks.onError && callbacks.onError('La ubicación necesita conexión HTTPS');
      return;
    }
    callbacks.onPending && callbacks.onPending();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        if (userMarker) {
          userMarker.setLatLng(latlng);
        } else {
          userMarker = L.marker(latlng, {
            icon: Markers.userIcon(),
            interactive: false,
            keyboard: false,
            zIndexOffset: 1000  // por encima de los markers de fuente
          }).addTo(map);
        }
        map.setView(latlng, Math.max(map.getZoom(), 16));
        callbacks.onSuccess && callbacks.onSuccess();
      },
      (err) => {
        let msg = 'No se pudo obtener tu ubicación';
        if (err) {
          if (err.code === 1) msg = 'Permiso de ubicación denegado';
          else if (err.code === 2) msg = 'Ubicación no disponible ahora mismo';
          else if (err.code === 3) msg = 'Tu dispositivo tardó demasiado en localizarte';
        }
        callbacks.onError && callbacks.onError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }

  function onMarkerTap(fn) { tapHandler = fn; }

  return {
    init,
    activateInitial,
    setLayerVisible,
    isLayerLoaded,
    getVisibleFeatures,
    setStates,
    centerOnUser,
    onMarkerTap,
    fitToVisible
  };
})();
