import { html, createForm, required } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import type { ClubRideRole } from '../types';

interface RideRoleModalProps {
    role?: ClubRideRole | null;
    onSave: (payload: { slug: string; name: string; isUnique: boolean; sortOrder: number }) => void;
    onClose: () => void;
}

export function RideRoleModal({ role, onSave, onClose }: RideRoleModalProps): NixTemplate {
    const isEditing = !!role;
    const form = createForm(
        {
            slug: role?.slug ?? '',
            name: role?.name ?? '',
            isUnique: role?.isUnique ?? false,
            sortOrder: role?.sortOrder ?? 0,
        },
        {
            validators: {
                slug: [required()],
                name: [required()],
            },
            validateOn: 'blur',
        }
    );

    const handleSubmit = () => {
        const values = form.values.value;
        onSave({
            slug: values.slug,
            name: values.name,
            isUnique: values.isUnique,
            sortOrder: values.sortOrder,
        });
    };

    const title = isEditing ? 'Editar rol' : 'Nuevo rol';
    return html`
        <div class="modal-overlay" @click=${onClose}>
            <div class="modal-card" @click.stop=${() => { }}>
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" @click=${onClose}><ion-icon name="close-outline"></ion-icon></button>
                </div>
                <form class="modal-body" @submit.prevent=${form.handleSubmit(handleSubmit)}>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Slug</label>
                            <input type="text" value=${() => form.fields.slug.value.value} @input=${form.fields.slug.onInput} @blur=${form.fields.slug.onBlur} placeholder="puntero" required />
                            ${() => form.fields.slug.error.value ? html`<p class="form-error">${form.fields.slug.error.value}</p>` : ''}
                        </div>
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" value=${() => form.fields.name.value.value} @input=${form.fields.name.onInput} @blur=${form.fields.name.onBlur} placeholder="Puntero" required />
                            ${() => form.fields.name.error.value ? html`<p class="form-error">${form.fields.name.error.value}</p>` : ''}
                        </div>
                        <div class="form-group">
                            <label>Orden</label>
                            <input type="number" value=${() => form.fields.sortOrder.value.value} @input=${form.fields.sortOrder.onInput} />
                        </div>
                        <div class="form-group modal-checkbox">
                            <input type="checkbox" checked=${() => form.fields.isUnique.value.value} @change=${(e: any) => form.fields.isUnique.setValue(e.target.checked)} id="modalIsUnique" />
                            <label for="modalIsUnique">Único por evento</label>
                        </div>
                    </div>
                    <div class="modal-footer" style="margin-top:var(--mc-space-4);">
                        <button type="button" class="btn btn-secondary" @click=${onClose}>Cancelar</button>
                        <button type="submit" class="btn btn-primary" disabled=${() => form.isSubmitting.value}>Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
