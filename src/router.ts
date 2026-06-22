import { createRouter, signal, html } from '@deijose/nix-js';
import { authStore } from './stores/auth.store';

export const currentPath = signal(window.location.hash.replace('#', '') || '/');

export const router = createRouter([
    { path: '/login', component: () => html`` },
    { path: '/select-club', component: () => html`` },
    { path: '/', component: () => html`` },
    { path: '/events', component: () => html`` },
    { path: '/events/create', component: () => html`` },
    { path: '/events/:id', component: () => html`` },
    { path: '/events/:id/edit', component: () => html`` },
    { path: '/routes', component: () => html`` },
    { path: '/routes/create', component: () => html`` },
    { path: '/routes/:id', component: () => html`` },
    { path: '/routes/:id/edit', component: () => html`` },
    { path: '/members', component: () => html`` },
    { path: '/members/invite', component: () => html`` },
    { path: '/members/:id', component: () => html`` },
    { path: '/support', component: () => html`` },
    { path: '/billing', component: () => html`` },
    { path: '/reports', component: () => html`` },
    { path: '/settings', component: () => html`` },
    { path: '*', component: () => html`` },
], { mode: 'hash' });

router.beforeEach((to) => {
    currentPath.update(() => to);
    if (to !== '/login' && to !== '/select-club' && !authStore.currentUser.value) {
        return '/login';
    }
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
    if (user.role !== 'admin' && user.role !== 'lider') {
        router.navigate('/');
        return false;
    }
    return true;
}

