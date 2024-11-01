import L, {LatLng, Map as LeafletMap, PolylineOptions, Rectangle} from 'leaflet';

export const MAP_HEIGHT_MAX_ZOOM_PX: number = 364544;
export const MAP_WIDTH_MAX_ZOOM_PX: number = 104448;
export const RS_TILE_WIDTH_PX: number = 32; // Width in px of an RS tile at max zoom level
export const RS_TILE_HEIGHT_PX: number = 32; // Height in px of an RS tile at max zoom level
export const RS_OFFSET_X: number = 1024; // Amount to offset x coordinate to get correct value
export const RS_OFFSET_Y: number = 6208; // Amount to offset y coordinate to get correct value

export class Position {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.z = z;
    }

    static fromLatLng(map: LeafletMap, latLng: LatLng, z: number): Position {
        const point = map.project(latLng, map.getMaxZoom());
        let y = MAP_HEIGHT_MAX_ZOOM_PX - point.y + RS_TILE_HEIGHT_PX / 4;
        y = Math.round((y - RS_TILE_HEIGHT_PX) / RS_TILE_HEIGHT_PX) + RS_OFFSET_Y;
        let x = Math.round((point.x - RS_TILE_WIDTH_PX) / RS_TILE_WIDTH_PX) + RS_OFFSET_X;
        return new Position(x, y, z);
    }

    toLatLng(map: LeafletMap): LatLng {
        return Position.toLatLng(map, this.x, this.y);
    }

    toCentreLatLng(map: LeafletMap): LatLng {
        return Position.toLatLng(map, this.x + 0.5, this.y + 0.5);
    }

    static toLatLng(map: LeafletMap, x: number, y: number): LatLng {
        x = (x - RS_OFFSET_X) * RS_TILE_WIDTH_PX + RS_TILE_WIDTH_PX / 4;
        y = MAP_HEIGHT_MAX_ZOOM_PX - (y - RS_OFFSET_Y) * RS_TILE_HEIGHT_PX;
        return map.unproject(L.point(x, y), map.getMaxZoom());
    }

    getDistance(position: Position): number {
        const diffX = Math.abs(this.x - position.x);
        const diffY = Math.abs(this.y - position.y);
        return Math.sqrt(diffX * diffX + diffY * diffY);
    }

    toLeaflet(map: LeafletMap, rectangleOptions?: PolylineOptions): Rectangle {
        const startLatLng = this.toLatLng(map);
        const endLatLng = new Position(this.x + 1, this.y + 1, this.z).toLatLng(map);
        const bounds = L.latLngBounds(startLatLng, endLatLng);

        // Default rectangle options
        const defaultOptions: PolylineOptions = {
            color: "#33b5e5",
            fillColor: "#33b5e5",
            fillOpacity: 1.0,
            weight: 1,
            interactive: false,
        };

        const options = rectangleOptions || defaultOptions;

        return L.rectangle(bounds, options);
    }

    static getTileBounds(map: LeafletMap, x: number, y: number): L.LatLngBounds {
        const startLatLng = Position.toLatLng(map, x, y);
        const endLatLng = Position.toLatLng(map, x + 1, y + 1);
        return L.latLngBounds(startLatLng, endLatLng);
    }

    getName(): string {
        return "Position";
    }

    equals(position: Position): boolean {
        return this.x === position.x && this.y === position.y && this.z === position.z;
    }

    toString(): string {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }
}
