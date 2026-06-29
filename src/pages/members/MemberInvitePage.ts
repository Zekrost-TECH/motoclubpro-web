import { router } from '../../router';
import { html, signal, NixComponent } from '@deijose/nix-js';
import { createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { showToast } from '../../components/Toast';

export class MemberInvitePage extends NixComponent {
    email = signal('');
    role = signal('piloto');
    private router = router;

    inviteMember = createCommand(
        'members/invite',
        async (payload: { clubId: string; email: string; role: string }) =>
            api.clubs.inviteMember(payload.clubId, payload.email, payload.role),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('members/list'),
        }
    );

    onMount() {
        document.title = 'Invitar Miembro | MotoClub Pro';
    }

    async handleSubmit() {
        if (!activeClub.value) return;
        try {
            await this.inviteMember.executeAsync({
                clubId: activeClub.value.id,
                email: this.email.value,
                role: this.role.value,
            });
            showToast('Invitación enviada', 'success');
            this.router.navigate('/members');
        } catch (err: any) {
            showToast(err.message || 'Error al enviar invitación', 'error');
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Invitar Miembro</h1>
                <p class="page-subtitle">Añade un nuevo piloto al club</p>
            </div>
        </div>
        <form class="form-card" @submit.prevent=${() => this.handleSubmit()}>
            <h3 class="form-section-title">Datos del invitado</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" value=${() => this.email.value} @input=${(e: any) => this.email.update(() => e.target.value)} placeholder="piloto@email.com" required />
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select value=${() => this.role.value} @change=${(e: any) => this.role.update(() => e.target.value)}>
                        <option value="piloto">Piloto</option>
                        <option value="lider">Líder</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click=${() => this.router.navigate('/members')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" disabled=${() => this.inviteMember.isPending.value}>
                    <ion-icon name="send-outline"></ion-icon>
                    ${() => this.inviteMember.isPending.value ? 'Enviando...' : 'Enviar Invitación'}
                </button>
            </div>
        </form>
    `;
    }
}
