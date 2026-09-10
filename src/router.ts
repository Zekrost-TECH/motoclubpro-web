import { createRouter, lazy } from '@elurjs/core';
import { authStore } from './stores/auth.store';
import { clubsStore } from './stores/clubs.store';
import { routerPath } from './stores/router.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ClubSelectorPage } from './pages/clubs/ClubSelectorPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventsListPage } from './pages/events/EventsListPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { EventGuestsPage } from './pages/events/EventGuestsPage';
import { RoutesListPage } from './pages/routes/RoutesListPage';
import { MembersListPage } from './pages/members/MembersListPage';
import { MemberInvitePage } from './pages/members/MemberInvitePage';
import { MemberProfilePage } from './pages/members/MemberProfilePage';
import { SupportPointsPage } from './pages/support/SupportPointsPage';
import { BillingPage } from './pages/billing/BillingPage';
import { PaymentResultPage } from './pages/billing/PaymentResultPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { RideRolesPage } from './pages/settings/RideRolesPage';
import { AdminClubsPage } from './pages/admin/AdminClubsPage';

// Páginas pesadas (con Google Maps): lazy-load para reducir el bundle inicial
const EventCreatePage = lazy(() => import('./pages/events/EventCreatePage'), { selector: (m: any) => m.EventCreatePage });
const EventEditPage = lazy(() => import('./pages/events/EventEditPage'), { selector: (m: any) => m.EventEditPage });
const RouteCreatePage = lazy(() => import('./pages/routes/RouteCreatePage'), { selector: (m: any) => m.RouteCreatePage });
const RouteDetailPage = lazy(() => import('./pages/routes/RouteDetailPage'), { selector: (m: any) => m.RouteDetailPage });
const RouteEditPage = lazy(() => import('./pages/routes/RouteEditPage'), { selector: (m: any) => m.RouteEditPage });
const SupportPointDetailPage = lazy(() => import('./pages/support/SupportPointDetailPage'), { selector: (m: any) => m.SupportPointDetailPage });
const SosPage = lazy(() => import('./pages/sos/SosPage'), { selector: (m: any) => m.SosPage });

export const router = createRouter([
    {
        path: '/',
        component: () => new AppLayout(),
        children: [
            { path: '/dashboard', component: () => new DashboardPage() },
            { path: '/events', component: () => new EventsListPage() },
            { path: '/events/create', component: EventCreatePage },
            { path: '/events/:id', component: () => new EventDetailPage() },
            { path: '/events/:id/edit', component: EventEditPage },
            { path: '/events/:id/guests', component: () => new EventGuestsPage() },
            { path: '/routes', component: () => new RoutesListPage() },
            { path: '/routes/create', component: RouteCreatePage },
            { path: '/routes/:id', component: RouteDetailPage },
            { path: '/routes/:id/edit', component: RouteEditPage },
            { path: '/members', component: () => new MembersListPage() },
            { path: '/members/invite', component: () => new MemberInvitePage() },
            { path: '/members/:id', component: () => new MemberProfilePage() },
            { path: '/support', component: () => new SupportPointsPage() },
            { path: '/support/create', component: SupportPointDetailPage },
            { path: '/support/:id', component: SupportPointDetailPage },
            { path: '/support/:id/edit', component: SupportPointDetailPage },
            { path: '/sos', component: SosPage },
            { path: '/billing', component: () => new BillingPage() },
            { path: '/billing/result', component: () => new PaymentResultPage() },
            { path: '/reports', component: () => new ReportsPage() },
            { path: '/settings', component: () => new SettingsPage() },
            { path: '/ride-roles', component: () => new RideRolesPage() },
            { path: '/admin/clubs', component: () => new AdminClubsPage() },
        ],
    },
    { path: '/login', component: () => new LoginPage() },
    { path: '/select-club', component: () => new ClubSelectorPage() },
    { path: '*', component: () => new AppLayout(), beforeEnter: () => '/dashboard' },
], { mode: 'history' });

router.beforeEach((to) => {
    routerPath.update(() => to);
    const user = authStore.currentUser.value;
    if (to === '/login' && user) return '/dashboard';
    if (to !== '/login' && to !== '/select-club' && !user) return '/login';
    // '/' no tiene ruta hija por defecto: sin esto el AppLayout se ve en blanco
    if (to === '/') return '/dashboard';
    if (to.startsWith('/admin') && user?.role !== 'superadmin') return '/dashboard';
    // Las rutas del panel envían X-Club-ID: sin club activo las peticiones fallan.
    // Superadmin se excluye porque gestiona clubs desde /admin/clubs sin club propio.
    if (user && user.role !== 'superadmin' && to !== '/select-club' && !clubsStore.activeClub.value) {
        return '/select-club';
    }
    return undefined;
});

export { authStore };


