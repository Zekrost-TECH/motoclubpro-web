// ── Storage keys unificadas ───────────────────────────────────────────────
// Namespace único `bikeros_` (antes mcp_/mc:/iron_ por renombres de marca).
// LEGACY_KEYS mapea clave nueva → clave vieja: localGet lee la nueva y, si no
// existe, intenta la legacy promoviéndola en caliente. Cero pérdida aunque la
// migración explícita no haya corrido todavía.
const LEGACY_KEYS: Record<string, string> = {
    bikeros_access_token: 'mcp_access_token',
    bikeros_refresh_token: 'mcp_refresh_token',
    bikeros_active_club: 'mcp_active_club',
    bikeros_theme: 'mc:theme',
};

export function localGet(key: string): string | null {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
    const legacy = LEGACY_KEYS[key];
    if (legacy) {
        const old = localStorage.getItem(legacy);
        if (old !== null) {
            try {
                localStorage.setItem(key, old);
                localStorage.removeItem(legacy);
            } catch { /* cuota llena o modo privado; la lectura ya funcionó */ }
            return old;
        }
    }
    return null;
}

export function localSet(key: string, value: string): void {
    localStorage.setItem(key, value);
    const legacy = LEGACY_KEYS[key];
    if (legacy) localStorage.removeItem(legacy);
}

export function localRemove(key: string): void {
    localStorage.removeItem(key);
    const legacy = LEGACY_KEYS[key];
    if (legacy) localStorage.removeItem(legacy);
}

/**
 * Storage compatible con persistPlugin que resuelve claves legacy en lectura.
 * Permite renombrar 'mc:theme' → 'bikeros_theme' sin perder la preferencia.
 */
export const legacyAwareStorage: Storage = {
    get length() { return localStorage.length; },
    clear: () => localStorage.clear(),
    getItem: (key: string) => localGet(key),
    setItem: (key: string, value: string) => localSet(key, value),
    removeItem: (key: string) => localRemove(key),
    key: (index: number) => localStorage.key(index),
};
