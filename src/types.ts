// ── Shared types for web admin ────────────────────────────────────────────

export type ClubRole = 'superadmin' | 'admin' | 'leader' | 'rider';

export interface Club {
    id: string;
    name: string;
    slug: string;
    city?: string;
    department?: string;
    description?: string;
    logo?: string;
    role?: ClubRole;
    features?: Record<string, boolean>;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    nickname?: string;
    phone?: string;
    role: ClubRole;
    avatar?: string;
    bloodType?: string;
    allergies?: string;
    medicalConditions?: string;
    emergencyContact?: string;
    createdAt: string;
    motorcycle?: Motorcycle;
}

export interface Member {
    id: string;
    userId: string;
    clubId: string;
    role: ClubRole;
    name: string;
    email: string;
    avatar?: string;
    skillLevel?: string;
    riderLevel?: string;
    joinedAt?: string;
    createdAt?: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    meetingPoint: string;
    meetingPointLat?: number;
    meetingPointLng?: number;
    difficulty: 'suave' | 'off_road' | 'viaje_largo' | 'expertos';
    status: 'borrador' | 'proximo' | 'en_curso' | 'completado' | 'cancelado';
    routeId?: string;
    attendees: EventAttendee[];
    checklist: ChecklistItem[];
    inventory: InventoryItem[];
    guests?: EventGuest[];
    createdAt: string;
}

export type RideRole = string;

export interface ClubRideRole {
    id: string;
    clubId: string;
    slug: string;
    name: string;
    isUnique: boolean;
    sortOrder: number;
}

export interface EventAttendee {
    userId: string;
    userName: string;
    rideRole: RideRole;
    confirmed: boolean;
}

export interface ChecklistItem {
    id: string;
    label: string;
    required: boolean;
}

export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    category?: 'herramienta' | 'seguridad' | 'comida' | 'otros' | string;
    quantity?: number;
    totalQuantity: number;
    claimedBy?: string;
}

export type GuestType = 'acompañante' | 'invitado';

export interface EventGuest {
    id: string;
    guestType: GuestType;
    fullName: string;
    phone?: string;
    notes?: string;
    confirmedAt?: string;
    invitedBy: string;
    inviterName?: string;
}

export interface Route {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    distance: number;
    distanceKm?: number;
    estimatedTime: string;
    elevationMin: number;
    elevationMax: number;
    waypoints: Waypoint[];
    waypointsCount?: number;
    waypoints_count?: number;
    startLat?: number;
    startLng?: number;
    startName?: string;
    createdAt: string;
}

export interface Waypoint {
    id: string;
    name: string;
    type: 'inicio' | 'parada' | 'gasolinera' | 'restaurante' | 'destino';
    lat: number;
    lng: number;
    sortOrder?: number;
    estimatedArrival?: string;
    notes?: string;
}

export interface SupportPoint {
    id: string;
    name: string;
    type: string;
    address: string;
    city: string;
    phone?: string;
    hours?: string;
    lat: number;
    lng: number;
    verified: boolean;
    rating: number;
    reviewCount: number;
}

export interface Motorcycle {
    id: string;
    brand: string;
    model: string;
    cc: number;
    color: string;
    plate: string;
    year?: number;
    currentKm: number;
    nextServiceKm?: number;
    soatExpiry?: string;
    techReviewExpiry?: string;
}

export interface MaintenanceRecord {
    id: string;
    type: string;
    date: string;
    km: number;
    description?: string;
    cost?: number;
    notes?: string;
}

export interface ClubLimits {
    planId: string;
    planName: string;
    maxMembers: number;
    maxEventsMonth: number;
    currentMembers: number;
    currentEventsMonth: number;
    overageMemberCents: number;
    features: Record<string, boolean>;
}

export interface Subscription {
    planId: string;
    planName: string;
    status: 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended';
    startDate: string;
    endDate: string;
    memberLimit: number;
    currentMembers: number;
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    status: 'pagado' | 'pendiente' | 'fallido';
    method: string;
    invoiceUrl?: string;
}

export type SOSType = 'pinchazo' | 'falla_mecanica' | 'accidente' | 'sin_gasolina' | 'medica' | 'otro';

export type SosStatus = 'activa' | 'resuelta' | 'cancelada';

export interface SosAlert {
    id: string;
    userId?: string;
    user_id?: string;
    userName?: string;
    user_name?: string;
    eventId?: string;
    event_id?: string;
    clubId?: string;
    club_id?: string;
    type: SOSType;
    status: SosStatus;
    description?: string;
    resolvedBy?: string;
    resolved_by?: string;
    createdAt: string;
    created_at: string;
    resolvedAt?: string;
    resolved_at?: string;
    lat?: number;
    lng?: number;
    timeAgo?: string;
}
