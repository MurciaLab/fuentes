// Bottom sheet propio (no usamos popups de Leaflet). Render del resumen
// inmediato + carga asíncrona del historial vía Api.getFuente.

const Sheet = (() => {
  const LABELS = {
    pendiente: 'Pendiente',
    funciona: 'Funciona',
    perro: 'Para perros',
    no_funciona: 'No funciona',
    no_encontrada: 'No encontrada'
  };

  function el() { return document.getElementById('sheet'); }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function badge(estado) {
    const e = LABELS[estado] ? estado : 'pendiente';
    return `<span class="badge badge-${e}">${Markers.badgeSvg(e)} ${LABELS[e]}</span>`;
  }

  // Mapeo de una fila cruda de revisión a uno de los 5 estados del marcador.
  // Misma lógica que deriveEstado() en Code.gs — mantener sincronizadas.
  function revisionEstado(r) {
    if (r.existe === 'No') return 'no_encontrada';
    if (r.para_perros === 'Si') return 'perro';
    if (r.estado === 'Funciona') return 'funciona';
    if (r.estado === 'No funciona') return 'no_funciona';
    return 'pendiente';
  }

  function revisionHtml(r) {
    const estado = revisionEstado(r);
    const fecha = RelativeTime.format(r.fecha) || '';
    const comentario = r.comentario
      ? `<p class="rev-comment">${escapeHtml(r.comentario)}</p>`
      : '';
    const foto = r.foto_id
      ? `<p><a class="btn-link" href="https://drive.google.com/file/d/${encodeURIComponent(r.foto_id)}/view" target="_blank" rel="noopener">Ver foto</a></p>`
      : '';
    return (
      `<article class="rev">` +
        `<div class="rev-head">${badge(estado)} ` +
        `<span class="rev-meta">${fecha}</span></div>` +
        comentario +
        foto +
      `</article>`
    );
  }

  function close() {
    const node = el();
    if (!node) return;
    node.classList.remove('open');
    node.setAttribute('aria-hidden', 'true');
  }

  function show(feature, stateInfo) {
    const node = el();
    if (!node) return;

    const props = feature.properties;
    const id = props.id;
    const [lon, lat] = feature.geometry.coordinates;
    const estado = (stateInfo && stateInfo.estado) || 'pendiente';

    const ultimaLinea = stateInfo && stateInfo.fecha
      ? `Última revisión: ${RelativeTime.format(stateInfo.fecha)}`
      : 'Sin revisiones aún. Sé la primera persona en revisarla.';

    node.innerHTML =
      `<header class="sheet-header">` +
        `<div>` +
          `<div class="sheet-title">${escapeHtml(props.nombre)}</div>` +
          `<div class="sheet-sub">${escapeHtml(props.pedania)} · ${escapeHtml(props.zona)}</div>` +
        `</div>` +
        `<button type="button" class="sheet-close" aria-label="Cerrar">✕</button>` +
      `</header>` +
      `<div class="sheet-status">${badge(estado)}</div>` +
      `<p class="sheet-last">${ultimaLinea}</p>` +
      `<div class="sheet-actions">` +
        `<button type="button" class="btn btn-primary" id="btn-revisar">Revisar</button>` +
        `<button type="button" class="btn btn-secondary" id="btn-llegar">Cómo llegar</button>` +
      `</div>` +
      `<section class="sheet-historial">` +
        `<h3>Historial</h3>` +
        `<div id="sheet-historial-body" class="muted">Cargando…</div>` +
      `</section>`;

    node.scrollTop = 0;
    node.classList.add('open');
    node.setAttribute('aria-hidden', 'false');

    node.querySelector('.sheet-close').addEventListener('click', close);
    node.querySelector('#btn-revisar').addEventListener('click', () => {
      Form.openRevisar(id, props.nombre);
    });
    node.querySelector('#btn-llegar').addEventListener('click', () => {
      Nav.comoLlegar(lat, lon, props.nombre);
    });

    Api.getFuente(id).then((data) => {
      const body = document.getElementById('sheet-historial-body');
      if (!body) return;
      const revisiones = (data && data.revisiones) || [];
      if (revisiones.length === 0) {
        body.innerHTML = '<p class="muted">Sin revisiones aún. Sé la primera persona en revisarla.</p>';
        return;
      }
      const top = revisiones.slice(0, 3).map(revisionHtml).join('');
      const restantes = revisiones.length - 3;
      const masBtn = restantes > 0
        ? `<button type="button" class="btn-link" id="btn-historial-mas">Ver historial completo (${restantes} más)</button>`
        : '';
      body.classList.remove('muted');
      body.innerHTML = top + masBtn;
      const mas = document.getElementById('btn-historial-mas');
      if (mas) {
        mas.addEventListener('click', () => {
          const resto = revisiones.slice(3).map(revisionHtml).join('');
          mas.insertAdjacentHTML('beforebegin', resto);
          mas.remove();
        });
      }
    });
  }

  return { show, close };
})();
