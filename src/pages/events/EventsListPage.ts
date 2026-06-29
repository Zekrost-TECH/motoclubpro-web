import { router } from '../../router';
import { html, signal, NixComponent, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { openConfirm } from '../../components/ConfirmModal';
import { SkeletonTable } from '../../components/Skeleton';
import { formatEnum } from '../../utils/labels';
import { createDebounced } from '../../utils/debounce';
import { activeClub } from '../../stores/clubs.store';

export class EventsListPage extends NixComponent {
    statusFilter = signal('');
    search = createDebounced('', 300);
    private router = router;

    eventsQuery = createQuery(
        'events/list',
        async ({ status }: { status: string }) => api.events.list(status || undefined),
        {
            params: () => ({ clubId: activeClub.value?.id || '', status: this.statusFilter.value }),
            staleTime: 60_000,
        }
    );

    deleteEvent = createCommand(
        'events/delete',
        async (id: string) => api.events.delete(id),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/list'),
        }
    );

    onMount() {
        document.title = 'Rodadas | MotoClub Pro';
    }

    filteredEvents() {
        let list = this.eventsQuery.data.value || [];
        if (this.search.commit.value) {
            const q = this.search.commit.value.toLowerCase();
            list = list.filter((e: any) => e.title.toLowerCase().includes(q));
        }
        return list;
    }

    confirmDelete(id: string) {
        openConfirm('Eliminar Rodada', '¿Estás seguro de eliminar esta rodada?', () => {
            this.deleteEvent.execute(id);
        });
    }

    difficultyBadge(difficulty: string): string {
        switch (difficulty) {
            case 'suave': return 'badge-success';
            case 'moderado': return 'badge-warning';
            case 'expertos': return 'badge-danger';
            case 'viaje_largo': return 'badge-info';
            default: return 'badge';
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Rodadas</h1>
                <p class="page-subtitle">Planifica y gestiona las salidas del club</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-primary" @click=${() => this.router.navigate('/events/create')}>
                    <ion-icon name="add-outline"></ion-icon>
                    Nueva Rodada
                </button>
            </div>
        </div>
        <div class="toolbar">
            <input type="text" class="input search-input" placeholder="Buscar rodada..."
                   value=${() => this.search.value.value} @input=${(e: any) => this.search.setValue(e.target.value)} />
            <select class="input" @change=${(e: any) => this.statusFilter.update(() => e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="borrador">Borradores</option>
                <option value="proximo">Próximos</option>
                <option value="en_curso">En Curso</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
            </select>
            <div class="toolbar-spacer"></div>
            <span class="text-secondary">${() => this.filteredEvents().length} rodadas</span>
        </div>
        <div class="data-table-wrapper">
            ${() => this.eventsQuery.status.value === 'pending'
                ? SkeletonTable(5)
                : this.eventsQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar rodadas</div>`
                    : html`
                    <table class="data-table">
                        <thead>
                            <tr><th>Rodada</th><th>Fecha</th><th>Estado</th><th>Dificultad</th><th>Asistentes</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${() => {
                            const list = this.filteredEvents();
                            return repeat(list, (e: any) => e.id, (e: any) => html`
                                <tr @click=${() => this.router.navigate(`/events/${e.id}`)}>
                                    <td><strong>${e.title}</strong></td>
                                    <td>${new Date(e.date).toLocaleDateString('es-CO')}</td>
                                    <td><span class=${`badge badge-${e.status}`}>${formatEnum(e.status)}</span></td>
                                    <td><span class=${`badge ${this.difficultyBadge(e.difficulty)}`}>${formatEnum(e.difficulty)}</span></td>
                                    <td>${e.attendees?.length || 0}</td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn-icon" @click.stop=${() => this.router.navigate(`/events/${e.id}/edit`)} title="Editar">
                                                <ion-icon name="create-outline"></ion-icon>
                                            </button>
                                            <button class="btn-icon danger" @click.stop=${() => this.confirmDelete(e.id)} title="Eliminar">
                                                <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `);
                        }}
                        </tbody>
                    </table>
                    ${!this.filteredEvents().length ? html`
                        <div class="empty">
                            <ion-icon name="flag-outline" class="empty-icon"></ion-icon>
                            <h4>No se encontraron rodadas</h4>
                            <p>Crea la primera rodada del club.</p>
                        </div>
                    ` : ''}
                `}
        </div>
    `;
    }
}
