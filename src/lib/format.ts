export const LETTERS = 'ABCDEF';

export function letter(index: number): string {
  return LETTERS[index] ?? String(index + 1);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
export function formatDate(ts: number): string {
  return dateFmt.format(ts);
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}
