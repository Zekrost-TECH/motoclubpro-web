import { createRouter } from '@deijose/nix-js';
import { authStore } from './stores/auth.store';
import { routerPath } from './stores/router.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ClubSelectorPage } from './pages/clubs/ClubSelectorPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventsListPage } from './pages/events/EventsListPage';
import { EventCreatePage } from './pages/events/EventCreatePage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { EventEditPage } from './pages/events/EventEditPage';
import { EventGuestsPage } from './pages/events/EventGuestsPage';
import { RoutesListPage } from './pages/routes/RoutesListPage';
import { RouteCreatePage } from './pages/routes/RouteCreatePage';
import { RouteDetailPage } from './pages/routes/RouteDetailPage';
import { RouteEditPage } from './pages/routes/RouteEditPage';
import { MembersListPage } from './pages/members/MembersListPage';
import { MemberInvitePage } from './pages/members/MemberInvitePage';
import { MemberProfilePage } from './pages/members/MemberProfilePage';
import { SupportPointsPage } from './pages/support/SupportPointsPage';
import { SupportPointDetailPage } from './pages/support/SupportPointDetailPage';
import { SosPage } from './pages/sos/SosPage';
import { BillingPage } from './pages/billing/BillingPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { RideRolesPage } from './pages/settings/RideRolesPage';
import { AdminClubsPage } from './pages/admin/AdminClubsPage';

export const router = createRouter([
    {
        path: '/',
        component: () => new AppLayout(),
        children: [
            { path: '/dashboard', component: () => new DashboardPage() },
            { path: '/events', component: () => new EventsListPage() },
            { path: '/events/create', component: () => new EventCreatePage() },
            { path: '/events/:id', component: () => new EventDetailPage() },
            { path: '/events/:id/edit', component: () => new EventEditPage() },
            { path: '/events/:id/guests', component: () => new EventGuestsPage() },
            { path: '/routes', component: () => new RoutesListPage() },
            { path: '/routes/create', component: () => new RouteCreatePage() },
            { path: '/routes/:id', component: () => new RouteDetailPage() },
            { path: '/routes/:id/edit', component: () => new RouteEditPage() },
            { path: '/members', component: () => new MembersListPage() },
            { path: '/members/invite', component: () => new MemberInvitePage() },
            { path: '/members/:id', component: () => new MemberProfilePage() },
            { path: '/support', component: () => new SupportPointsPage() },
            { path: '/support/create', component: () => new SupportPointDetailPage() },
            { path: '/support/:id', component: () => new SupportPointDetailPage() },
            { path: '/support/:id/edit', component: () => new SupportPointDetailPage() },
            { path: '/sos', component: () => new SosPage() },
            { path: '/billing', component: () => new BillingPage() },
            { path: '/reports', component: () => new ReportsPage() },
            { path: '/settings', component: () => new SettingsPage() },
            { path: '/ride-roles', component: () => new RideRolesPage() },
            { path: '/admin/clubs', component: () => new AdminClubsPage() },
        ],
    },
    { path: '/login', component: () => new LoginPage() },
    { path: '/select-club', component: () => new ClubSelectorPage() },
    { path: '*', component: () => new AppLayout() },
], { mode: 'history' });

router.beforeEach((to) => {
    routerPath.update(() => to);
    const user = authStore.currentUser.value;
    if (to === '/login' && user) return '/';
    if (to !== '/login' && to !== '/select-club' && !user) return '/login';
    if (to.startsWith('/admin') && user?.role !== 'superadmin') return '/';
    return undefined;
});

export function requireAuth(): boolean {
    if (!authStore.currentUser.value) {
        router.navigate('/login');
        return false;
    }
    return true;
}

export function requireAdmin(): boolean {
    const user = authStore.currentUser.value;
    if (!user) {
        router.navigate('/login');
        return false;
    }
    if (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'leader') {
        router.navigate('/');
        return false;
    }
    return true;
}

export { authStore };


