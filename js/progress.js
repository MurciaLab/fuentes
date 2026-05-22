// Cálculo y render del progreso por zona.
// Render compacto: un botón "Progreso X%" en el banner + un panel desplegable
// con el desglose por zona, gestionado desde app.js.
//
// Las propuestas ciudadanas (properties.propuesta === true) se excluyen
// del cómputo: el proyecto solo mide la revisión del conjunto original.

const Progress = (() => {
  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function compute(features, statesById) {
    const byZona = new Map();
    let totalAll = 0;
    let revAll = 0;
    for (const f of features) {
      // Saltamos propuestas ciudadanas — no forman parte del objetivo.
      if (f.properties && f.properties.propuesta) continue;
      const zona = (f.properties && f.properties.zona) || 'sin zona';
      const id = f.properties && f.properties.id;
      if (!byZona.has(zona)) byZona.set(zona, { total: 0, revisadas: 0 });
      const acc = byZona.get(zona);
      acc.total++;
      totalAll++;
      const estado = (statesById && statesById[id] && statesById[id].estado) || 'pendiente';
      if (estado !== 'pendiente') {
        acc.revisadas++;
        revAll++;
      }
    }
    const zones = [...byZona.entries()]
      .map(([zona, v]) => ({ zona, ...v }))
      .sort((a, b) => a.zona.localeCompare(b.zona, 'es'));
    return { zones, total: totalAll, revisadas: revAll };
  }

  // summaryEl: <span> dentro del botón compacto.
  // detailEl: contenedor del desplegable con el desglose por zona.
  function render(features, statesById, summaryEl, detailEl) {
    const { zones, total, revisadas } = compute(features, statesById);
    const pct = total ? Math.round((revisadas / total) * 100) : 0;

    if (summaryEl) {
      summaryEl.textContent = total === 0 ? 'Progreso —' : `Progreso ${pct}%`;
    }
    if (detailEl) {
      if (total === 0) {
        detailEl.innerHTML = '<p class="muted">No hay fuentes visibles. Activa al menos una capa.</p>';
        return;
      }
      const header =
        `<div class="progress-row progress-row-total">` +
          `<span class="progress-zona">Total</span>` +
          `<span class="progress-bar"><span class="progress-fill" style="width:${pct}%"></span></span>` +
          `<span class="progress-num">${revisadas}/${total}</span>` +
          `<span class="progress-pct">${pct}%</span>` +
        `</div>`;
      const rows = zones.map(({ zona, total, revisadas }) => {
        const p = total ? Math.round((revisadas / total) * 100) : 0;
        return (
          `<div class="progress-row">` +
            `<span class="progress-zona">${capitalize(zona)}</span>` +
            `<span class="progress-bar"><span class="progress-fill" style="width:${p}%"></span></span>` +
            `<span class="progress-num">${revisadas}/${total}</span>` +
            `<span class="progress-pct">${p}%</span>` +
          `</div>`
        );
      }).join('');
      detailEl.innerHTML = header + rows;
    }
  }

  return { compute, render };
})();
