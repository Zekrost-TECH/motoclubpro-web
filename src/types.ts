// ── Shared types for web admin ────────────────────────────────────────────

export type ClubRole = 'admin' | 'lider' | 'piloto';

export interface Club {
    id: string;
    name: string;
    slug: string;
    city?: string;
    department?: string;
    description?: string;
    logo?: string;
    role?: ClubRole;
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
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    meetingPoint: string;
    difficulty: 'suave' | 'off_road' | 'viaje_largo' | 'expertos';
    status: 'borrador' | 'proximo' | 'en_curso' | 'completado' | 'cancelado';
    routeId?: string;
    attendees: EventAttendee[];
    checklist: ChecklistItem[];
    inventory: InventoryItem[];
    createdAt: string;
}

export type RideRole = 'rider' | 'puntero' | 'barredora' | 'capitan_ruta' | 'medic' | 'cierre_seguridad';

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

export interface Route {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    distance: number;
    estimatedTime: string;
    elevationMin: number;
    elevationMax: number;
    waypoints: Waypoint[];
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

export interface Subscription {
    plan: 'prueba' | 'basico' | 'premium' | 'enterprise';
    status: 'activa' | 'cancelada' | 'vencida';
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
