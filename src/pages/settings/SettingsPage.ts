import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { showToast } from '../../components/Toast';
import { SkeletonCard } from '../../components/Skeleton';

export function SettingsPage(): NixTemplate {
    document.title = 'Configuración | MotoClub Pro';
    const name = signal('');
    const city = signal('');
    const department = signal('');
    const description = signal('');
    const saving = signal(false);
    const loading = signal(true);

    function load() {
        const id = activeClub.value?.id;
        if (!id) return;
        loading.update(() => true);
        api.clubs.get(id).then(c => {
            name.update(() => c.name || '');
            city.update(() => c.city || '');
            department.update(() => c.department || '');
            description.update(() => (c as any).description || '');
            loading.update(() => false);
        }).catch(() => {
            loading.update(() => false);
            showToast('Error al cargar configuración', 'error');
        });
    }

    effect(() => { load(); });

    async function handleSubmit() {

        const id = activeClub.value?.id;
        if (!id) return;
        saving.update(() => true);
        try {
            await api.clubs.update(id, {
                name: name.value,
                city: city.value,
                department: department.value,
                description: description.value,
            });
            showToast('Configuración guardada', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', 'error');
        } finally {
            saving.update(() => false);
        }
    }

    return html`
        <div class="page-header">
            <h2>Configuración del Club</h2>
        </div>
        ${() => loading.value
            ? html`<div class="form-card">${SkeletonCard()}</div>`
            : html`
                <form class="form-card" @submit.prevent=${handleSubmit}>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Nombre del Club</label>
                            <input type="text" .value=${() => name.value} @input=${(e: any) => name.update(() => e.target.value)} required />
                        </div>
                        <div class="form-group">
                            <label>Slug</label>
                            <input type="text" .value=${activeClub.value?.slug || ''} readonly style="background:#f5f5f5;" />
                        </div>
                        <div class="form-group">
                            <label>Ciudad</label>
                            <input type="text" .value=${() => city.value} @input=${(e: any) => city.update(() => e.target.value)} />
                        </div>
                        <div class="form-group">
                            <label>Departamento</label>
                            <input type="text" .value=${() => department.value} @input=${(e: any) => department.update(() => e.target.value)} />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea rows="4" .value=${() => description.value} @input=${(e: any) => description.update(() => e.target.value)}></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" ?disabled=${() => saving.value}>
                            ${() => saving.value ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            `}
    `;
}
