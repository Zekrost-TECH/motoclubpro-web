import { NixComponent, html, ref, signal } from '@deijose/nix-js';

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

export interface MapLocation {
    lat: number;
    lng: number;
    name: string;
}

interface MapPickerProps {
    initialLocation?: Partial<MapLocation>;
    onChange?: (location: MapLocation) => void;
    label?: string;
}

export class MapPicker extends NixComponent {
    private _mapContainer = ref<HTMLDivElement>();
    private _map: any = null;
    private _marker: any = null;
    private _geocoder: any = null;

    lat = signal<number | null>(null);
    lng = signal<number | null>(null);
    name = signal('');

    private _props: MapPickerProps;

    constructor(props: MapPickerProps) {
        super();
        this._props = props;
    }

    onMount() {
        const initial = this._props.initialLocation || {};
        this.lat.update(() => initial.lat ?? null);
        this.lng.update(() => initial.lng ?? null);
        this.name.update(() => initial.name ?? '');

        if (!this._mapContainer.el) return;
        loadGoogleMaps().then((maps: any) => {
            const center = initial.lat != null && initial.lng != null
                ? { lat: initial.lat, lng: initial.lng }
                : { lat: 4.6, lng: -74.1 };

            this._map = new maps.Map(this._mapContainer.el, {
                zoom: 14,
                center,
                mapTypeId: 'roadmap',
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });

            this._geocoder = new maps.Geocoder();

            if (initial.lat != null && initial.lng != null) {
                this._setMarker({ lat: initial.lat, lng: initial.lng }, maps);
            }

            this._map.addListener('click', (e: any) => {
                const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                this._setMarker(position, maps);
                this._updateLatLng(position.lat, position.lng);
                this._reverseGeocode(position);
            });
        }).catch(() => {
            // Map fails silently if API key is missing
        });
    }

    private _setMarker(position: { lat: number; lng: number }, maps: any) {
        if (!this._marker) {
            this._marker = new maps.Marker({
                position,
                map: this._map,
                draggable: true,
                title: 'Punto seleccionado',
            });
            this._marker.addListener('dragend', (e: any) => {
                const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                this._updateLatLng(pos.lat, pos.lng);
                this._map.panTo(pos);
                this._reverseGeocode(pos);
            });
        } else {
            this._marker.setPosition(position);
        }
        this._map.panTo(position);
    }

    private _updateLatLng(lat: number, lng: number) {
        this.lat.update(() => lat);
        this.lng.update(() => lng);
        this._emitChange();
    }

    private _reverseGeocode(position: { lat: number; lng: number }) {
        if (!this._geocoder) return;
        this._geocoder.geocode({ location: position }, (results: any, status: any) => {
            if (status === 'OK' && results?.[0]) {
                const formatted = results[0].formatted_address || '';
                this.name.update(() => formatted);
            } else {
                this.name.update(() => `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
            }
            this._emitChange();
        });
    }

    private _emitChange() {
        const lat = this.lat.value;
        const lng = this.lng.value;
        if (lat == null || lng == null) return;
        this._props.onChange?.({ lat, lng, name: this.name.value });
    }

    private _handleNameInput(e: any) {
        const value = e.target.value;
        this.name.update(() => value);
        this._emitChange();
    }

    setLocation(lat: number, lng: number, name?: string) {
        const maps = (window as any).google?.maps;
        if (!maps || !this._map) return;
        this._setMarker({ lat, lng }, maps);
        this._updateLatLng(lat, lng);
        if (name != null) {
            this.name.update(() => name);
            this._emitChange();
        }
    }

    render() {
        return html`
            <div class="form-group">
                <label>${this._props.label || 'Ubicación en el mapa'}</label>
                <div ref=${this._mapContainer} style="width:100%;height:320px;border-radius:var(--mc-radius-lg);border:1px solid var(--mc-border);overflow:hidden;margin-bottom:0.75rem;"></div>
                <input type="text" value=${() => this.name.value} @input=${(e: any) => this._handleNameInput(e)} placeholder="Nombre o dirección del lugar" />
                <input type="hidden" value=${() => this.lat.value ?? ''} />
                <input type="hidden" value=${() => this.lng.value ?? ''} />
                <p class="help-text" style="margin-top:0.25rem;font-size:0.85rem;color:var(--mc-text-muted);">Haz clic en el mapa para seleccionar el punto. Puedes arrastrar el marcador.</p>
            </div>
        `;
    }
}
