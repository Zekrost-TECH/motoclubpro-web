// Loader único de Google Maps. Antes cada componente (MapView, MapPicker,
// RouteMapEditor) duplicaba este script: el primer script cargado podía
// fallar y los demás reintentaban en paralelo.
/* global google */
declare const google: any;

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

let mapsPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
    if (mapsPromise) return mapsPromise;
    if ((window as any).google?.maps) return Promise.resolve((window as any).google.maps);

    mapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve((window as any).google.maps);
        script.onerror = () => {
            // Permitir reintento: si el script falla, limpiar la promesa.
            mapsPromise = null;
            reject(new Error('No se pudo cargar Google Maps'));
        };
        document.head.appendChild(script);
    });
    return mapsPromise;
}
