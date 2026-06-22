import { html, signal } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { login, authStore } from '../../stores/auth.store';
import { loadClubs } from '../../stores/clubs.store';
import { clubsStore } from '../../stores/clubs.store';
import { router } from '../../router';

export function LoginPage(): NixTemplate {
    document.title = 'Ingresar | MotoClub Pro';
    const email = signal('');
    const password = signal('');
    const showPassword = signal(false);

    async function handleSubmit() {
        const ok = await login(email.value, password.value);
        if (ok) {
            await loadClubs();
            const clubs = clubsStore.myClubs.value;
            const active = clubsStore.activeClub.value;
            if (clubs.length > 1 && !active) {
                router.navigate('/select-club');
            } else {
                router.navigate('/');
            }
        }
    }

    return html`
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="/nix-js-logo.png" alt="MotoClub Pro" class="auth-logo" />
                    <h1>MotoClub Pro</h1>
                    <p>Plataforma de Administración</p>
                </div>
                <form @submit.prevent=${handleSubmit}>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" .value=${() => email.value} @input=${(e: any) => email.update(() => e.target.value)} placeholder="admin@club.com" required />
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <div class="input-group">
                            <input type=${() => showPassword.value ? 'text' : 'password'} .value=${() => password.value} @input=${(e: any) => password.update(() => e.target.value)} placeholder="••••••" required />
                            <button type="button" class="input-addon" @click=${() => showPassword.update(v => !v)}>
                                <ion-icon name=${() => showPassword.value ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                            </button>
                        </div>
                    </div>
                    ${() => authStore.error.value ? html`<div class="alert alert-error">${authStore.error.value}</div>` : ''}
                    <button type="submit" class="btn btn-primary btn-block" ?disabled=${() => authStore.isLoading.value}>
                        ${() => authStore.isLoading.value ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    `;
}
