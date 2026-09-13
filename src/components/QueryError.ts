import { html } from '@elurjs/core';
import type { ElurTemplate } from '@elurjs/core';
import type { QueryResult } from '@elurjs/query';

/**
 * Estado de error estándar para queries: mensaje + botón reintentar.
 * Reemplaza el patrón "skeleton eterno / vacío indistinguible de error".
 */
export function QueryErrorState({
    query,
    message,
}: {
    query?: QueryResult<unknown> | { refetch(): void };
    message?: string;
}): ElurTemplate {
    return html`
        <div class="empty query-error" role="alert">
            <ion-icon name="alert-circle-outline" class="empty-icon"></ion-icon>
            <h4>No se pudo cargar</h4>
            <p>${message ?? 'Ocurrió un error al obtener los datos. Verifica tu conexión.'}</p>
            <button class="btn btn-secondary btn-sm" @click=${() => query?.refetch()}>
                <ion-icon name="refresh-outline"></ion-icon>
                Reintentar
            </button>
        </div>
    `;
}
