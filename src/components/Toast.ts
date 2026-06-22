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

export function ToastContainer(): NixTemplate {
    return html`
        <div class="toast-container">
            ${() => toastStore.items.value.map(t => html`
                <div class="toast toast-${t.type}" @click=${() => toastStore.items.update(arr => arr.filter(x => x.id !== t.id))}>
                    <span>${t.message}</span>
                    <ion-icon name="close-outline"></ion-icon>
                </div>
            `)}
        </div>
    `;
}
