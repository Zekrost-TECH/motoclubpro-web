import { html, signal, NixComponent, effect, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { setPageTitle } from '../../stores/router.store';
import { showToast } from '../../components/Toast';
import { SkeletonCard } from '../../components/Skeleton';
import type { Subscription, Payment } from '../../types';

export class BillingPage extends NixComponent {
    nit = signal('');
    billingAddress = signal('');
    billingPhone = signal('');
    billingContactName = signal('');
    billingContactEmail = signal('');
    taxRegime = signal('');
    private _formLoaded = false;

    subscriptionQuery = createQuery('billing/subscription', () => api.billing.subscription() as Promise<Subscription>, { staleTime: 60_000 });
    paymentsQuery = createQuery('billing/payments', () => api.billing.payments() as Promise<Payment[]>, { staleTime: 60_000 });
    clubBillingQuery = createQuery(
        'club/billing',
        async ({ clubId }: { clubId: string }) => {
            if (!clubId) throw new Error('No hay club activo');
            return api.clubs.getBilling(clubId);
        },
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );

    updateBilling = createCommand(
        'club/billing/update',
        async (payload: { clubId: string; data: any }) => api.clubs.updateBilling(payload.clubId, payload.data),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('club/billing'),
        }
    );

    onInit() {
        effect(() => {
            const data = this.clubBillingQuery.data.value;
            if (data && !this._formLoaded) {
                this.fillForm(data);
                this._formLoaded = true;
            }
        });
    }

    onMount() {
        setPageTitle('Suscripción');
        const data = this.clubBillingQuery.data.value;
        if (data && !this._formLoaded) {
            this.fillForm(data);
            this._formLoaded = true;
        }
    }

    fillForm(data: any) {
        if (!data) return;
        this.nit.update(() => data.nit || '');
        this.billingAddress.update(() => data.billing_address || '');
        this.billingPhone.update(() => data.billing_phone || '');
        this.billingContactName.update(() => data.billing_contact_name || '');
        this.billingContactEmail.update(() => data.billing_contact_email || '');
        this.taxRegime.update(() => data.tax_regime || '');
    }

    async handleSaveBilling() {
        const id = activeClub.value?.id;
        if (!id) return;
        try {
            await this.updateBilling.executeAsync({
                clubId: id,
                data: {
                    nit: this.nit.value,
                    billingAddress: this.billingAddress.value,
                    billingPhone: this.billingPhone.value,
                    billingContactName: this.billingContactName.value,
                    billingContactEmail: this.billingContactEmail.value,
                    taxRegime: this.taxRegime.value,
                },
            });
            showToast('Datos de facturación guardados', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', 'error');
        }
    }

    isLoading() {
        return this.subscriptionQuery.status.value === 'pending' ||
            this.paymentsQuery.status.value === 'pending' ||
            this.clubBillingQuery.status.value === 'pending';
    }

    hasError() {
        return this.subscriptionQuery.status.value === 'error' ||
            this.paymentsQuery.status.value === 'error' ||
            this.clubBillingQuery.status.value === 'error';
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Suscripción</h1>
                <p class="page-subtitle">Plan, facturación y pagos</p>
            </div>
        </div>
        ${() => this.isLoading()
                ? html`<div class="dashboard-grid">${SkeletonCard()}${SkeletonCard()}</div>`
                : this.hasError()
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar datos de suscripción</div>`
                    : html`
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="card-outline"></ion-icon> Plan Actual</h3></div>
                        <div class="card-body">
                            ${() => {
                            const s = this.subscriptionQuery.data.value;
                            if (!s) return html`
                                    <div class="empty">
                                        <ion-icon name="card-outline" class="empty-icon"></ion-icon>
                                        <h4>Sin suscripción activa</h4>
                                    </div>`;
                            return html`
                                    <div class="plan-info">
                                        <div class="plan-name">${(s.plan)?.toUpperCase()}</div>
                                        <div class="plan-status"><span class=${`badge badge-${s.status}`}>${s.status}</span></div>
                                        <div class="stat-list" style="margin-top:var(--mc-space-4);">
                                            <div class="stat-item"><span>Vigencia</span><strong>${s.startDate ? new Date(s.startDate).toLocaleDateString('es-CO') : '-'} — ${s.endDate ? new Date(s.endDate).toLocaleDateString('es-CO') : '-'}</strong></div>
                                            <div class="stat-item"><span>Miembros</span><strong>${s.currentMembers ?? 0} / ${s.memberLimit ?? '-'}</strong></div>
                                        </div>
                                    </div>
                                `;
                        }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="business-outline"></ion-icon> Datos de Facturación</h3></div>
                        <div class="card-body">
                            <form @submit.prevent=${() => this.handleSaveBilling()}>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>NIT</label>
                                        <input type="text" value=${() => this.nit.value} @input=${(e: InputEvent) => this.nit.update(() => (e.target as HTMLInputElement).value)} placeholder="900.XXX.XXX-X" />
                                    </div>
                                    <div class="form-group">
                                        <label>Razón Social / Contacto</label>
                                        <input type="text" value=${() => this.billingContactName.value} @input=${(e: InputEvent) => this.billingContactName.update(() => (e.target as HTMLInputElement).value)} placeholder="Nombre del contacto de facturación" />
                                    </div>
                                    <div class="form-group">
                                        <label>Email de Facturación</label>
                                        <input type="email" value=${() => this.billingContactEmail.value} @input=${(e: InputEvent) => this.billingContactEmail.update(() => (e.target as HTMLInputElement).value)} />
                                    </div>
                                    <div class="form-group">
                                        <label>Teléfono de Facturación</label>
                                        <input type="text" value=${() => this.billingPhone.value} @input=${(e: InputEvent) => this.billingPhone.update(() => (e.target as HTMLInputElement).value)} />
                                    </div>
                                    <div class="form-group">
                                        <label>Dirección de Facturación</label>
                                        <input type="text" value=${() => this.billingAddress.value} @input=${(e: InputEvent) => this.billingAddress.update(() => (e.target as HTMLInputElement).value)} />
                                    </div>
                                    <div class="form-group">
                                        <label>Régimen Tributario</label>
                                        <input type="text" value=${() => this.taxRegime.value} @input=${(e: InputEvent) => this.taxRegime.update(() => (e.target as HTMLInputElement).value)} placeholder="Simplificado, Común, etc." />
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary" disabled=${() => this.updateBilling.isPending.value}>
                                        <ion-icon name="save-outline"></ion-icon>
                                        ${() => this.updateBilling.isPending.value ? 'Guardando...' : 'Guardar Datos'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card" style="margin-top:var(--mc-space-6);">
                    <div class="card-header"><h3><ion-icon name="receipt-outline"></ion-icon> Historial de Pagos</h3></div>
                    <div class="card-body">
                        <div class="data-table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th><th></th></tr></thead>
                                <tbody>
                                    ${() => {
                            const list = this.paymentsQuery.data.value || [];
                            if (!list.length) return html`<tr><td colspan="5" class="empty">Sin pagos registrados.</td></tr>`;
                            return repeat(list, (p: Payment) => p.id, (p: Payment) => {
                                const badgeClass = `badge badge-${p.status}`;
                                return html`
                                            <tr>
                                                <td>${new Date(p.date).toLocaleDateString('es-CO')}</td>
                                                <td>$${Number(p.amount).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} COP</td>
                                                <td>${p.method}</td>
                                                <td><span class=${badgeClass}>${p.status}</span></td>
                                                <td>${p.invoiceUrl ? html`<a href=${p.invoiceUrl} target="_blank">Factura</a>` : '-'}</td>
                                            </tr>
                                        `;
                            });
                        }}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `}
    `;
    }
}
