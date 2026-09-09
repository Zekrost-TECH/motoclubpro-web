import { html, mount, RouterView, effect } from '@elurjs/core';
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