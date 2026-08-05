import { html, mount, RouterView, effect } from '@deijose/nix-js';
// Registra el custom element <ion-icon> y todos los iconos en el bundle.
// ionicons v8 ya no auto-registra el componente ni trae los iconos incluidos:
// hay que definir el custom element y registrar los iconos con addIcons.
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';
import { defineCustomElement } from 'ionicons/components/ion-icon.js';
import { router } from './router';
import { refreshSession } from './stores/auth.store';
import { loadClubs } from './stores/clubs.store';
import { applyTheme } from './stores/theme.store';
import { refreshClubLimits } from './stores/plans.store';

defineCustomElement();
addIcons(icons);

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