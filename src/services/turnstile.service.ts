declare global {
    interface Window {
        turnstile?: {
            render: (
                container: string | HTMLElement,
                options: {
                    sitekey: string;
                    callback?: (token: string) => void;
                    'error-callback'?: () => void;
                    theme?: 'light' | 'dark' | 'auto';
                    size?: 'normal' | 'compact' | 'invisible';
                    action?: string;
                },
            ) => string;
            reset: (widgetId?: string) => void;
            getResponse: (widgetId?: string) => string | undefined;
        };
    }
}

const SITE_KEY = (import.meta as any).env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export function isTurnstileEnabled(): boolean {
    return Boolean(SITE_KEY);
}

export function getTurnstileToken(): string | undefined {
    return window.turnstile?.getResponse();
}

export function resetTurnstile(widgetId?: string): void {
    window.turnstile?.reset(widgetId);
}

export function renderTurnstile(
    container: HTMLElement,
    options: {
        onToken?: (token: string) => void;
        onError?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact' | 'invisible';
    } = {},
): string | null {
    if (!SITE_KEY) return null;
    if (!window.turnstile) {
        console.warn('Turnstile script aun no cargado');
        return null;
    }

    return window.turnstile.render(container, {
        sitekey: SITE_KEY,
        theme: options.theme ?? 'auto',
        size: options.size ?? 'normal',
        action: 'login',
        callback: (token) => options.onToken?.(token),
        'error-callback': () => options.onError?.(),
    });
}
