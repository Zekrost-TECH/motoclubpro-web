import { createQuery, invalidateQueries } from '@deijose/nix-query';
import { api } from '../services/api.service';
import { activeClub } from './clubs.store';
import { currentUser } from './auth.store';
import type { ClubLimits } from '../types';

export const clubLimitsQuery = createQuery(
    'club-limits',
    async () => {
        if (!activeClub.value) return null;
        return api.plans.limits();
    },
    { staleTime: 60_000 }
);

export function refreshClubLimits(): void {
    invalidateQueries('club-limits');
}

export function isSuperadmin(): boolean {
    return currentUser.value?.role === 'superadmin';
}

export function getClubLimits(): ClubLimits | null {
    return clubLimitsQuery.data.value ?? null;
}

export function canAddMember(): boolean {
    if (isSuperadmin()) return true;
    const limits = getClubLimits();
    if (!limits) return true;
    if (limits.maxMembers < 0 || limits.features.unlimited) return true;
    return limits.currentMembers < limits.maxMembers;
}

export function canCreateEvent(): boolean {
    if (isSuperadmin()) return true;
    const limits = getClubLimits();
    if (!limits) return true;
    if (limits.maxEventsMonth < 0 || limits.features.unlimited) return true;
    return limits.currentEventsMonth < limits.maxEventsMonth;
}

export function hasFeature(feature: keyof ClubLimits['features']): boolean {
    if (isSuperadmin()) return true;
    const limits = getClubLimits();
    if (!limits) return false;
    return limits.features[feature] === true || limits.features.unlimited === true;
}

export function memberLimitText(): string {
    const limits = getClubLimits();
    if (!limits) return '';
    if (limits.maxMembers < 0) return 'Miembros ilimitados';
    return `${limits.currentMembers} / ${limits.maxMembers}`;
}

export function eventLimitText(): string {
    const limits = getClubLimits();
    if (!limits) return '';
    if (limits.maxEventsMonth < 0) return 'Eventos ilimitados';
    return `${limits.currentEventsMonth} / ${limits.maxEventsMonth}`;
}

export function isNearMemberLimit(): boolean {
    const limits = getClubLimits();
    if (!limits || limits.maxMembers < 0) return false;
    return limits.currentMembers >= limits.maxMembers * 0.8;
}

export function isAtMemberLimit(): boolean {
    const limits = getClubLimits();
    if (!limits || limits.maxMembers < 0) return false;
    return limits.currentMembers >= limits.maxMembers;
}
