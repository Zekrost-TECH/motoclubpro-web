import { router } from '../../router';
import { html, signal, NixComponent, createForm, required, watch } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries, updateQueryData } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { formatEnum } from '../../utils/labels';
import { routerPath } from '../../stores/router.store';
import type { SupportPoint } from '../../types';

const supportTypes = [
    { value: 'taller', label: 'Taller' },
    { value: 'llanteria', label: 'Llantería' },
    { value: 'gasolinera', label: 'Gasolinera' },
    { value: 'grua', label: 'Grúa' },
    { value: 'descanso', label: 'Descanso' },
    { value: 'hospital', label: 'Hospital' },
];

export class SupportPointDetailPage extends NixComponent {
    private router = router;
    private _unwatch!: () => void;

    isEditing = signal(false);
    isCreate = signal(false);
    isEditRoute = signal(false);
    isVerifying = signal(false);

    get pointId() { return this.router.params.value?.id || ''; }
    get isView() { return !this.isCreate.value && !this.isEditRoute.value; }

    pointQuery = createQuery(
        'support-points/detail',
        async ({ id }: { id: string }) => {
            if (!id) return null;
            return api.supportPoints.get(id);
        },
        {
            params: () => ({ id: this.pointId }),
            staleTime: 30_000,
        }
    );

    form = createForm(
        {
            name: '',
            type: 'taller',
            city: '',
            address: '',
            phone: '',
            hours: '',
            lat: '',
            lng: '',
        },
        {
            validators: {
                name: [required()],
                city: [required()],
                lat: [required()],
                lng: [required()],
            },
            validateOn: 'blur',
        }
    );

    saveCommand = createCommand(
        'support-points/save',
        async (payload: { id?: string; data: Partial<SupportPoint> }) => {
            if (payload.id) return api.supportPoints.update(payload.id, payload.data);
            return api.supportPoints.create(payload.data);
        },
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('support-points/list');
                invalidateQueries('support-points/detail');
            },
        }
    );

    verifyCommand = createCommand(
        'support-points/verify',
        async ({ id, verified }: { id: string; verified: boolean }) => api.supportPoints.verify(id, verified),
        {
            mode: 'latest',
            onSuccess: (result) => {
                updateQueryData<SupportPoint>('support-points/detail', (current) =>
                    (current ? { ...current, verified: result.verified } : current) as SupportPoint
                    , { params: { id: this.pointId } });
                this.isVerifying.update(() => false);
            },
            onError: () => this.isVerifying.update(() => false),
        }
    );

    onInit() {
        const path = routerPath.value;
        this.isCreate.update(() => path === '/support/create');
        this.isEditRoute.update(() => path.endsWith('/edit'));
        this.isEditing.update(() => this.isCreate.value || this.isEditRoute.value);
        this._unwatch = watch(
            () => this.pointQuery.data.value,
            (data) => {
                if (!data) return;
                const point = data as SupportPoint;
                this.form.reset({
                    name: point.name || '',
                    type: point.type || 'taller',
                    city: point.city || '',
                    address: point.address || '',
                    phone: point.phone || '',
                    hours: point.hours || '',
                    lat: point.lat != null ? String(point.lat) : '',
                    lng: point.lng != null ? String(point.lng) : '',
                });
            },
            { immediate: true }
        );
    }

    onMount() {
        if (this.isCreate.value) {
            document.title = 'Nuevo Punto de Apoyo | MotoClub Pro';
            this.form.reset({
                name: '', type: 'taller', city: '', address: '', phone: '', hours: '', lat: '', lng: '',
            });
        } else {
            document.title = 'Punto de Apoyo | MotoClub Pro';
        }
    }

    onUnmount() {
        this._unwatch?.();
        this.form.dispose();
    }

    async handleSubmit(values: {
        name: string;
        type: string;
        city: string;
        address: string;
        phone: string;
        hours: string;
        lat: string;
        lng: string;
    }) {
        const lat = parseFloat(values.lat);
        const lng = parseFloat(values.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            showToast('Latitud y longitud deben ser números válidos', 'error');
            return;
        }
        try {
            await this.saveCommand.executeAsync({
                id: this.isCreate.value ? undefined : this.pointId,
                data: {
                    name: values.name,
                    type: values.type,
                    city: values.city,
                    address: values.address,
                    phone: values.phone,
                    hours: values.hours,
                    lat,
                    lng,
                },
            });
            showToast(this.isCreate.value ? 'Punto creado' : 'Punto actualizado', 'success');
            this.router.navigate('/support');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar punto', 'error');
        }
    }

    async toggleVerify() {
        const point = this.pointQuery.data.value;
        if (!point) return;
        this.isVerifying.update(() => true);
        try {
            await this.verifyCommand.executeAsync({ id: point.id, verified: !point.verified });
            showToast(point.verified ? 'Punto rechazado' : 'Punto verificado', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error al cambiar verificación', 'error');
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">${() => this.isCreate.value ? 'Nuevo Punto de Apoyo' : (this.isEditing.value ? 'Editar Punto de Apoyo' : 'Detalle del Punto')}</h1>
            </div>
            <div class="page-header-actions">
                ${() => this.isView && !this.isEditing.value ? html`
                    <button class="btn btn-secondary" @click=${() => this.router.navigate('/support')}>Volver</button>
                    <button class="btn btn-primary" @click=${() => this.isEditing.update(() => true)}>Editar</button>
                ` : html`
                    <button class="btn btn-secondary" @click=${() => this.router.navigate('/support')}>Cancelar</button>
                `}
            </div>
        </div>
        ${() => {
                if (this.isCreate.value) return this.renderForm();
                const point = this.pointQuery.data.value;
                if (this.pointQuery.status.value === 'pending') return html`<div class="empty"><p>Cargando...</p></div>`;
                if (!point) return html`<div class="alert alert-error">Punto no encontrado</div>`;
                if (this.isEditing.value) return this.renderForm();
                return this.renderDetail(point);
            }}
    `;
    }

    renderForm() {
        return html`
        <form class="form-card" @submit.prevent=${this.form.handleSubmit((values) => this.handleSubmit(values))}>
            <div class="form-grid">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" value=${() => this.form.fields.name.value.value} @input=${this.form.fields.name.onInput} @blur=${this.form.fields.name.onBlur} placeholder="Ej. Taller Motos El Paisa" required />
                    ${() => this.form.fields.name.error.value ? html`<span class="err">${this.form.fields.name.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Tipo</label>
                    <select value=${() => this.form.fields.type.value.value} @change=${this.form.fields.type.onInput}>
                        ${supportTypes.map((t) => html`<option value=${t.value}>${t.label}</option>`)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Ciudad</label>
                    <input type="text" value=${() => this.form.fields.city.value.value} @input=${this.form.fields.city.onInput} @blur=${this.form.fields.city.onBlur} placeholder="Ej. Cartagena" required />
                    ${() => this.form.fields.city.error.value ? html`<span class="err">${this.form.fields.city.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" value=${() => this.form.fields.address.value.value} @input=${this.form.fields.address.onInput} placeholder="Ej. Cra 30 #45-12" />
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" value=${() => this.form.fields.phone.value.value} @input=${this.form.fields.phone.onInput} placeholder="Ej. +57 315 111 2233" />
                </div>
                <div class="form-group">
                    <label>Horario</label>
                    <input type="text" value=${() => this.form.fields.hours.value.value} @input=${this.form.fields.hours.onInput} placeholder="Ej. Lun-Sáb 7am-6pm" />
                </div>
                <div class="form-group">
                    <label>Latitud</label>
                    <input type="number" step="any" value=${() => this.form.fields.lat.value.value} @input=${this.form.fields.lat.onInput} @blur=${this.form.fields.lat.onBlur} placeholder="Ej. 10.395" required />
                    ${() => this.form.fields.lat.error.value ? html`<span class="err">${this.form.fields.lat.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Longitud</label>
                    <input type="number" step="any" value=${() => this.form.fields.lng.value.value} @input=${this.form.fields.lng.onInput} @blur=${this.form.fields.lng.onBlur} placeholder="Ej. -75.51" required />
                    ${() => this.form.fields.lng.error.value ? html`<span class="err">${this.form.fields.lng.error.value}</span>` : null}
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" disabled=${() => this.saveCommand.isPending.value || this.form.isSubmitting.value}>
                    ${() => this.saveCommand.isPending.value || this.form.isSubmitting.value ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
        `;
    }

    renderDetail(point: SupportPoint) {
        const isVerified = () => this.pointQuery.data.value?.verified ?? point.verified;
        const badgeClass = () => isVerified() ? 'badge-success' : 'badge-warning';
        const badgeText = () => isVerified() ? 'Verificado' : 'Pendiente';
        const verifyBtnClass = () => isVerified() ? 'btn-danger' : 'btn-primary';
        const verifyBtnText = () => isVerified() ? 'Rechazar' : 'Verificar';
        return html`
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-header">
                    <h3>${point.name}</h3>
                    <span class=${() => `badge ${badgeClass()}`}>${() => badgeText()}</span>
                </div>
                <div class="card-body">
                    <div class="stats-grid">
                        <div class="stat-item"><span>Tipo</span><strong>${formatEnum(point.type)}</strong></div>
                        <div class="stat-item"><span>Ciudad</span><strong>${point.city || '-'}</strong></div>
                        <div class="stat-item"><span>Dirección</span><strong>${point.address || '-'}</strong></div>
                        <div class="stat-item"><span>Teléfono</span><strong>${point.phone || '-'}</strong></div>
                        <div class="stat-item"><span>Horario</span><strong>${point.hours || '-'}</strong></div>
                        <div class="stat-item"><span>Rating</span><strong><ion-icon name="star" style="color:var(--mc-warning-500);"></ion-icon> ${point.rating || 0} (${point.reviewCount || 0})</strong></div>
                    </div>
                    <div class="stat-item" style="margin-top:var(--mc-space-3);">
                        <span>Ubicación</span>
                        <strong>Lat: ${point.lat}, Lng: ${point.lng}</strong>
                    </div>
                    <div class="form-actions" style="margin-top:var(--mc-space-4);">
                        <button class=${() => `btn ${verifyBtnClass()}`} @click=${() => this.toggleVerify()} disabled=${() => this.isVerifying.value}>
                            ${() => this.isVerifying.value ? '...' : verifyBtnText()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
}
