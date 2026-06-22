import { createStore } from '@deijose/nix-js';
import { api, setTokens, clearTokens } from '../services/api.service';
import type { User } from '../types';

export const authStore = createStore({
    currentUser: null as User | null,
    isLoading: false,
    error: null as string | null,
});

export async function login(email: string, password: string): Promise<boolean> {
    authStore.isLoading.update(() => true);
    authStore.error.update(() => null);
    try {
        const res = await api.auth.login(email, password);
        setTokens(res.access_token, res.refresh_token);
        authStore.currentUser.update(() => res.user);
        return true;
    } catch (err: any) {
        authStore.error.update(() => err.message || 'Error de autenticación');
        return false;
    } finally {
        authStore.isLoading.update(() => false);
    }
}

export async function refreshSession(): Promise<boolean> {
    const token = localStorage.getItem('mcp_refresh_token');
    if (!token) return false;
    try {
        const res = await api.auth.refresh();
        setTokens(res.access_token, res.refresh_token);
        const user = await api.auth.me();
        authStore.currentUser.update(() => user);
        return true;
    } catch {
        clearTokens();
        authStore.currentUser.update(() => null);
        return false;
    }
}

export async function logout(): Promise<void> {
    clearTokens();
    authStore.currentUser.update(() => null);
}

export const { currentUser, isLoading, error } = authStore;
