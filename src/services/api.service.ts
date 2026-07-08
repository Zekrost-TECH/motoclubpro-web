/// <reference types="vite/client" />
import type { Club, User, Member, Event, EventAttendee, ChecklistItem, InventoryItem, Route, Waypoint, SupportPoint, Subscription, Payment, Motorcycle, SosAlert, ClubRideRole, ClubLimits } from '../types';
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
        ...(options.headers as Record<string, string> || {}),
    };
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
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
        const body = await r.json();
        // Backend devuelve paginación { data, meta }. Si la respuesta tiene esa forma, devolvemos data.
        if (body && typeof body === 'object' && 'data' in body && 'meta' in body && body.meta && typeof body.meta === 'object' && 'totalPages' in body.meta) {
            return body.data as T;
        }
        return body as T;
    });
}

function requestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
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
        return await r.json() as T;
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

// ── Event mappers (snake_case ↔ camelCase) ───────────────────────────────

function mapEventStatus(status: string): Event['status'] {
    return status as Event['status'];
}

function eventStatusToBackend(status: Event['status']): string {
    return status;
}

function mapEvent(data: any): Event {
    const event = {
        ...data,
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        meetingPoint: data.meeting_point ?? data.meetingPoint ?? '',
        difficulty: data.difficulty,
        status: mapEventStatus(data.status),
        routeId: data.route_id ?? data.routeId,
        createdAt: data.created_at ?? data.createdAt,
    } as Event;
    if (data.attendees) {
        (event as any).attendees = data.attendees.map(mapAttendee);
    }
    if (data.inventory) {
        (event as any).inventory = data.inventory.map(mapInventoryItem);
    }
    return event;
}

function mapEventInput(data: Partial<Event>): any {
    const payload: any = { ...data };
    if (data.meetingPoint !== undefined) {
        payload.meeting_point = data.meetingPoint;
        delete payload.meetingPoint;
    }
    if (data.meetingPointLat !== undefined) {
        payload.meeting_point_lat = data.meetingPointLat;
        delete payload.meetingPointLat;
    }
    if (data.meetingPointLng !== undefined) {
        payload.meeting_point_lng = data.meetingPointLng;
        delete payload.meetingPointLng;
    }
    if (data.routeId !== undefined) {
        payload.route_id = data.routeId;
        delete payload.routeId;
    }
    return payload;
}

function mapRouteInput(data: Partial<Route>): any {
    const payload: any = { ...data };
    if (data.distance !== undefined) {
        payload.distanceKm = data.distance;
        delete payload.distance;
    }
    if (data.startLat !== undefined) {
        payload.start_lat = data.startLat;
        delete payload.startLat;
    }
    if (data.startLng !== undefined) {
        payload.start_lng = data.startLng;
        delete payload.startLng;
    }
    if (data.startName !== undefined) {
        payload.start_name = data.startName;
        delete payload.startName;
    }
    return payload;
}

function mapWaypoint(wp: any): Waypoint {
    const coords = wp.location?.coordinates;
    return {
        id: wp.id,
        name: wp.name || '',
        type: wp.type || 'parada',
        lat: Array.isArray(coords) ? Number(coords[1]) || 0 : Number(wp.lat) || 0,
        lng: Array.isArray(coords) ? Number(coords[0]) || 0 : Number(wp.lng) || 0,
        sortOrder: wp.sortOrder ?? wp.sort_order ?? 0,
        estimatedArrival: wp.estimatedArrival ?? wp.estimated_arrival,
        notes: wp.notes,
    };
}

function mapUser(data: any): User {
    const ecParts = [data.ecName, data.ecPhone, data.ecRelationship].filter(Boolean);
    return {
        id: data.id,
        email: data.email || '',
        name: data.name || '',
        nickname: data.nickname,
        phone: data.phone,
        role: data.role || 'rider',
        avatar: data.avatar_url || data.avatar,
        bloodType: data.bloodType || data.blood_type,
        allergies: data.allergies,
        medicalConditions: data.medicalConditions || data.medical_conditions,
        emergencyContact: ecParts.length ? ecParts.join(' · ') : undefined,
        createdAt: data.createdAt || data.created_at || data.joinDate || data.join_date,
        motorcycle: data.motorcycle ? mapMotorcycle(data.motorcycle) : undefined,
    };
}

function mapMotorcycle(data: any): Motorcycle {
    return {
        id: data.id,
        brand: data.brand || '',
        model: data.model || '',
        year: data.year,
        cc: data.cc || 0,
        plate: data.plate || '',
        color: data.color || '',
        currentKm: data.currentKm ?? data.current_km ?? 0,
        nextServiceKm: data.nextServiceKm ?? data.next_service_km,
        soatExpiry: data.soatExpiry ?? data.soat_expiry,
        techReviewExpiry: data.techReviewExpiry ?? data.tech_review_expiry,
    };
}

function mapMember(data: any): Member {
    return {
        id: data.id,
        userId: data.user_id ?? data.userId ?? '',
        clubId: data.club_id ?? data.clubId ?? '',
        role: data.role || 'rider',
        name: data.name || '',
        email: data.email || '',
        avatar: data.avatar_url || data.avatar,
        skillLevel: data.skill_level ?? data.skillLevel,
        riderLevel: data.rider_level ?? data.riderLevel,
        joinedAt: data.joined_at ?? data.joinedAt,
        createdAt: data.created_at ?? data.createdAt,
    };
}

function mapAttendee(data: any): EventAttendee {
    return {
        userId: data.user_id ?? data.userId,
        userName: data.name ?? data.userName ?? data.nickname ?? '',
        rideRole: data.ride_role ?? data.rideRole ?? 'rider',
        confirmed: data.confirmed_at ? true : (data.confirmed ?? false),
    };
}

function mapChecklistItem(data: any): ChecklistItem {
    return {
        id: data.id,
        label: data.label ?? data.name ?? data.description ?? `Item ${data.id}`,
        required: data.required ?? false,
    };
}

function mapInventoryItem(data: any): InventoryItem {
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        quantity: data.quantity ?? data.totalQuantity,
        totalQuantity: data.total_quantity ?? data.totalQuantity ?? data.quantity ?? 1,
        claimedBy: data.assigned_to ?? data.claimedBy,
    };
}

export const api = {
    auth: {
        login: (email: string, password: string, turnstileToken?: string) =>
            request<{ access_token: string; refresh_token: string; user: User }>('/auth/login/web', {
                method: 'POST',
                body: JSON.stringify({ email, password, ...(turnstileToken ? { turnstileToken } : {}) }),
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
        get: (id: string) => request<User>(`/users/${id}`).then(mapUser),
        update: (id: string, data: Partial<User>) =>
            request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        create: (data: Partial<User>) =>
            request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    },
    clubs: {
        list: () => request<Club[]>('/clubs'),
        get: (id: string) => request<Club>(`/clubs/${id}`),
        getBySlug: (slug: string) => request<Club>(`/clubs/${slug}`),
        getMembers: (id: string) => request<Member[]>(`/clubs/${id}/members`).then((list) => (list || []).map(mapMember)),
        inviteMember: (id: string, email: string, role: string) =>
            request<void>(`/clubs/${id}/members`, {
                method: 'POST',
                body: JSON.stringify({ email, role }),
            }),
        removeMember: (clubId: string, userId: string) =>
            request<void>(`/clubs/${clubId}/members/${userId}`, { method: 'DELETE' }),
        update: (id: string, data: any) =>
            request<Club>(`/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        getBilling: (id: string) => request<any>(`/clubs/${id}/billing`),
        updateBilling: (id: string, data: any) =>
            request<void>(`/clubs/${id}/billing`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    rideRoles: {
        list: () => request<any[]>('/ride-roles').then((list) =>
            (list || []).map((r) => ({
                id: r.id,
                clubId: r.club_id ?? r.clubId,
                slug: r.slug,
                name: r.name,
                isUnique: r.is_unique ?? r.isUnique,
                sortOrder: r.sort_order ?? r.sortOrder,
            }))
        ),
        create: (data: Partial<ClubRideRole>) =>
            request<any>('/ride-roles', {
                method: 'POST',
                body: JSON.stringify({
                    slug: data.slug,
                    name: data.name,
                    is_unique: data.isUnique,
                    sort_order: data.sortOrder,
                }),
            }).then((r) => ({
                id: r.id,
                clubId: r.club_id ?? r.clubId,
                slug: r.slug,
                name: r.name,
                isUnique: r.is_unique ?? r.isUnique,
                sortOrder: r.sort_order ?? r.sortOrder,
            })),
        update: (id: string, data: Partial<ClubRideRole>) =>
            request<any>(`/ride-roles/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    slug: data.slug,
                    name: data.name,
                    is_unique: data.isUnique,
                    sort_order: data.sortOrder,
                }),
            }).then((r) => ({
                id: r.id,
                clubId: r.club_id ?? r.clubId,
                slug: r.slug,
                name: r.name,
                isUnique: r.is_unique ?? r.isUnique,
                sortOrder: r.sort_order ?? r.sortOrder,
            })),
        delete: (id: string) => request<void>(`/ride-roles/${id}`, { method: 'DELETE' }),
    },
    events: {
        list: (status?: string) =>
            request<Event[]>(`/events${status ? `?status=${status}` : ''}`).then((list) => (list || []).map(mapEvent)),
        get: (id: string) => request<Event>(`/events/${id}`).then(mapEvent),
        create: (data: Partial<Event>) =>
            request<Event>('/events', { method: 'POST', body: JSON.stringify(mapEventInput(data)) }).then(mapEvent),
        update: (id: string, data: Partial<Event>) =>
            request<Event>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(mapEventInput(data)) }).then(mapEvent),
        updateStatus: (id: string, status: Event['status']) =>
            request<Event>(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: eventStatusToBackend(status) }) }).then(mapEvent),
        delete: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),
        attendees: (id: string) =>
            request<EventAttendee[]>(`/events/${id}/attendees`).then((list) => (list || []).map(mapAttendee)),
        setRole: (id: string, userId: string, role: string) =>
            request<void>(`/events/${id}/attendees/${userId}`, { method: 'PATCH', body: JSON.stringify({ ride_role: role }) }),
        checklist: (id: string) =>
            request<ChecklistItem[]>(`/events/${id}/checklist`).then((list) => (list || []).map(mapChecklistItem)),
        addChecklistItem: (id: string, item: { label: string; required?: boolean }) =>
            request<ChecklistItem>(`/events/${id}/checklist`, { method: 'POST', body: JSON.stringify(item) }).then(mapChecklistItem),
        removeChecklistItem: (eventId: string, itemId: string) =>
            request<void>(`/events/${eventId}/checklist/${itemId}`, { method: 'DELETE' }),
        inventory: (id: string) =>
            request<InventoryItem[]>(`/events/${id}/inventory`).then((list) => (list || []).map(mapInventoryItem)),
        addInventoryItem: (id: string, item: any) =>
            request<void>(`/events/${id}/inventory`, { method: 'POST', body: JSON.stringify(item) }),
        removeInventoryItem: (eventId: string, itemId: string) =>
            request<void>(`/events/${eventId}/inventory/${itemId}`, { method: 'DELETE' }),
    },
    routes: {
        list: () => request<Route[]>('/routes'),
        get: (id: string) => request<Route>(`/routes/${id}`),
        create: (data: Partial<Route>) =>
            request<Route>('/routes', { method: 'POST', body: JSON.stringify(mapRouteInput(data)) }),
        update: (id: string, data: Partial<Route>) =>
            request<Route>(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(mapRouteInput(data)) }),
        delete: (id: string) => request<void>(`/routes/${id}`, { method: 'DELETE' }),
        waypoints: (id: string) =>
            request<any[]>(`/routes/${id}/waypoints`).then((list) => (list || []).map(mapWaypoint)),
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
            return request<SupportPoint[]>(`/support${qs}`);
        },
        get: (id: string) => request<SupportPoint>(`/support/${id}`),
        create: (data: Partial<SupportPoint>) =>
            request<SupportPoint>('/support', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<SupportPoint>) =>
            request<SupportPoint>(`/support/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        verify: (id: string, status: boolean) =>
            request<{ id: string; verified: boolean }>(`/support/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified: status }) }),
        reviews: (id: string) => request<any[]>(`/support/${id}/reviews`),
    },
    sos: {
        list: () => request<SosAlert[]>('/sos'),
        listPaginated: (page?: number, limit?: number) => {
            const params = new URLSearchParams();
            if (page) params.set('page', String(page));
            if (limit) params.set('limit', String(limit));
            const query = params.toString();
            return requestRaw<{ data: SosAlert[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`/sos${query ? '?' + query : ''}`);
        },
        active: () => request<SosAlert[]>('/sos/active'),
        resolve: (id: string) => request<SosAlert>(`/sos/${id}/resolve`, { method: 'PATCH' }),
    },
    billing: {
        subscription: () => request<Subscription>('/billing/subscription'),
        payments: () => request<Payment[]>('/billing/payments'),
    },
    plans: {
        limits: () => request<any>('/plans/limits').then((data) => ({
            planId: data.plan_id ?? data.planId,
            planName: data.plan_name ?? data.planName,
            maxMembers: data.max_members ?? data.maxMembers,
            maxEventsMonth: data.max_events_month ?? data.maxEventsMonth,
            currentMembers: data.current_members ?? data.currentMembers,
            currentEventsMonth: data.current_events_month ?? data.currentEventsMonth,
            overageMemberCents: data.overage_member_cents ?? data.overageMemberCents,
            features: data.features ?? {},
        } as ClubLimits)),
    },
    reports: {
        events: (from: string, to: string) => request<any>(`/reports/events?from=${from}&to=${to}`),
        sos: (from: string, to: string) => request<any>(`/reports/sos?from=${from}&to=${to}`),
        members: () => request<any>('/reports/members'),
        financial: (from: string, to: string) => request<any>(`/reports/financial?from=${from}&to=${to}`),
        supportPoints: () => request<any>('/reports/support-points'),
    },
};

// Re-export for convenience
export { request };
