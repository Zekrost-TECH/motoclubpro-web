import { html, signal } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';

let onConfirm: (() => void) | null = null;
const isOpen = signal(false);
const modalTitle = signal('');
const modalMessage = signal('');

export function openConfirm(title: string, message: string, confirmAction: () => void) {
    modalTitle.update(() => title);
    modalMessage.update(() => message);
    onConfirm = confirmAction;
    isOpen.update(() => true);
}

function closeModal() {
    isOpen.update(() => false);
    onConfirm = null;
}

function confirm() {
    if (onConfirm) onConfirm();
    closeModal();
}

export function ConfirmModal(): NixTemplate {
    return html`
        ${() => isOpen.value ? html`
            <div class="modal-overlay" @click=${closeModal}>
                <div class="modal-card danger" @click.stop=${() => { }}>
                    <div class="modal-header">
                        <h3><ion-icon name="alert-circle-outline"></ion-icon> ${modalTitle.value}</h3>
                        <button class="modal-close" @click=${closeModal}><ion-icon name="close-outline"></ion-icon></button>
                    </div>
                    <div class="modal-body">
                        <p>${modalMessage.value}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click=${closeModal}>Cancelar</button>
                        <button class="btn btn-danger" @click=${confirm}>Confirmar</button>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}
