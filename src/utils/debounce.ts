import { signal } from '@deijose/nix-js';

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

export function createDebounced<T>(initialValue: T, delay: number) {
    const value = signal<T>(initialValue);
    const commit = signal<T>(initialValue);
    let timeout: ReturnType<typeof setTimeout> | null = null;

    function setValue(next: T) {
        value.update(() => next);
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => commit.update(() => next), delay);
    }

    return { value, commit, setValue };
}
