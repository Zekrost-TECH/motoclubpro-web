import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';
import { openConfirm } from '../../components/ConfirmModal';
import { SkeletonTable } from '../../components/Skeleton';

const statusFilter = signal('');
const searchQuery = signal('');

export function EventsListPage(): NixTemplate {
    document.title = 'Rodadas | MotoClub Pro';

    const allEvents = signal<any[]>([]);
    const loading = signal(true);

    function refresh() {
        loading.update(() => true);
        api.events.list().then(e => {
            allEvents.update(() => e);
            loading.update(() => false);
        }).catch(() => {
            loading.update(() => false);
            showToast('Error al cargar rodadas', 'error');
        });
    }

    effect(() => { refresh(); });

    const filteredEvents = () => {
        let list = allEvents.value || [];
        if (statusFilter.value) list = list.filter((e: any) => e.status === statusFilter.value);
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            list = list.filter((e: any) => e.title.toLowerCase().includes(q));
        }
        return list;
    };

    function confirmDelete(id: string) {
        openConfirm('Eliminar Rodada', '¿Estás seguro de eliminar esta rodada?', () => {
            api.events.delete(id).then(() => {
                showToast('Rodada eliminada', 'success');
                refresh();
            }).catch(() => showToast('Error al eliminar', 'error'));
        });
    }

    return html`
        <div class="page-header">
            <h2>Rodadas</h2>
            <button class="btn btn-primary" @click=${() => router.navigate('/events/create')}>
                <ion-icon name="add-outline"></ion-icon> Nueva Rodada
            </button>
        </div>
        <div class="toolbar">
            <input type="text" class="input search-input" placeholder="Buscar rodada..."
                   .value=${() => searchQuery.value} @input=${(e: any) => searchQuery.update(() => e.target.value)} />
            <select class="input" @change=${(e: any) => statusFilter.update(() => e.target.value)}>
                <option value="">Todos</option>
                <option value="proximo">Próximos</option>
                <option value="en_curso">En Curso</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
            </select>
        </div>
        <div class="data-table-wrapper">
            ${() => loading.value
            ? SkeletonTable(5)
            : html`
                    <table class="data-table">
                        <thead>
                            <tr><th>Título</th><th>Fecha</th><th>Estado</th><th>Dificultad</th><th>Asistentes</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${filteredEvents().map((e: any) => html`
                                <tr @click=${() => router.navigate(`/events/${e.id}`)}>
                                    <td><strong>${e.title}</strong></td>
                                    <td>${new Date(e.date).toLocaleDateString('es-CO')}</td>
                                    <td><span class="badge badge-${e.status}">${e.status}</span></td>
                                    <td><span class="badge">${e.difficulty}</span></td>
                                    <td>${e.attendees?.length || 0}</td>
                                    <td>
                                        <button class="btn-icon" @click.stop=${() => router.navigate(`/events/${e.id}/edit`)}>
                                            <ion-icon name="create-outline"></ion-icon>
                                        </button>
                                        <button class="btn-icon btn-danger" @click.stop=${() => confirmDelete(e.id)}>
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                    ${!filteredEvents().length ? html`<p class="empty">No se encontraron rodadas.</p>` : ''}
                `}
        </div>
    `;
}
