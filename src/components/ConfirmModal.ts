import { html, signal, effect, ref } from '@elurjs/core';
import type { ElurTemplate, ElurRef } from '@elurjs/core';

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

// ── Accesibilidad: Escape cierra, foco inicial en Cancelar, Tab atrapado ──
let _restoreFocus: Element | null = null;
let _keydownBound = false;
const cancelRef: ElurRef<HTMLButtonElement> = ref<HTMLButtonElement>();

function _focusables(): HTMLElement[] {
    const overlay = cancelRef.el?.closest('.modal-overlay');
    if (!overlay) return [];
    return Array.from(
        overlay.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute('disabled'));
}

function _onKeydown(e: KeyboardEvent) {
    if (!isOpen.value) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
    }
    if (e.key === 'Tab') {
        const els = _focusables();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!active || !els.includes(active)) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

export function ConfirmModal(): ElurTemplate {
    // Registrar el listener una sola vez (el componente vive en AppLayout).
    if (!_keydownBound) {
        _keydownBound = true;
        document.addEventListener('keydown', _onKeydown);
    }

    // Al abrir: guardar el elemento con foco, enfocar Cancelar al montar.
    effect(() => {
        if (isOpen.value) {
            _restoreFocus = document.activeElement;
            // El binding de isOpen re-renderiza en el mismo tick; el botón
            // puede no existir aún cuando corre este effect.
            setTimeout(() => cancelRef.el?.focus(), 0);
        } else if (_restoreFocus instanceof HTMLElement) {
            _restoreFocus.focus();
            _restoreFocus = null;
        }
    });

    return html`
        ${() => isOpen.value ? html`
            <div class="modal-overlay" @click=${closeModal}>
                <div class="modal-card danger" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" @click.stop=${() => { }}>
                    <div class="modal-header">
                        <h3 id="confirm-modal-title"><ion-icon name="alert-circle-outline"></ion-icon> ${modalTitle.value}</h3>
                        <button class="modal-close" aria-label="Cerrar" @click=${closeModal}><ion-icon name="close-outline"></ion-icon></button>
                    </div>
                    <div class="modal-body">
                        <p>${modalMessage.value}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" ref=${cancelRef} @click=${closeModal}>Cancelar</button>
                        <button class="btn btn-danger" @click=${confirm}>Confirmar</button>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}
