import { router } from '../../router';
import { setPageTitle } from '../../stores/router.store';
import { html, NixComponent, signal, createForm, required, email as emailValidator, ref } from '@deijose/nix-js';
import { login, authStore, logout } from '../../stores/auth.store';
import { loadClubs, clubsStore } from '../../stores/clubs.store';
import { PRIVACY_POLICY_URL } from '../../config/urls';
import {
    isTurnstileEnabled,
    renderTurnstile,
    getTurnstileToken,
    resetTurnstile,
} from '../../services/turnstile.service';

export class LoginPage extends NixComponent {
    private router = router;
    form = createForm(
        { email: '', password: '' },
        {
            validators: {
                email: [required(), emailValidator()],
                password: [required()],
            },
            validateOn: 'submit',
        }
    );
    showPassword = signal(false);
    turnstileWidgetId = signal<string | null>(null);
    turnstileContainer = ref<HTMLDivElement>();
    turnstileError = signal<string | null>(null);
    turnstileReady = signal(!isTurnstileEnabled());

    onMount() {
        setPageTitle('Ingresar');
        if (!isTurnstileEnabled() || !this.turnstileContainer.el) return;

        // El script de Turnstile puede tardar en cargar; reintentamos un par de veces.
        let attempts = 0;
        const tryRender = () => {
            const id = renderTurnstile(this.turnstileContainer.el!, {
                onToken: () => {
                    this.turnstileError.update(() => null);
                    this.turnstileReady.update(() => true);
                },
                onError: () => {
                    this.turnstileError.update(() => 'Error de verificacion de seguridad. Recarga la pagina.');
                    this.turnstileReady.update(() => false);
                },
                theme: 'auto',
                size: 'normal',
            });
            if (id) {
                this.turnstileWidgetId.update(() => id);
            } else if (attempts < 10) {
                attempts++;
                setTimeout(tryRender, 300);
            } else {
                this.turnstileError.update(() => 'No se pudo cargar la verificacion de seguridad. Recarga la pagina.');
            }
        };
        tryRender();
    }

    async handleSubmit(values: { email: string; password: string }) {
        const turnstileToken = isTurnstileEnabled() ? getTurnstileToken() : undefined;
        if (isTurnstileEnabled() && !turnstileToken) {
            this.turnstileError.update(() => 'Completa la verificacion de seguridad antes de continuar.');
            return;
        }

        const ok = await login(values.email, values.password, turnstileToken);
        if (!ok) {
            resetTurnstile(this.turnstileWidgetId.value ?? undefined);
            this.turnstileReady.update(() => !isTurnstileEnabled());
        }

        if (ok) {
            await loadClubs();
            const clubs = clubsStore.myClubs.value || [];
            const userRole = authStore.currentUser.value?.role;
            const adminClubs = clubs.filter((c) => c.role === 'admin' || c.role === 'leader' || c.role === 'superadmin');
            if (userRole !== 'superadmin' && adminClubs.length === 0) {
                authStore.error.update(() => 'No tienes permisos de administrador para acceder a este panel');
                await logout();
                return;
            }
            const webPanelClubs = adminClubs.filter((c) => c.features?.web_panel === true);
            if (userRole !== 'superadmin' && webPanelClubs.length === 0) {
                authStore.error.update(() => 'Tu plan actual no incluye acceso al panel web. Actualiza tu plan para continuar.');
                await logout();
                return;
            }
            const active = clubsStore.activeClub.value;
            if (clubs.length > 1 && !active) {
                this.router.navigate('/select-club');
            } else {
                this.router.navigate('/dashboard');
            }
        }
    }

    render() {
        return html`
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="/nix-js-logo.png" alt="BikerOS" class="auth-logo" />
                    <h1>BikerOS</h1>
                    <p>Plataforma de Administración</p>
                </div>
                <form @submit.prevent=${this.form.handleSubmit((values) => this.handleSubmit(values))}>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" value=${() => this.form.fields.email.value.value} @input=${this.form.fields.email.onInput} placeholder="admin@club.com" required />
                        ${() => this.form.fields.email.error.value ? html`<p class="form-error">${this.form.fields.email.error.value}</p>` : ''}
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <div class="input-group">
                            <input type=${() => this.showPassword.value ? 'text' : 'password'} value=${() => this.form.fields.password.value.value} @input=${this.form.fields.password.onInput} placeholder="••••••" required />
                            <button type="button" class="input-addon" @click=${() => this.showPassword.update(v => !v)}>
                                <ion-icon name=${() => this.showPassword.value ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                            </button>
                        </div>
                        ${() => this.form.fields.password.error.value ? html`<p class="form-error">${this.form.fields.password.error.value}</p>` : ''}
                    </div>
                    ${() => authStore.error.value ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> ${authStore.error.value}</div>` : ''}
                    <button type="submit" class="btn btn-primary btn-block" disabled=${() => authStore.isLoading.value || this.form.isSubmitting.value || !this.turnstileReady.value}>
                        <ion-icon name="log-in-outline"></ion-icon>
                        ${() => authStore.isLoading.value || this.form.isSubmitting.value ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                ${() => isTurnstileEnabled() ? html`
                    <div class="form-group turnstile-wrapper">
                        <div ref=${this.turnstileContainer} class="cf-turnstile"></div>
                        ${() => this.turnstileError.value ? html`<p class="form-error">${this.turnstileError.value}</p>` : ''}
                    </div>
                ` : ''}
                <p class="auth-footer">
                    Al ingresar, aceptas nuestra
                    <a href=${PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">Política de privacidad</a>
                </p>
            </div>
        </div>
    `;
    }
}
