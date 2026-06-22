import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';
import { openConfirm } from '../../components/ConfirmModal';
import { SkeletonCard } from '../../components/Skeleton';

const searchQuery = signal('');

export function RoutesListPage(): NixTemplate {
    document.title = 'Rutas | MotoClub Pro';

    const allRoutes = signal<any[]>([]);
    const loading = signal(true);

    function refresh() {
        loading.update(() => true);
        api.routes.list().then(r => {
            allRoutes.update(() => r);
            loading.update(() => false);
        }).catch(() => {
            loading.update(() => false);
            showToast('Error al cargar rutas', 'error');
        });
    }

    effect(() => { refresh(); });

    const filtered = () => {
        let list = allRoutes.value || [];
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            list = list.filter((r: any) => r.name.toLowerCase().includes(q));
        }
        return list;
    };

    function confirmDelete(id: string) {
        openConfirm('Eliminar Ruta', '¿Estás seguro de eliminar esta ruta?', () => {
            api.routes.delete(id).then(() => {
                showToast('Ruta eliminada', 'success');
                refresh();
            }).catch(() => showToast('Error al eliminar', 'error'));
        });
    }

    return html`
        <div class="page-header">
            <h2>Rutas</h2>
            <button class="btn btn-primary" @click=${() => router.navigate('/routes/create')}>
                <ion-icon name="add-outline"></ion-icon> Nueva Ruta
            </button>
        </div>
        <div class="toolbar">
            <input type="text" class="input search-input" placeholder="Buscar ruta..."
                   .value=${() => searchQuery.value} @input=${(e: any) => searchQuery.update(() => e.target.value)} />
        </div>
        ${() => loading.value
            ? html`<div class="cards-grid">${SkeletonCard()}${SkeletonCard()}${SkeletonCard()}</div>`
            : html`
                <div class="cards-grid">
                    ${filtered().map((r: any) => html`
                        <div class="card" @click=${() => router.navigate(`/routes/${r.id}`)}>
                            <div class="card-header">
                                <h3>${r.name}</h3>
                                <span class="badge">${r.difficulty}</span>
                            </div>
                            <div class="card-body">
                                <p>${r.description}</p>
                                <div class="card-meta">
                                    <span><ion-icon name="map-outline"></ion-icon> ${r.distance} km</span>
                                    <span><ion-icon name="time-outline"></ion-icon> ${r.estimatedTime}</span>
                                    <span><ion-icon name="location-outline"></ion-icon> ${r.waypoints?.length || 0} waypoints</span>
                                </div>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-sm" @click.stop=${() => router.navigate(`/routes/${r.id}/edit`)}>Editar</button>
                                <button class="btn btn-sm btn-danger" @click.stop=${() => confirmDelete(r.id)}>Eliminar</button>
                            </div>
                        </div>
                    `)}
                </div>
                ${!filtered().length ? html`<p class="empty">No se encontraron rutas.</p>` : ''}
            `}
    `;
}
