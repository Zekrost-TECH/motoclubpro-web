import { createStore } from '@elurjs/core';

export const uiStore = createStore({
    mobileMenuOpen: false,
});

export function toggleMobileMenu(): void {
    uiStore.mobileMenuOpen.update(v => !v);
}

export function closeMobileMenu(): void {
    uiStore.mobileMenuOpen.update(() => false);
}

export const { mobileMenuOpen } = uiStore;
