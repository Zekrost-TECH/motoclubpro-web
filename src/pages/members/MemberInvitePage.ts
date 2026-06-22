import { html, signal } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { router } from '../../router';

export function MemberInvitePage(): NixTemplate {
    document.title = 'Invitar Miembro | MotoClub Pro';
    const email = signal('');
    const name = signal('');
    const role = signal('piloto');
    const skillLevel = signal('novato');
    const submitting = signal(false);

    async function handleSubmit() {

        if (!activeClub.value) return;
        submitting.update(() => true);
        try {
            await api.clubs.inviteMember(activeClub.value.id, email.value, role.value, skillLevel.value);
            router.navigate('/members');
        } finally {
            submitting.update(() => false);
        }
    }

    return html`
        <div class="page-header">
            <h2>Invitar Miembro</h2>
        </div>
        <form class="form-card" @submit.prevent=${handleSubmit}>
            <div class="form-grid">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" .value=${() => email.value} @input=${(e: any) => email.update(() => e.target.value)} required />
                </div>
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" .value=${() => name.value} @input=${(e: any) => name.update(() => e.target.value)} />
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select .value=${() => role.value} @change=${(e: any) => role.update(() => e.target.value)}>
                        <option value="piloto">Piloto</option>
                        <option value="lider">Líder</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nivel de Manejo</label>
                    <select .value=${() => skillLevel.value} @change=${(e: any) => skillLevel.update(() => e.target.value)}>
                        <option value="novato">Novato</option>
                        <option value="basico">Básico</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                        <option value="experto">Experto</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" @click=${() => router.navigate('/members')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" ?disabled=${() => submitting.value}>
                    ${() => submitting.value ? 'Enviando...' : 'Enviar Invitación'}
                </button>
            </div>
        </form>
    `;
}
