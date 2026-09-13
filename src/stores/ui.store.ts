import { createStore } from '@elurjs/core';

export const uiStore = createStore({
    mobileMenuOpen: false,
    isOffline: false,
});

export function toggleMobileMenu(): void {
    uiStore.mobileMenuOpen.update(v => !v);
}

export function closeMobileMenu(): void {
    uiStore.mobileMenuOpen.update(() => false);
}

// Listeners de conectividad — el banner "Sin conexión" del layout y el
// fail-fast de api.service consumen este signal.
export function initNetworkListeners(): void {
    const update = () => uiStore.isOffline.update(() => !navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
}

export const { mobileMenuOpen, isOffline } = uiStore;
