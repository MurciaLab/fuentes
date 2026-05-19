// "hace 3 días" en español, usando Intl.RelativeTimeFormat.

const RelativeTime = (() => {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') return new Date(value);
    return null;
  }

  function format(value) {
    const d = toDate(value);
    if (!d || isNaN(d.getTime())) return '';
    const seconds = (d.getTime() - Date.now()) / 1000;
    const abs = Math.abs(seconds);
    if (abs < 60) return rtf.format(Math.round(seconds), 'second');
    if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
    if (abs < 604800) return rtf.format(Math.round(seconds / 86400), 'day');
    if (abs < 2629800) return rtf.format(Math.round(seconds / 604800), 'week');
    if (abs < 31557600) return rtf.format(Math.round(seconds / 2629800), 'month');
    return rtf.format(Math.round(seconds / 31557600), 'year');
  }

  return { format };
})();
