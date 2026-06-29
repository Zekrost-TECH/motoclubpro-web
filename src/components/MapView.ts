import { NixComponent, html, ref } from '@deijose/nix-js';

/* global google */
declare const google: any;

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

let mapsPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
    if (mapsPromise) return mapsPromise;
    if ((window as any).google?.maps) return Promise.resolve((window as any).google.maps);

    mapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve((window as any).google.maps);
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return mapsPromise;
}

interface Waypoint {
    lat: number;
    lng: number;
    name: string;
}

export class MapView extends NixComponent {
    private _waypoints: Waypoint[];
    private _mapContainer = ref<HTMLDivElement>();
    private _map: any = null;

    constructor(waypoints: Waypoint[]) {
        super();
        this._waypoints = waypoints;
    }

    onMount() {
        if (!this._mapContainer.el) return;
        loadGoogleMaps().then((maps: any) => {
            const path = this._waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));

            this._map = new maps.Map(this._mapContainer.el, {
                zoom: 10,
                center: path[0] || { lat: 4.6, lng: -74.1 },
                mapTypeId: 'roadmap',
            });

            new maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#FF6B00',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: this._map,
            });

            const bounds = new maps.LatLngBounds();
            this._waypoints.forEach((wp, idx) => {
                new maps.Marker({
                    position: { lat: wp.lat, lng: wp.lng },
                    map: this._map,
                    title: wp.name || `Parada ${idx + 1}`,
                    label: `${idx + 1}`,
                });
                bounds.extend({ lat: wp.lat, lng: wp.lng });
            });

            if (this._waypoints.length > 1) {
                this._map.fitBounds(bounds);
            }
        }).catch(() => {
            // Map fails silently if API key is missing
        });
    }

    render() {
        return html`<div ref=${this._mapContainer} style="width:100%;height:400px;border-radius:var(--mc-radius-lg);border:1px solid var(--mc-border);overflow:hidden;"></div>`;
    }
}
