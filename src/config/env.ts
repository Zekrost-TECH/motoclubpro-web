/**
 * Variables de entorno centralizadas.
 * Todos los servicios deben importar desde aquí, no leer import.meta.env directamente.
 */
const env = import.meta.env;

export const API_BASE_URL = (env.VITE_WEB_API_URL as string) || 'http://localhost:3000/api/v1';

export const TURNSTILE_SITE_KEY = env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
