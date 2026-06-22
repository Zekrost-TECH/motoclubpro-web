import { createStore } from '@deijose/nix-js';
import { api, setActiveClub } from '../services/api.service';
import type { Club } from '../types';

export const clubsStore = createStore({
    myClubs: [] as Club[],
    activeClub: null as Club | null,
    isLoading: false,
});

export async function loadClubs(): Promise<void> {
    clubsStore.isLoading.update(() => true);
    try {
        const res = await api.auth.clubs();
        clubsStore.myClubs.update(() => res.clubs);
        if (res.activeClubId) {
            const active = res.clubs.find(c => c.id === res.activeClubId);
            if (active) {
                clubsStore.activeClub.update(() => active);
                setActiveClub(active.id);
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
    const active = clubsStore.myClubs.value.find((c: Club) => c.id === clubId);
    if (active) clubsStore.activeClub.update(() => active);
}

export const { myClubs, activeClub } = clubsStore;
