import { createStore, html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

export const toastStore = createStore({
    items: [] as ToastItem[],
});

export function showToast(message: string, type: ToastType = 'info') {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    toastStore.items.update(arr => [...arr, { id, message, type }]);
    setTimeout(() => {
        toastStore.items.update(arr => arr.filter(t => t.id !== id));
    }, 4000);
}

function toastIcon(type: ToastType): string {
    switch (type) {
        case 'success': return 'checkmark-circle-outline';
        case 'error': return 'alert-circle-outline';
        case 'warning': return 'warning-outline';
        case 'info': return 'information-circle-outline';
    }
}

export function ToastContainer(): NixTemplate {
    return html`
        <div class="toast-container">
            ${() => toastStore.items.value.map(t => html`
                <div class=${`toast toast-${t.type}`} @click=${() => toastStore.items.update(arr => arr.filter(x => x.id !== t.id))}>
                    <div style="display:flex;align-items:center;gap:var(--mc-space-2);">
                        <ion-icon name=${toastIcon(t.type)}></ion-icon>
                        <span>${t.message}</span>
                    </div>
                    <ion-icon name="close-outline"></ion-icon>
                </div>
            `)}
        </div>
    `;
}
