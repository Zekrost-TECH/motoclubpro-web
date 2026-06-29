import { router } from '../../router';
import { html, signal, NixComponent } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { activeClub } from '../../stores/clubs.store';
import { SkeletonTable } from '../../components/Skeleton';
import { formatEnum } from '../../utils/labels';
import { createDebounced } from '../../utils/debounce';
import type { Member } from '../../types';

export class MembersListPage extends NixComponent {
    search = createDebounced('', 300);
    roleFilter = signal('');
    private router = router;

    membersQuery = createQuery(
        'members/list',
        async ({ clubId }: { clubId: string }) => {
            if (!clubId) throw new Error('No hay club activo');
            return api.clubs.getMembers(clubId);
        },
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );

    onMount() {
        document.title = 'Miembros | MotoClub Pro';
    }

    getInitials(name?: string): string {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    filtered(): Member[] {
        let list = (this.membersQuery.data.value || []) as Member[];
        if (this.roleFilter.value) list = list.filter((m) => m.role === this.roleFilter.value);
        if (this.search.commit.value) {
            const q = this.search.commit.value.toLowerCase();
            list = list.filter((m) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
        }
        return list;
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Miembros</h1>
                <p class="page-subtitle">Gestiona los pilotos de ${() => activeClub.value?.name || 'tu club'}</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-primary" @click=${() => this.router.navigate('/members/invite')}>
                    <ion-icon name="person-add-outline"></ion-icon>
                    Invitar Miembro
                </button>
            </div>
        </div>
        <div class="toolbar">
            <input type="text" class="input search-input" placeholder="Buscar miembro..."
                   value=${() => this.search.value.value} @input=${(e: any) => this.search.setValue(e.target.value)} />
            <select class="input" @change=${(e: any) => this.roleFilter.update(() => e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="lider">Líder</option>
                <option value="piloto">Piloto</option>
            </select>
            <div class="toolbar-spacer"></div>
            <span class="text-secondary">${() => this.filtered().length} miembros</span>
        </div>
        <div class="data-table-wrapper">
            ${() => this.membersQuery.status.value === 'pending'
                ? SkeletonTable(5)
                : this.membersQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar miembros</div>`
                    : html`
                    <table class="data-table">
                        <thead>
                            <tr><th>Miembro</th><th>Email</th><th>Rol</th><th>Nivel</th><th>Ingreso</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${this.filtered().map((m: Member) => html`
                                <tr @click=${() => this.router.navigate(`/members/${m.userId}`)}>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:var(--mc-space-3);">
                                            <div class="avatar avatar-sm">${this.getInitials(m.name || m.email)}</div>
                                            <strong>${m.name || m.email}</strong>
                                        </div>
                                    </td>
                                    <td>${m.email}</td>
                                    <td><span class="badge badge-${m.role}">${formatEnum(m.role)}</span></td>
                                    <td>${formatEnum(m.skillLevel || m.riderLevel || '')}</td>
                                    <td>${m.createdAt || m.joinedAt ? new Date(m.createdAt || m.joinedAt || '').toLocaleDateString('es-CO') : '-'}</td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn-icon" @click.stop=${() => this.router.navigate(`/members/${m.userId}`)} title="Ver perfil">
                                                <ion-icon name="eye-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                    ${!this.filtered().length ? html`
                        <div class="empty">
                            <ion-icon name="people-outline" class="empty-icon"></ion-icon>
                            <h4>No se encontraron miembros</h4>
                            <p>Prueba ajustando los filtros o invita nuevos miembros.</p>
                        </div>
                    ` : ''}
                `}
        </div>
    `;
    }
}
