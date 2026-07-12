/**
 * Formatea una fecha ISO del backend como fecha local sin desplazamiento de zona.
 * El backend envía "YYYY-MM-DDTHH:mm:ss.sssZ" (medianoche UTC). Si la parseamos
 * directamente con `new Date()`, en zonas UTC-5 se muestra un día antes.
 *
 * @param dateStr Fecha en formato ISO (ej. "2026-07-12T00:00:00.000Z")
 * @param locale  Idioma/localización (default 'es-CO')
 * @param options Opciones de Intl.DateTimeFormat
 */
export function formatLocalDate(
  dateStr: string,
  locale = 'es-CO',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '-';
  // Extraer componentes YYYY-MM-DD para evitar desplazamiento UTC→local
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, options);
}
