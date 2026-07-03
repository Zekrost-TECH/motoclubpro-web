import { router } from '../../router';
import { setPageTitle } from '../../stores/router.store';
import { html, NixComponent, signal, createForm, required, email as emailValidator } from '@deijose/nix-js';
import { login, authStore, logout } from '../../stores/auth.store';
import { loadClubs, clubsStore } from '../../stores/clubs.store';

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

    onMount() {
        setPageTitle('Ingresar');
    }

    async handleSubmit(values: { email: string; password: string }) {
        const ok = await login(values.email, values.password);
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
                    <img src="/nix-js-logo.png" alt="MotoClub Pro" class="auth-logo" />
                    <h1>MotoClub Pro</h1>
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
                    <button type="submit" class="btn btn-primary btn-block" disabled=${() => authStore.isLoading.value || this.form.isSubmitting.value}>
                        <ion-icon name="log-in-outline"></ion-icon>
                        ${() => authStore.isLoading.value || this.form.isSubmitting.value ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    `;
    }
}
