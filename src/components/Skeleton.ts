import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';

export function SkeletonText(lines: number = 1): NixTemplate {
    return html`
        <div class="skeleton-wrapper">
            ${Array.from({ length: lines }, () => html`<div class="skeleton skeleton-text"></div>`)}
        </div>
    `;
}

export function SkeletonCard(): NixTemplate {
    return html`
        <div class="skeleton-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:60%"></div>
        </div>
    `;
}

export function SkeletonTable(rows: number = 5): NixTemplate {
    return html`
        <div class="skeleton-wrapper">
            <div class="skeleton skeleton-title" style="width:100%;margin-bottom:0.75rem;"></div>
            ${Array.from({ length: rows }, () => html`<div class="skeleton skeleton-row"></div>`)}
        </div>
    `;
}

export function SkeletonKpi(): NixTemplate {
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
