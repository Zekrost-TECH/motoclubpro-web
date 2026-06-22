import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { showToast } from '../../components/Toast';

export function BillingPage(): NixTemplate {
    document.title = 'Suscripción | MotoClub Pro';
    const sub = signal<any>(null);
    const payments = signal<any[]>([]);
    const billing = signal<any>(null);
    const nit = signal('');
    const billingAddress = signal('');
    const billingPhone = signal('');
    const billingContactName = signal('');
    const billingContactEmail = signal('');
    const taxRegime = signal('');
    const saving = signal(false);
    const loading = signal(true);

    effect(() => {
        Promise.all([
            api.billing.subscription().then(s => sub.update(() => s)).catch(() => { }),
            api.billing.payments().then(p => payments.update(() => p)).catch(() => { }),
            loadBilling(),
        ]).finally(() => loading.update(() => false));
    });

    function loadBilling() {
        const id = activeClub.value?.id;
        if (!id) return Promise.resolve();
        return api.clubs.getBilling(id).then(b => {
            if (b) {
                billing.update(() => b);
                nit.update(() => b.nit || '');
                billingAddress.update(() => b.billing_address || '');
                billingPhone.update(() => b.billing_phone || '');
                billingContactName.update(() => b.billing_contact_name || '');
                billingContactEmail.update(() => b.billing_contact_email || '');
                taxRegime.update(() => b.tax_regime || '');
            }
        }).catch(() => { });
    }

    async function handleSaveBilling() {

        const id = activeClub.value?.id;
        if (!id) return;
        saving.update(() => true);
        try {
            await api.clubs.updateBilling(id, {
                nit: nit.value,
                billingAddress: billingAddress.value,
                billingPhone: billingPhone.value,
                billingContactName: billingContactName.value,
                billingContactEmail: billingContactEmail.value,
                taxRegime: taxRegime.value,
            });
            showToast('Datos de facturación guardados', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', 'error');
        } finally {
            saving.update(() => false);
        }
    }

    return html`
        <div class="page-header">
            <h2>Suscripción y Billing</h2>
        </div>
        ${() => loading.value
            ? html`<p class="empty">Cargando...</p>`
            : html`
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Plan Actual</h3></div>
                        <div class="card-body">
                            ${() => {
                    const s = sub.value;
                    if (!s) return html`<p class="empty">Sin suscripción activa.</p>`;
                    return html`
                                    <div class="plan-info">
                                        <div class="plan-name">${(s.plan || s.plan_id)?.toUpperCase()}</div>
                                        <div class="plan-status badge badge-${s.status}">${s.status}</div>
                                        <p><strong>Vigencia:</strong> ${new Date(s.startDate || s.current_period_end).toLocaleDateString('es-CO')} — ${new Date(s.endDate || s.current_period_end).toLocaleDateString('es-CO')}</p>
                                        <p><strong>Miembros:</strong> ${s.currentMembers || 0} / ${s.memberLimit || '-'}</p>
                                    </div>
                                `;
                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Datos de Facturación</h3></div>
                        <div class="card-body">
                            <form @submit.prevent=${handleSaveBilling}>
                                <div class="form-group">
                                    <label>NIT</label>
                                    <input type="text" .value=${() => nit.value} @input=${(e: any) => nit.update(() => e.target.value)} placeholder="900.XXX.XXX-X" />
                                </div>
                                <div class="form-group">
                                    <label>Razón Social / Contacto</label>
                                    <input type="text" .value=${() => billingContactName.value} @input=${(e: any) => billingContactName.update(() => e.target.value)} placeholder="Nombre del contacto de facturación" />
                                </div>
                                <div class="form-group">
                                    <label>Email de Facturación</label>
                                    <input type="email" .value=${() => billingContactEmail.value} @input=${(e: any) => billingContactEmail.update(() => e.target.value)} />
                                </div>
                                <div class="form-group">
                                    <label>Teléfono de Facturación</label>
                                    <input type="text" .value=${() => billingPhone.value} @input=${(e: any) => billingPhone.update(() => e.target.value)} />
                                </div>
                                <div class="form-group">
                                    <label>Dirección de Facturación</label>
                                    <input type="text" .value=${() => billingAddress.value} @input=${(e: any) => billingAddress.update(() => e.target.value)} />
                                </div>
                                <div class="form-group">
                                    <label>Régimen Tributario</label>
                                    <input type="text" .value=${() => taxRegime.value} @input=${(e: any) => taxRegime.update(() => e.target.value)} placeholder="Simplificado, Común, etc." />
                                </div>
                                <button type="submit" class="btn btn-primary" ?disabled=${() => saving.value}>
                                    ${() => saving.value ? 'Guardando...' : 'Guardar Datos'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card" style="margin-top:1.5rem;">
                    <div class="card-header"><h3>Historial de Pagos</h3></div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th><th></th></tr></thead>
                            <tbody>
                                ${() => {
                    const list = payments.value || [];
                    if (!list.length) return html`<tr><td colspan="5" class="empty">Sin pagos registrados.</td></tr>`;
                    return list.map((p: any) => html`
                                        <tr>
                                            <td>${new Date(p.date).toLocaleDateString('es-CO')}</td>
                                            <td>$${p.amount.toLocaleString()} COP</td>
                                            <td>${p.method}</td>
                                            <td><span class="badge badge-${p.status}">${p.status}</span></td>
                                            <td>${p.invoiceUrl ? html`<a href=${p.invoiceUrl} target="_blank">Factura</a>` : '-'}</td>
                                        </tr>
                                    `);
                }}
                            </tbody>
                        </table>
                    </div>
                </div>
            `}
    `;
}
