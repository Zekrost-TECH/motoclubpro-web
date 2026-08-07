import { html, signal, NixComponent } from '@deijose/nix-js';
import { createQuery, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { setPageTitle } from '../../stores/router.store';
import type { Subscription } from '../../types';

/**
 * Página de retorno del Widget de Wompi (BILLING_REDIRECT_URL → /billing/result?id=tx).
 * Espera a que el webhook confirme: refresca la suscripción hasta verla activa
 * o un pago aprobado nuevo (máx. ~30s).
 */
export class PaymentResultPage extends NixComponent {
    status = signal<'checking' | 'approved' | 'failed' | 'timeout'>('checking');
    attempts = 0;
    private _timer: number | null = null;

    subscriptionQuery = createQuery('billing/subscription', () => api.billing.subscription() as Promise<Subscription>, { staleTime: 0 });

    onMount() {
        setPageTitle('Resultado del pago');
        const txId = new URLSearchParams(window.location.search).get('id');
        if (!txId) {
            this.status.update(() => 'failed');
            return;
        }
        this.poll();
    }

    onUnmount() {
        if (this._timer !== null) window.clearInterval(this._timer);
    }

    private poll() {
        this._timer = window.setInterval(async () => {
            this.attempts += 1;
            invalidateQueries('billing/subscription');
            invalidateQueries('billing/payments');
            await this.subscriptionQuery.refetch();
            const s = this.subscriptionQuery.data.value;
            if (s && (s.status === 'active' || s.status === 'past_due' || s.status === 'suspended')) {
                if (this._timer !== null) window.clearInterval(this._timer);
                this.status.update(() => 'approved');
                return;
            }
            if (this.attempts >= 10) {
                if (this._timer !== null) window.clearInterval(this._timer);
                this.status.update(() => 'timeout');
            }
        }, 3000);
    }

    render() {
        return html`
        <div class="dashboard-card" style="max-width:520px;margin:10vh auto;">
            <div class="card-body" style="text-align:center;padding:var(--mc-space-8);">
                ${() => {
                if (this.status.value === 'checking') {
                    return html`
                        <ion-icon name="hourglass-outline" style="font-size:3rem;color:var(--mc-primary);"></ion-icon>
                        <h3 style="margin-top:var(--mc-space-4);">Confirmando tu pago...</h3>
                        <p style="opacity:.7;">Estamos verificando la transacción con Wompi. Esto toma unos segundos.</p>
                    `;
                }
                if (this.status.value === 'approved') {
                    return html`
                        <ion-icon name="checkmark-circle-outline" style="font-size:3rem;color:var(--mc-success,#2e7d32);"></ion-icon>
                        <h3 style="margin-top:var(--mc-space-4);">¡Pago confirmado!</h3>
                        <p style="opacity:.7;">Tu suscripción está activa. La factura electrónica llegará al email del club.</p>
                        <button class="btn btn-primary" style="margin-top:var(--mc-space-4);" @click=${() => router.navigate('/billing')}>
                            <ion-icon name="arrow-back-outline"></ion-icon> Volver a Suscripción
                        </button>
                    `;
                }
                return html`
                    <ion-icon name="alert-circle-outline" style="font-size:3rem;color:var(--mc-danger,#c62828);"></ion-icon>
                    <h3 style="margin-top:var(--mc-space-4);">No pudimos confirmar el pago</h3>
                    <p style="opacity:.7;">${this.status.value === 'failed'
                        ? 'La transacción no se completó. Inténtalo de nuevo.'
                        : 'El pago podría estar procesándose aún. Revisa el historial en unos minutos.'}</p>
                    <button class="btn btn-primary" style="margin-top:var(--mc-space-4);" @click=${() => router.navigate('/billing')}>
                        <ion-icon name="arrow-back-outline"></ion-icon> Volver a Suscripción
                    </button>
                `;
            }}
            </div>
        </div>
        `;
    }
}
