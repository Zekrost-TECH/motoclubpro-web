import { createStore } from '@deijose/nix-js';
import { api, setActiveClub } from '../services/api.service';
import type { Club } from '../types';
import { setQueryData, invalidateQueries } from '@deijose/nix-query';

export const clubsStore = createStore({
    myClubs: [] as Club[],
    activeClub: null as Club | null,
    isLoading: false,
},
    {
        actions: (s) => ({
            setActiveClub: (club: Club) => {
                s.activeClub.update(() => club);
            },
        })
    });

function invalidateClubQueries() {
    invalidateQueries('club/settings');
    invalidateQueries('club/billing');
    invalidateQueries('members/list');
    invalidateQueries('events/list');
    invalidateQueries('events/upcoming');
    invalidateQueries('routes/list');
    invalidateQueries('users/list');
    invalidateQueries('sos/active');
    invalidateQueries('billing/subscription');
    invalidateQueries('billing/payments');
    invalidateQueries('reports/events');
    invalidateQueries('reports/sos');
    invalidateQueries('reports/members');
}

function mapClub(c: any): Club {
    return {
        id: c.club_id || c.id,
        name: c.name,
        slug: c.slug,
        city: c.city,
        department: c.department,
        description: c.description,
        logo: c.logo_url || c.logo,
        role: c.role,
        createdAt: c.created_at || c.createdAt,
    };
}

export async function loadClubs(): Promise<void> {
    clubsStore.isLoading.update(() => true);
    try {
        const res = await api.auth.clubs();
        const clubs = (Array.isArray(res) ? res : res.clubs || []).map(mapClub);
        const activeClubId = Array.isArray(res) ? undefined : res.activeClubId;

        clubsStore.myClubs.update(() => clubs);
        if (clubs.length === 1) {
            clubsStore.activeClub.update(() => clubs[0]);
            setActiveClub(clubs[0].id);
            invalidateClubQueries();
        } else if (activeClubId) {
            const active = clubs.find(c => c.id === activeClubId);
            if (active) {
                clubsStore.activeClub.update(() => active);
                setActiveClub(active.id);
                invalidateClubQueries();
            }
        }
    } finally {
        clubsStore.isLoading.update(() => false);
    }
}

export async function switchClub(clubId: string): Promise<void> {
    const res = await api.auth.switchClub(clubId);
    localStorage.setItem('mcp_access_token', res.access_token);
    localStorage.setItem('mcp_refresh_token', res.refresh_token);
    setActiveClub(clubId);

    const active = (clubsStore.myClubs.value || []).find((c: Club) => c.id === clubId);
    console.log({ active });
    if (active) {
        clubsStore.setActiveClub(active);
        setQueryData('club/settings', active);
    }
    invalidateClubQueries();
}

export const { myClubs, activeClub } = clubsStore;
