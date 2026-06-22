import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { router } from '../../router';
import { showToast } from '../../components/Toast';
import { SkeletonTable } from '../../components/Skeleton';

const searchQuery = signal('');
const roleFilter = signal('');

export function MembersListPage(): NixTemplate {
    document.title = 'Miembros | MotoClub Pro';

    const allMembers = signal<any[]>([]);
    const loading = signal(true);

    effect(() => {
        const clubId = activeClub.value?.id;
        if (clubId) {
            loading.update(() => true);
            api.clubs.getMembers(clubId).then(m => {
                allMembers.update(() => m);
                loading.update(() => false);
            }).catch(() => {
                loading.update(() => false);
                showToast('Error al cargar miembros', 'error');
            });
        }
    });

    const filtered = () => {
        let list = allMembers.value || [];
        if (roleFilter.value) list = list.filter((m: any) => m.role === roleFilter.value);
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            list = list.filter((m: any) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
        }
        return list;
    };

    return html`
        <div class="page-header">
            <h2>Miembros del Club</h2>
            <button class="btn btn-primary" @click=${() => router.navigate('/members/invite')}>
                <ion-icon name="person-add-outline"></ion-icon> Invitar Miembro
            </button>
        </div>
        <div class="toolbar">
            <input type="text" class="input search-input" placeholder="Buscar miembro..."
                   .value=${() => searchQuery.value} @input=${(e: any) => searchQuery.update(() => e.target.value)} />
            <select class="input" @change=${(e: any) => roleFilter.update(() => e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="lider">Líder</option>
                <option value="piloto">Piloto</option>
            </select>
        </div>
        <div class="data-table-wrapper">
            ${() => loading.value
            ? SkeletonTable(5)
            : html`
                    <table class="data-table">
                        <thead>
                            <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Nivel</th><th>Ingreso</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${filtered().map((m: any) => html`
                                <tr @click=${() => router.navigate(`/members/${m.id}`)}>
                                    <td><strong>${m.name || m.email}</strong></td>
                                    <td>${m.email}</td>
                                    <td><span class="badge badge-${m.role}">${m.role}</span></td>
                                    <td>${m.skillLevel || '-'}</td>
                                    <td>${m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-CO') : '-'}</td>
                                    <td>
                                        <button class="btn-icon" @click.stop=${() => router.navigate(`/members/${m.id}`)}>
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </button>
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                    ${!filtered().length ? html`<p class="empty">No se encontraron miembros.</p>` : ''}
                `}
        </div>
    `;
}
