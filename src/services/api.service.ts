/// <reference types="vite/client" />
import type { Club, User, Event, EventAttendee, Route, Waypoint, SupportPoint, Subscription, Payment } from '../types';
import { router } from '../router';

const BASE_URL = (import.meta as any).env.VITE_WEB_API_URL || 'http://localhost:3000/api/v1';

let _accessToken: string | null = localStorage.getItem('mcp_access_token');
let _activeClubId: string | null = localStorage.getItem('mcp_active_club');

function handleAuthError(status: number): void {
    if (status === 401 || status === 403) {
        localStorage.removeItem('mcp_access_token');
        localStorage.removeItem('mcp_refresh_token');
        localStorage.removeItem('mcp_active_club');
        _accessToken = null;
        _activeClubId = null;
        router.navigate('/login');
    }
}

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (_accessToken) {
        headers['Authorization'] = `Bearer ${_accessToken}`;
    }
    if (_activeClubId) {
        headers['X-Club-ID'] = _activeClubId;
    }
    return fetch(url, { ...options, headers }).then(async (r) => {
        if (!r.ok) {
            handleAuthError(r.status);
            const err = await r.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${r.status}`);
        }
        if (r.status === 204) return undefined as T;
        return r.json() as Promise<T>;
    });
}

export function setTokens(access: string, refresh: string): void {
    _accessToken = access;
    localStorage.setItem('mcp_access_token', access);
    localStorage.setItem('mcp_refresh_token', refresh);
}

export function clearTokens(): void {
    _accessToken = null;
    _activeClubId = null;
    localStorage.removeItem('mcp_access_token');
    localStorage.removeItem('mcp_refresh_token');
    localStorage.removeItem('mcp_active_club');
}

export function setActiveClub(id: string): void {
    _activeClubId = id;
    localStorage.setItem('mcp_active_club', id);
}

export function getActiveClub(): string | null {
    return _activeClubId;
}

export const api = {
    auth: {
        login: (email: string, password: string) =>
            request<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),
        me: () => request<User>('/auth/me'),
        refresh: () => {
            const rt = localStorage.getItem('mcp_refresh_token');
            return request<{ access_token: string; refresh_token: string }>('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: rt }),
            });
        },
        clubs: () => request<{ clubs: Club[]; activeClubId?: string }>('/auth/clubs'),
        switchClub: (clubId: string) =>
            request<{ access_token: string; refresh_token: string }>('/auth/switch-club', {
                method: 'POST',
                body: JSON.stringify({ club_id: clubId }),
            }),
    },
    users: {
        list: () => request<User[]>('/users'),
        get: (id: string) => request<User>(`/users/${id}`),
        update: (id: string, data: Partial<User>) =>
            request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        create: (data: Partial<User>) =>
            request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    },
    clubs: {
        list: () => request<Club[]>('/clubs'),
        get: (id: string) => request<Club>(`/clubs/${id}`),
        getBySlug: (slug: string) => request<Club>(`/clubs/${slug}`),
        getMembers: (id: string) => request<User[]>(`/clubs/${id}/members`),
        inviteMember: (id: string, email: string, role: string, skillLevel?: string) =>
            request<void>(`/clubs/${id}/members`, {
                method: 'POST',
                body: JSON.stringify({ email, role, skillLevel }),
            }),
        removeMember: (clubId: string, userId: string) =>
            request<void>(`/clubs/${clubId}/members/${userId}`, { method: 'DELETE' }),
        update: (id: string, data: any) =>
            request<Club>(`/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        getBilling: (id: string) => request<any>(`/clubs/${id}/billing`),
        updateBilling: (id: string, data: any) =>
            request<void>(`/clubs/${id}/billing`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    events: {
        list: (status?: string) => request<Event[]>(`/events${status ? `?status=${status}` : ''}`),
        get: (id: string) => request<Event>(`/events/${id}`),
        create: (data: Partial<Event>) => request<Event>('/events', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Event>) =>
            request<Event>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),
        attendees: (id: string) => request<EventAttendee[]>(`/events/${id}/attendees`),
        setRole: (id: string, userId: string, role: string) =>
            request<void>(`/events/${id}/attendees/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
        checklist: (id: string) => request<any[]>(`/events/${id}/checklist`),
        addChecklistItem: (id: string, item: any) =>
            request<void>(`/events/${id}/checklist`, { method: 'POST', body: JSON.stringify(item) }),
        inventory: (id: string) => request<any[]>(`/events/${id}/inventory`),
        addInventoryItem: (id: string, item: any) =>
            request<void>(`/events/${id}/inventory`, { method: 'POST', body: JSON.stringify(item) }),
        removeInventoryItem: (eventId: string, itemId: string) =>
            request<void>(`/events/${eventId}/inventory/${itemId}`, { method: 'DELETE' }),
    },
    routes: {
        list: () => request<Route[]>('/routes'),
        get: (id: string) => request<Route>(`/routes/${id}`),
        create: (data: Partial<Route>) => request<Route>('/routes', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<Route>) =>
            request<Route>(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string) => request<void>(`/routes/${id}`, { method: 'DELETE' }),
        addWaypoint: (id: string, wp: Partial<Waypoint>) =>
            request<Waypoint>(`/routes/${id}/waypoints`, {
                method: 'POST',
                body: JSON.stringify({
                    name: wp.name,
                    location: { type: 'Point', coordinates: [wp.lng, wp.lat] },
                    type: wp.type,
                    sortOrder: wp.sortOrder ?? 0,
                }),
            }),
        updateWaypoint: (id: string, wpId: string, wp: Partial<Waypoint>) =>
            request<Waypoint>(`/routes/${id}/waypoints/${wpId}`, { method: 'PATCH', body: JSON.stringify(wp) }),
        deleteWaypoint: (id: string, wpId: string) =>
            request<void>(`/routes/${id}/waypoints/${wpId}`, { method: 'DELETE' }),
        addBatchWaypoints: (id: string, geojson: unknown) =>
            request<void>(`/routes/${id}/waypoints/batch`, { method: 'POST', body: JSON.stringify(geojson) }),
    },
    supportPoints: {
        list: (params?: { type?: string; verified?: boolean }) => {
            const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
            return request<SupportPoint[]>(`/support-points${qs}`);
        },
        verify: (id: string, status: boolean) =>
            request<void>(`/support-points/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified: status }) }),
        reviews: (id: string) => request<any[]>(`/support-points/${id}/reviews`),
    },
    sos: {
        active: () => request<{ data: any[]; meta: any }>('/sos/active'),
        resolve: (id: string) => request<any>(`/sos/${id}/resolve`, { method: 'PATCH' }),
    },
    billing: {
        subscription: () => request<Subscription>('/billing/subscription'),
        payments: () => request<Payment[]>('/billing/payments'),
    },
    reports: {
        events: (from: string, to: string) => request<any>(`/reports/events?from=${from}&to=${to}`),
        sos: (from: string, to: string) => request<any>(`/reports/sos?from=${from}&to=${to}`),
        members: () => request<any>('/reports/members'),
        financial: (from: string, to: string) => request<any>(`/reports/financial?from=${from}&to=${to}`),
    },
};

// Re-export for convenience
export { request };
