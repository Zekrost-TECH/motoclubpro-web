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

export interface RouteWaypoint {
    id?: string;
    name: string;
    type: 'inicio' | 'parada' | 'gasolinera' | 'restaurante' | 'destino';
    lat: number;
    lng: number;
    sortOrder?: number;
}

export class RouteMapEditor extends NixComponent {
    private _mapContainer = ref<HTMLDivElement>();
    private _map: any = null;
    private _markers: any[] = [];
    private _polyline: any = null;
    private _pendingMarker: any = null;

    private _waypoints: RouteWaypoint[] = [];
    private _pendingLat: number | null = null;
    private _pendingLng: number | null = null;

    onPendingChange?: (lat: number | null, lng: number | null) => void;
    onWaypointsChange?: (waypoints: RouteWaypoint[]) => void;

    constructor() {
        super();
    }

    /** Devuelve true si hay un punto pendiente */
    hasPending(): boolean {
        return this._pendingLat != null && this._pendingLng != null;
    }

    /** Reemplaza todos los waypoints y refresca el mapa */
    setWaypoints(waypoints: RouteWaypoint[]) {
        this._waypoints = [...waypoints];
        this._renderMarkersAndPolyline();
    }

    /** Confirma el punto pendiente como waypoint */
    confirmPending() {
        if (this._pendingLat == null || this._pendingLng == null) return;
        const idx = this._waypoints.length;
        const type: RouteWaypoint['type'] = idx === 0 ? 'inicio' : 'parada';
        this._waypoints.push({ name: `Parada ${idx + 1}`, type, lat: this._pendingLat, lng: this._pendingLng, sortOrder: idx });
        this._clearPendingMarker();
        this._renderMarkersAndPolyline();
        this.onWaypointsChange?.([...this._waypoints]);
    }

    /** Limpia el marcador provisional sin confirmar */
    clearPending() {
        this._clearPendingMarker();
        this.onPendingChange?.(null, null);
    }

    /** Quita el último waypoint */
    removeLast() {
        if (this._waypoints.length === 0) return;
        this._waypoints.pop();
        this._renderMarkersAndPolyline();
        this.onWaypointsChange?.([...this._waypoints]);
    }

    /** Elimina todos los waypoints */
    clearAll() {
        this._waypoints = [];
        this._clearPendingMarker();
        this._renderMarkersAndPolyline();
        this.onWaypointsChange?.([]);
    }

    onMount() {
        if (!this._mapContainer.el) return;
        loadGoogleMaps().then((maps: any) => {
            const center = this._waypoints.length > 0
                ? { lat: this._waypoints[0].lat, lng: this._waypoints[0].lng }
                : { lat: 4.6, lng: -74.1 };
            const zoom = this._waypoints.length > 0 ? 12 : 6;

            this._map = new maps.Map(this._mapContainer.el, {
                zoom,
                center,
                mapTypeId: 'roadmap',
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });

            // Click en el mapa: coloca marcador provisional (no agrega todavía)
            this._map.addListener('click', (e: any) => {
                this._clearPendingMarker();
                const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                this._pendingLat = pos.lat;
                this._pendingLng = pos.lng;
                this._pendingMarker = new maps.Marker({
                    position: pos,
                    map: this._map,
                    draggable: true,
                    title: 'Punto pendiente',
                    icon: {
                        path: maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#4CAF50',
                        fillOpacity: 0.8,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                    },
                });
                this._pendingMarker.addListener('dragend', (de: any) => {
                    const p = { lat: de.latLng.lat(), lng: de.latLng.lng() };
                    this._pendingLat = p.lat;
                    this._pendingLng = p.lng;
                    this.onPendingChange?.(p.lat, p.lng);
                });
                this.onPendingChange?.(pos.lat, pos.lng);
            });

            this._renderMarkersAndPolyline();
        }).catch(() => {
            // Map fails silently
        });
    }

    /** Render devuelve solo el contenedor del mapa. Nunca se re-renderiza. */
    render() {
        return html`<div ref=${this._mapContainer} style="width:100%;height:380px;border-radius:var(--mc-radius-lg);border:1px solid var(--mc-border);overflow:hidden;"></div>`;
    }

    private _renderMarkersAndPolyline() {
        const maps = (window as any).google?.maps;
        if (!maps || !this._map) return;

        this._markers.forEach((m) => m.setMap(null));
        this._markers = [];

        const path = this._waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng }));

        if (this._polyline) {
            this._polyline.setPath(path);
        } else if (path.length > 0) {
            this._polyline = new maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#38BDF8',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: this._map,
            });
        }

        this._waypoints.forEach((wp, idx) => {
            const marker = new maps.Marker({
                position: { lat: wp.lat, lng: wp.lng },
                map: this._map,
                draggable: true,
                title: wp.name || `Parada ${idx + 1}`,
                label: `${idx + 1}`,
            });

            marker.addListener('dragend', (e: any) => {
                const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                this._waypoints[idx] = { ...this._waypoints[idx], lat: pos.lat, lng: pos.lng };
                this._renderMarkersAndPolyline();
                this.onWaypointsChange?.([...this._waypoints]);
            });

            this._markers.push(marker);
        });

        if (this._waypoints.length > 1) {
            const bounds = new maps.LatLngBounds();
            this._waypoints.forEach((wp) => bounds.extend({ lat: wp.lat, lng: wp.lng }));
            this._map.fitBounds(bounds);
        } else if (this._waypoints.length === 1) {
            this._map.panTo({ lat: this._waypoints[0].lat, lng: this._waypoints[0].lng });
            this._map.setZoom(14);
        }
    }

    private _clearPendingMarker() {
        if (this._pendingMarker) {
            this._pendingMarker.setMap(null);
            this._pendingMarker = null;
        }
        this._pendingLat = null;
        this._pendingLng = null;
    }
}
