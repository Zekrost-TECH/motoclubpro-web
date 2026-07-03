import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { router } from '../router';

export function FeatureLocked({ feature, plan = 'Pro' }: { feature: string; plan?: string }): NixTemplate {
    return html`
        <div class="empty" style="padding:var(--mc-space-8);">
            <ion-icon name="lock-closed-outline" class="empty-icon" style="color:var(--mc-warning);"></ion-icon>
            <h4>Funcionalidad no disponible</h4>
            <p>${feature} está incluida en el plan ${plan} o superior.</p>
            <button class="btn btn-primary" style="margin-top:var(--mc-space-4);" @click=${() => router.navigate('/billing')}>
                Ver planes
            </button>
        </div>
    `;
}
