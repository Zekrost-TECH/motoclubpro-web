import { NixComponent, html, ref } from '@deijose/nix-js';
import { loadGoogleMaps } from '../services/maps';

declare const google: any;

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
                strokeColor: '#38BDF8',
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
