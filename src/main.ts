import { html, mount, RouterView, effect } from '@deijose/nix-js';
import { router } from './router';
import { refreshSession } from './stores/auth.store';
import { loadClubs } from './stores/clubs.store';
import { applyTheme } from './stores/theme.store';
import { refreshClubLimits } from './stores/plans.store';

// ── App shell ────────────────────────────────────────────────────────────
function App() {
    return html`
        <div id="app-root">
            ${new RouterView(0)}
        </div>
    `;
}

// ── Bootstrap ────────────────────────────────────────────────────────────
async function init() {
    applyTheme();
    effect(() => applyTheme());
    const ok = await refreshSession();
    if (ok) await loadClubs();
    refreshClubLimits();
    mount(App(), '#app', { router });
}

init();