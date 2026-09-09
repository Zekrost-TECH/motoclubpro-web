import { html } from '@elurjs/core';
import type { ElurTemplate } from '@elurjs/core';

export function SkeletonCard(): ElurTemplate {
    return html`
        <div class="skeleton-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:60%"></div>
        </div>
    `;
}

export function SkeletonTable(rows: number = 5): ElurTemplate {
    return html`
        <div class="skeleton-wrapper">
            <div class="skeleton skeleton-title" style="width:100%;margin-bottom:0.75rem;"></div>
            ${Array.from({ length: rows }, () => html`<div class="skeleton skeleton-row"></div>`)}
        </div>
    `;
}

export function SkeletonKpi(): ElurTemplate {
    return html`
        <div class="kpi-card">
            <div class="skeleton" style="width:48px;height:48px;border-radius:50%;"></div>
            <div style="flex:1;">
                <div class="skeleton skeleton-text" style="width:40px;height:1.5rem;margin-bottom:0.25rem;"></div>
                <div class="skeleton skeleton-text" style="width:80px;"></div>
            </div>
        </div>
    `;
}
