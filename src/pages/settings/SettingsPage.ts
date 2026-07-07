import { html, NixComponent, createForm, required } from '@deijose/nix-js';
import { createQuery, createCommand, setQueryData } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { setPageTitle } from '../../stores/router.store';
import { showToast } from '../../components/Toast';
import { SkeletonCard } from '../../components/Skeleton';
import { themeStore } from '../../stores/theme.store';
import { PRIVACY_POLICY_URL } from '../../config/urls';

export class SettingsPage extends NixComponent {
    form = createForm(
        { name: '', city: '', department: '', description: '' },
        {
            validators: {
                name: [required()],
            },
            validateOn: 'blur',
        }
    );

    clubQuery = createQuery(
        'club/settings',
        async ({ slug }: { slug: string }) => {
            if (!slug) throw new Error('No hay club activo');
            return api.clubs.getBySlug(slug);
        },
        {
            params: () => ({ slug: activeClub.value?.slug || '' }),
            staleTime: 60_000,
        }
    );

    updateClub = createCommand(
        'club/update',
        async (payload: { name: string; city: string; department: string; description: string }) => {
            const id = activeClub.value?.id;
            if (!id) throw new Error('No hay club activo');
            return api.clubs.update(id, payload);
        },
        {
            mode: 'latest',
            dedupeWindowMs: 300,
            onSuccess: (data) => {
                setQueryData('club/settings', data);
            },
        }
    );

    onInit() {
        setPageTitle('Configuración');
    }

    onMount() {
        const data = this.clubQuery.data.value;
        if (data) {
            this.form.fields.name.value.update(() => data.name || '');
            this.form.fields.city.value.update(() => data.city || '');
            this.form.fields.department.value.update(() => data.department || '');
            this.form.fields.description.value.update(() => data.description || '');
        }
    }

    async handleSubmit(values: { name: string; city: string; department: string; description: string }) {
        try {
            await this.updateClub.executeAsync(values);
            showToast('Configuración guardada', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', 'error');
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Configuración</h1>
                <p class="page-subtitle">Administra la información de ${() => activeClub.value?.name || 'tu club'}</p>
            </div>
        </div>
        <div class="form-card">
            <h3 class="form-section-title"><ion-icon name="color-palette-outline"></ion-icon> Apariencia</h3>
            <div class="form-group">
                <label>Tema</label>
                <div class="theme-options">
                    <button class=${() => `theme-option ${themeStore.theme.value === 'dark' ? 'active' : ''}`} @click=${() => themeStore.setTheme('dark')}>
                        <ion-icon name="moon-outline"></ion-icon>
                        <span>Oscuro</span>
                    </button>
                    <button class=${() => `theme-option ${themeStore.theme.value === 'light' ? 'active' : ''}`} @click=${() => themeStore.setTheme('light')}>
                        <ion-icon name="sunny-outline"></ion-icon>
                        <span>Claro</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="form-card">
            <h3 class="form-section-title"><ion-icon name="shield-checkmark-outline"></ion-icon> Legal</h3>
            <div class="form-group">
                <a href=${PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" class="link-btn">
                    <ion-icon name="open-outline"></ion-icon>
                    <span>Política de privacidad</span>
                </a>
            </div>
        </div>
        ${() => this.clubQuery.status.value === 'pending'
                ? html`<div class="form-card">${SkeletonCard()}</div>`
                : this.clubQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar configuración</div>`
                    : html`
                    <form class="form-card" @submit.prevent=${this.form.handleSubmit((values) => this.handleSubmit(values))}>
                        <h3 class="form-section-title">Información general</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Nombre del Club</label>
                                <input type="text" value=${() => this.form.fields.name.value.value} @input=${this.form.fields.name.onInput} @blur=${this.form.fields.name.onBlur} required />
                                ${() => this.form.fields.name.error.value ? html`<p class="form-error">${this.form.fields.name.error.value}</p>` : ''}
                            </div>
                            <div class="form-group">
                                <label>Slug</label>
                                <input type="text" value=${() => activeClub.value?.slug || ''} readonly style="background:var(--mc-bg-card-hover);color:var(--mc-text-muted);cursor:not-allowed;" />
                            </div>
                            <div class="form-group">
                                <label>Ciudad</label>
                                <input type="text" value=${() => this.form.fields.city.value.value} @input=${this.form.fields.city.onInput} />
                            </div>
                            <div class="form-group">
                                <label>Departamento</label>
                                <input type="text" value=${() => this.form.fields.department.value.value} @input=${this.form.fields.department.onInput} />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea rows="4" value=${() => this.form.fields.description.value.value} @input=${this.form.fields.description.onInput}></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" disabled=${() => this.form.isSubmitting.value || this.updateClub.isPending.value}>
                                <ion-icon name="save-outline"></ion-icon>
                                ${() => this.updateClub.isPending.value ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                `}
    `;
    }
}
