import { html, signal, NixComponent, effect, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { setPageTitle } from '../../stores/router.store';
import { showToast } from '../../components/Toast';
import { openConfirm } from '../../components/ConfirmModal';
import { SkeletonCard } from '../../components/Skeleton';
import type { Subscription, Payment, Plan, WidgetCheckoutConfig } from '../../types';

declare global {
    interface Window {
        WidgetCheckout: new (config: WidgetCheckoutConfig) => { open: () => void };
    }
}

export class BillingPage extends NixComponent {
    nit = signal('');
    billingAddress = signal('');
    billingPhone = signal('');
    billingContactName = signal('');
    billingContactEmail = signal('');
    taxRegime = signal('');
    private _formLoaded = false;

    // Checkout / plan
    selectedPlanId = signal('');
    billingCycle = signal<'monthly' | 'yearly'>('monthly');
    checkoutBusy = signal(false);

    // Método de pago
    pmType = signal<'CARD' | 'NEQUI'>('CARD');
    pmNumber = signal('');
    pmCvc = signal('');
    pmExpMonth = signal('');
    pmExpYear = signal('');
    pmCardHolder = signal('');
    pmPhone = signal('');
    pmFullName = signal('');
    pmLegalId = signal('');
    pmSaving = signal(false);
    pmRemoving = signal(false);

    // Cancelación
    cancelBusy = signal(false);
    cancelReason = signal('');

    subscriptionQuery = createQuery('billing/subscription', () => api.billing.subscription() as Promise<Subscription>, { staleTime: 30_000 });
    paymentsQuery = createQuery('billing/payments', () => api.billing.payments() as Promise<Payment[]>, { staleTime: 60_000 });
    plansQuery = createQuery('billing/plans', () => api.plans.list() as Promise<Plan[]>, { staleTime: 5 * 60_000 });
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
        effect(() => {
            const plans = this.plansQuery.data.value;
            if (plans?.length && !this.selectedPlanId.value) {
                const sub = this.subscriptionQuery.data.value;
                this.selectedPlanId.update(() => plans[0].id);
                if (sub?.planId && sub.planId !== 'prueba') {
                    this.selectedPlanId.update(() => sub.planId);
                }
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
        this.billingAddress.update(() => data.billingAddress || '');
        this.billingPhone.update(() => data.billingPhone || '');
        this.billingContactName.update(() => data.billingContactName || '');
        this.billingContactEmail.update(() => data.billingContactEmail || '');
        this.taxRegime.update(() => data.taxRegime || '');
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

    private loadWidgetScript(): Promise<void> {
        if (window.WidgetCheckout) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://checkout.wompi.co/widget.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('No se pudo cargar el widget de pago'));
            document.head.appendChild(s);
        });
    }

    formatCents(cents: number): string {
        return `$${Number(cents / 100).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
    }

    async handleCheckout() {
        if (!this.selectedPlanId.value) {
            showToast('Selecciona un plan primero', 'error');
            return;
        }
        this.checkoutBusy.update(() => true);
        try {
            const config = await api.billing.checkout(this.selectedPlanId.value, this.billingCycle.value);
            await this.loadWidgetScript();
            const widget = new window.WidgetCheckout(config);
            widget.open();
            showToast('Completa el pago en la ventana de Wompi', 'info');
            // El webhook confirma; refresca el estado al volver del redirect
            setTimeout(() => { invalidateQueries('billing/subscription'); invalidateQueries('billing/payments'); }, 8000);
        } catch (err: any) {
            showToast(err.message || 'Error al iniciar el pago', 'error');
        } finally {
            this.checkoutBusy.update(() => false);
        }
    }

    async handleSavePaymentMethod() {
        const type = this.pmType.value;
        if (type === 'CARD' && (!this.pmNumber.value || !this.pmCvc.value || !this.pmExpMonth.value || !this.pmExpYear.value)) {
            showToast('Completa los datos de la tarjeta', 'error');
            return;
        }
        if (type === 'NEQUI' && (!this.pmPhone.value || !this.pmFullName.value || !this.pmLegalId.value)) {
            showToast('Completa teléfono, nombre y documento para Nequi', 'error');
            return;
        }
        this.pmSaving.update(() => true);
        try {
            const cfg = await api.billing.acceptanceToken();
            let token: string;
            if (type === 'CARD') {
                const res = await fetch(`${cfg.baseUrl}/tokens/cards`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.publicKey}` },
                    body: JSON.stringify({
                        number: this.pmNumber.value.replace(/\s/g, ''),
                        cvc: this.pmCvc.value,
                        exp_month: this.pmExpMonth.value,
                        exp_year: this.pmExpYear.value,
                        card_holder: this.pmCardHolder.value || 'Titular',
                    }),
                });
                const body = await res.json();
                if (!res.ok || !body?.data?.id) {
                    throw new Error(body?.error?.messages ? JSON.stringify(body.error.messages) : 'Token de tarjeta inválido');
                }
                token = body.data.id;
            } else {
                const res = await fetch(`${cfg.baseUrl}/tokens/nequi`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.publicKey}` },
                    body: JSON.stringify({ phone_number: this.pmPhone.value }),
                });
                const body = await res.json();
                if (!res.ok || !body?.data?.id) {
                    throw new Error('No se pudo iniciar el registro de Nequi');
                }
                token = body.data.id;
            }

            const billingEmail = this.billingContactEmail.value || undefined;
            await api.billing.paymentSources.create({
                type,
                token,
                customerEmail: billingEmail,
                customerData:
                    type === 'NEQUI'
                        ? { fullName: this.pmFullName.value, phoneNumber: this.pmPhone.value, legalId: this.pmLegalId.value, legalIdType: 'CC' }
                        : undefined,
            });

            showToast(type === 'NEQUI' ? 'Nequi en proceso: confirma la suscripción en tu app' : 'Método de pago guardado', 'success');
            if (type === 'CARD') {
                this.pmNumber.update(() => '');
                this.pmCvc.update(() => '');
            }
            invalidateQueries('billing/subscription');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar el método de pago', 'error');
        } finally {
            this.pmSaving.update(() => false);
        }
    }

    async handleRemovePaymentMethod() {
        this.pmRemoving.update(() => true);
        try {
            await api.billing.paymentSources.remove();
            showToast('Método de pago eliminado', 'success');
            invalidateQueries('billing/subscription');
        } catch (err: any) {
            showToast(err.message || 'Error al eliminar', 'error');
        } finally {
            this.pmRemoving.update(() => false);
        }
    }

    async handleCancelSubscription() {
        openConfirm(
            'Cancelar suscripción',
            'La suscripción se mantendrá activa hasta el final del período pagado y no se renovará. ¿Continuar?',
            async () => {
                this.cancelBusy.update(() => true);
                try {
                    await api.billing.cancelSubscription(this.cancelReason.value || undefined);
                    showToast('Suscripción cancelada al final del período', 'success');
                    invalidateQueries('billing/subscription');
                } catch (err: any) {
                    showToast(err.message || 'Error al cancelar', 'error');
                } finally {
                    this.cancelBusy.update(() => false);
                }
            }
        );
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
                                        <div class="plan-name">${(s.planName || s.planId || 'PLAN')?.toUpperCase()}</div>
                                        <div class="plan-status"><span class=${`badge badge-${s.status}`}>${s.status}</span></div>
                                        <div class="stat-list" style="margin-top:var(--mc-space-4);">
                                            <div class="stat-item"><span>Vigencia</span><strong>${s.startDate ? new Date(s.startDate).toLocaleDateString('es-CO') : '-'} — ${s.endDate ? new Date(s.endDate).toLocaleDateString('es-CO') : '-'}</strong></div>
                                            <div class="stat-item"><span>Precio</span><strong>${s.billingCycle === 'yearly' ? this.formatCents(s.priceYearly * 100) : this.formatCents(s.price * 100)} ${s.billingCycle === 'yearly' ? '/ año' : '/ mes'}</strong></div>
                                            <div class="stat-item"><span>Miembros</span><strong>${s.currentMembers ?? 0} / ${s.memberLimit ?? '-'}</strong></div>
                                            <div class="stat-item"><span>Método de pago</span><strong>${s.hasPaymentSource ? `Tarjeta •••• ${s.paymentMethodLast4 ?? ''}` : 'Sin guardar'}</strong></div>
                                        </div>
                                        ${s.cancelAtPeriodEnd ? html`<div class="alert alert-warning" style="margin-top:var(--mc-space-3);">Suscripción cancelada — vencerá el ${s.endDate ? new Date(s.endDate).toLocaleDateString('es-CO') : 'fin de período'}.</div>` : ''}
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
                    <div class="card-header"><h3><ion-icon name="sparkles-outline"></ion-icon> Cambiar de Plan</h3></div>
                    <div class="card-body">
                        <div class="plan-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--mc-space-3);">
                            ${() => repeat(this.plansQuery.data.value || [], (p: Plan) => p.id, (p: Plan) => {
                            const selected = this.selectedPlanId.value === p.id;
                            return html`
                                    <div class="plan-option ${selected ? 'plan-option-active' : ''}"
                                         style="border:2px solid ${selected ? 'var(--mc-primary)' : 'var(--mc-border)'};border-radius:12px;padding:var(--mc-space-4);cursor:pointer;"
                                         @click=${() => this.selectedPlanId.update(() => p.id)}>
                                        <strong>${p.name}</strong>
                                        <div style="font-size:1.1rem;">${this.formatCents(p.price_monthly_cents)}/mes</div>
                                        <div style="opacity:.7;font-size:.85rem;">${p.price_yearly_cents ? `${this.formatCents(p.price_yearly_cents)}/año` : ''}</div>
                                        <div style="opacity:.6;font-size:.8rem;">${p.max_members === -1 ? 'Miembros ilimitados' : `Hasta ${p.max_members} miembros`}</div>
                                    </div>
                                `;
                        })}
                        </div>
                        <div class="form-grid" style="margin-top:var(--mc-space-4);">
                            <div class="form-group">
                                <label>Ciclo de facturación</label>
                                <select value=${() => this.billingCycle.value} @change=${(e: Event) => this.billingCycle.update(() => (e.target as HTMLSelectElement).value as 'monthly' | 'yearly')}>
                                    <option value="monthly">Mensual</option>
                                    <option value="yearly">Anual (2 meses gratis)</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-actions" style="margin-top:var(--mc-space-3);">
                            <button class="btn btn-primary" @click=${() => this.handleCheckout()} disabled=${() => this.checkoutBusy.value || !this.selectedPlanId.value}>
                                <ion-icon name="card-outline"></ion-icon>
                                ${() => this.checkoutBusy.value ? 'Preparando...' : 'Pagar con tarjeta / Nequi'}
                            </button>
                        </div>
                        <p style="opacity:.6;font-size:.8rem;margin-top:var(--mc-space-2);">El pago se procesa de forma segura en la ventana de Wompi (tarjeta, Nequi o PSE).</p>
                    </div>
                </div>
                <div class="dashboard-grid" style="margin-top:var(--mc-space-6);">
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="wallet-outline"></ion-icon> Método de Pago</h3></div>
                        <div class="card-body">
                            <div style="display:flex;gap:var(--mc-space-2);margin-bottom:var(--mc-space-3);">
                                <button class="btn btn-${() => this.pmType.value === 'CARD' ? 'primary' : 'secondary'}" @click=${() => this.pmType.update(() => 'CARD')}>Tarjeta</button>
                                <button class="btn btn-${() => this.pmType.value === 'NEQUI' ? 'primary' : 'secondary'}" @click=${() => this.pmType.update(() => 'NEQUI')}>Nequi</button>
                            </div>
                            ${() => this.pmType.value === 'CARD' ? html`
                                <div class="form-grid">
                                    <div class="form-group" style="grid-column:1/-1;">
                                        <label>Número de tarjeta</label>
                                        <input type="text" inputmode="numeric" value=${() => this.pmNumber.value} @input=${(e: InputEvent) => this.pmNumber.update(() => (e.target as HTMLInputElement).value)} placeholder="4242 4242 4242 4242" />
                                    </div>
                                    <div class="form-group">
                                        <label>Vence (MM)</label>
                                        <input type="text" inputmode="numeric" value=${() => this.pmExpMonth.value} @input=${(e: InputEvent) => this.pmExpMonth.update(() => (e.target as HTMLInputElement).value)} placeholder="12" />
                                    </div>
                                    <div class="form-group">
                                        <label>Vence (AA)</label>
                                        <input type="text" inputmode="numeric" value=${() => this.pmExpYear.value} @input=${(e: InputEvent) => this.pmExpYear.update(() => (e.target as HTMLInputElement).value)} placeholder="29" />
                                    </div>
                                    <div class="form-group">
                                        <label>CVV</label>
                                        <input type="text" inputmode="numeric" value=${() => this.pmCvc.value} @input=${(e: InputEvent) => this.pmCvc.update(() => (e.target as HTMLInputElement).value)} placeholder="123" />
                                    </div>
                                    <div class="form-group">
                                        <label>Titular</label>
                                        <input type="text" value=${() => this.pmCardHolder.value} @input=${(e: InputEvent) => this.pmCardHolder.update(() => (e.target as HTMLInputElement).value)} placeholder="Nombre en la tarjeta" />
                                    </div>
                                </div>
                            ` : html`
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Teléfono Nequi</label>
                                        <input type="tel" value=${() => this.pmPhone.value} @input=${(e: InputEvent) => this.pmPhone.update(() => (e.target as HTMLInputElement).value)} placeholder="3001234567" />
                                    </div>
                                    <div class="form-group">
                                        <label>Nombre completo</label>
                                        <input type="text" value=${() => this.pmFullName.value} @input=${(e: InputEvent) => this.pmFullName.update(() => (e.target as HTMLInputElement).value)} />
                                    </div>
                                    <div class="form-group">
                                        <label>Documento (CC/NIT)</label>
                                        <input type="text" value=${() => this.pmLegalId.value} @input=${(e: InputEvent) => this.pmLegalId.update(() => (e.target as HTMLInputElement).value)} />
                                    </div>
                                </div>
                            `}
                            <div class="form-actions" style="margin-top:var(--mc-space-3);">
                                <button class="btn btn-secondary" @click=${() => this.handleSavePaymentMethod()} disabled=${() => this.pmSaving.value}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    ${() => this.pmSaving.value ? 'Guardando...' : 'Guardar método de pago'}
                                </button>
                                ${() => (this.subscriptionQuery.data.value?.hasPaymentSource ? html`
                                    <button class="btn btn-danger" @click=${() => this.handleRemovePaymentMethod()} disabled=${() => this.pmRemoving.value}>
                                        <ion-icon name="trash-outline"></ion-icon> Eliminar
                                    </button>
                                ` : '')}
                            </div>
                            <p style="opacity:.6;font-size:.8rem;margin-top:var(--mc-space-2);">Los datos se tokenizan directamente en Wompi; tu servidor nunca ve el número completo de la tarjeta.</p>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="ban-outline"></ion-icon> Cancelar Suscripción</h3></div>
                        <div class="card-body">
                            <p style="opacity:.8;">La suscripción seguirá activa hasta el final del período pagado y no se renovará.</p>
                            <div class="form-group" style="margin-top:var(--mc-space-3);">
                                <label>Motivo (opcional)</label>
                                <input type="text" value=${() => this.cancelReason.value} @input=${(e: InputEvent) => this.cancelReason.update(() => (e.target as HTMLInputElement).value)} placeholder="¿Por qué te vas?" />
                            </div>
                            <button class="btn btn-danger" style="margin-top:var(--mc-space-3);" @click=${() => this.handleCancelSubscription()} disabled=${() => this.cancelBusy.value || !!this.subscriptionQuery.data.value?.cancelAtPeriodEnd}>
                                <ion-icon name="ban-outline"></ion-icon>
                                ${() => this.cancelBusy.value ? 'Cancelando...' : 'Cancelar suscripción'}
                            </button>
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
