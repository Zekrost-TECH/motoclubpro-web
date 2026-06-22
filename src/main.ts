import { html, mount } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { router, requireAuth, currentPath } from './router';
import { currentUser, refreshSession } from './stores/auth.store';
import { loadClubs } from './stores/clubs.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ClubSelectorPage } from './pages/clubs/ClubSelectorPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventsListPage } from './pages/events/EventsListPage';
import { EventCreatePage } from './pages/events/EventCreatePage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { EventEditPage } from './pages/events/EventEditPage';
import { RoutesListPage } from './pages/routes/RoutesListPage';
import { RouteCreatePage } from './pages/routes/RouteCreatePage';
import { RouteDetailPage } from './pages/routes/RouteDetailPage';
import { RouteEditPage } from './pages/routes/RouteEditPage';
import { MembersListPage } from './pages/members/MembersListPage';
import { MemberInvitePage } from './pages/members/MemberInvitePage';
import { MemberProfilePage } from './pages/members/MemberProfilePage';
import { SupportPointsPage } from './pages/support/SupportPointsPage';
import { BillingPage } from './pages/billing/BillingPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ReportsPage } from './pages/reports/ReportsPage';

// ── Route guards helper ──────────────────────────────────────────────────
function guard(page: () => NixTemplate): () => NixTemplate {
    return () => {
        if (!requireAuth()) return html``;
        return AppLayout(page());
    };
}

// ── Helper para extraer parámetros de ruta dinámica ────────────────────
function matchPath(path: string, pattern: string): Record<string, string> | null {
    const pParts = path.split('/').filter(Boolean);
    const patParts = pattern.split('/').filter(Boolean);
    if (pParts.length !== patParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patParts.length; i++) {
        if (patParts[i].startsWith(':')) {
            params[patParts[i].slice(1)] = pParts[i];
        } else if (patParts[i] !== pParts[i]) {
            return null;
        }
    }
    return params;
}

// ── Route map ────────────────────────────────────────────────────────────
const staticRoutes: Record<string, () => NixTemplate> = {
    '/login': () => {
        if (currentUser.value) { router.navigate('/'); return html``; }
        return LoginPage();
    },
    '/select-club': () => {
        if (!requireAuth()) return html``;
        return ClubSelectorPage();
    },
    '/': guard(DashboardPage),
    '/events': guard(EventsListPage),
    '/events/create': guard(EventCreatePage),
    '/routes': guard(RoutesListPage),
    '/routes/create': guard(RouteCreatePage),
    '/members': guard(MembersListPage),
    '/members/invite': guard(MemberInvitePage),
    '/support': guard(SupportPointsPage),
    '/billing': guard(BillingPage),
    '/reports': guard(ReportsPage),
    '/settings': guard(SettingsPage),
};

const dynamicPatterns: { pattern: string; page: (params: Record<string, string>) => NixTemplate }[] = [
    { pattern: '/events/:id/edit', page: (p) => EventEditPage(p.id) },
    { pattern: '/events/:id', page: (p) => EventDetailPage(p.id) },
    { pattern: '/routes/:id/edit', page: (p) => RouteEditPage(p.id) },
    { pattern: '/routes/:id', page: (p) => RouteDetailPage(p.id) },
    { pattern: '/members/:id', page: (p) => MemberProfilePage(p.id) },
];

function resolveRoute(path: string): (() => NixTemplate) | null {
    if (staticRoutes[path]) return staticRoutes[path];
    for (const dp of dynamicPatterns) {
        const params = matchPath(path, dp.pattern);
        if (params) return () => guard(() => dp.page(params))();
    }
    return null;
}

// ── App shell ────────────────────────────────────────────────────────────
function App(): NixTemplate {
    return html`
        <div id="app-root">
            ${() => {
            const p = currentPath.value;
            const route = resolveRoute(p);
            if (route) return route();
            router.navigate('/');
            return html``;
        }}
        </div>
    `;
}

// ── Bootstrap ────────────────────────────────────────────────────────────
async function init() {
    const ok = await refreshSession();
    if (ok) await loadClubs();
    mount(App(), '#app', { router });
}

init();