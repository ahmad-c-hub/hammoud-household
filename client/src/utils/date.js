// Works whether the value is "2026-05-12" or "2026-05-12T00:00:00.000Z"
export function toDateStr(d) {
  return d ? String(d).slice(0, 10) : '';
}

export function formatDate(d) {
  const ymd = toDateStr(d);
  if (!ymd) return '';
  return new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
