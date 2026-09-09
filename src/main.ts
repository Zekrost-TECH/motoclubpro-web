import { html, mount, RouterView, effect, createErrorBoundary } from '@elurjs/core';
// Registra el custom element <ion-icon> y SOLO los iconos usados en la app.
// ionicons v8 ya no auto-registra el componente ni trae los iconos incluidos:
// hay que definir el custom element y registrar los iconos con addIcons.
// (Importar * como antes metía ~1.300 iconos en el bundle: +700 kB.)
import { addIcons } from 'ionicons';
import {
    addOutline, alertCircleOutline, arrowBackOutline, arrowUndoOutline, banOutline,
    barChartOutline, bicycleOutline, businessOutline, calendarOutline, cardOutline,
    cashOutline, checkboxOutline, checkmarkCircle, checkmarkCircleOutline, checkmarkOutline,
    chevronForwardOutline, closeCircleOutline, closeOutline, colorPaletteOutline, createOutline,
    cubeOutline, eyeOffOutline, eyeOutline, flagOutline, hourglassOutline,
    informationCircleOutline, locationOutline, lockClosedOutline, logInOutline, logOutOutline,
    mapOutline, menuOutline, moonOutline, openOutline, peopleCircleOutline, peopleOutline,
    personAddOutline, personOutline, receiptOutline, saveOutline, sendOutline,
    settingsOutline, shieldCheckmarkOutline, sparklesOutline, speedometerOutline, star,
    statsChartOutline, sunnyOutline, timeOutline, trashOutline, trendingUpOutline,
    walletOutline, warningOutline,
} from 'ionicons/icons';
import { defineCustomElement } from 'ionicons/components/ion-icon.js';
import { router } from './router';
import { refreshSession } from './stores/auth.store';
import { loadClubs } from './stores/clubs.store';
import { applyTheme } from './stores/theme.store';
import { refreshClubLimits } from './stores/plans.store';

defineCustomElement();
addIcons({
    addOutline, alertCircleOutline, arrowBackOutline, arrowUndoOutline, banOutline,
    barChartOutline, bicycleOutline, businessOutline, calendarOutline, cardOutline,
    cashOutline, checkboxOutline, checkmarkCircle, checkmarkCircleOutline, checkmarkOutline,
    chevronForwardOutline, closeCircleOutline, closeOutline, colorPaletteOutline, createOutline,
    cubeOutline, eyeOffOutline, eyeOutline, flagOutline, hourglassOutline,
    informationCircleOutline, locationOutline, lockClosedOutline, logInOutline, logOutOutline,
    mapOutline, menuOutline, moonOutline, openOutline, peopleCircleOutline, peopleOutline,
    personAddOutline, personOutline, receiptOutline, saveOutline, sendOutline,
    settingsOutline, shieldCheckmarkOutline, sparklesOutline, speedometerOutline, star,
    statsChartOutline, sunnyOutline, timeOutline, trashOutline, trendingUpOutline,
    walletOutline, warningOutline,
});

// ── App shell ────────────────────────────────────────────────────────────
function App() {
    return html`
        <div id="app-root">
            ${createErrorBoundary(new RouterView(0), (err: unknown) => {
        console.error('[app] Error boundary:', err);
        return html`
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:Inter,sans-serif;">
                        <ion-icon name="alert-circle-outline" style="font-size:3rem;color:var(--mc-danger,#ef4444);"></ion-icon>
                        <h2 style="margin:1rem 0 0.5rem;font-size:1.25rem;">Algo salió mal</h2>
                        <p style="color:var(--mc-text-muted,#6b7280);margin:0 0 1.5rem;">Se produjo un error inesperado. Recarga la página para continuar.</p>
                        <button class="btn btn-primary" @click=${() => window.location.reload()} style="padding:0.6rem 1.5rem;border-radius:8px;border:none;cursor:pointer;background:var(--mc-accent,#0A2540);color:#fff;">
                            Recargar
                        </button>
                    </div>
                `;
    })}
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