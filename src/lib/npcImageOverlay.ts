import L from 'leaflet';
import {Position} from '../utils/Position';

export const NPC_IMAGE_BASE_URL = 'https://chisel.weirdgloop.org/static/img/osrs-npc';

export function getNpcImageUrl(npcId: number): string {
    return `${NPC_IMAGE_BASE_URL}/${npcId}_128.png`;
}

const aspectRatioCache = new Map<number, number>();
const aspectRatioLoads = new Map<number, Promise<number>>();

export function loadNpcAspectRatio(npcId: number): Promise<number> {
    const cached = aspectRatioCache.get(npcId);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }

    const pending = aspectRatioLoads.get(npcId);
    if (pending) {
        return pending;
    }

    const load = new Promise<number>((resolve) => {
        const img = new Image();
        img.onload = () => {
            const ratio = img.naturalWidth > 0 && img.naturalHeight > 0
                ? img.naturalWidth / img.naturalHeight
                : 1;
            aspectRatioCache.set(npcId, ratio);
            aspectRatioLoads.delete(npcId);
            resolve(ratio);
        };
        img.onerror = () => {
            aspectRatioCache.set(npcId, 1);
            aspectRatioLoads.delete(npcId);
            resolve(1);
        };
        img.src = getNpcImageUrl(npcId);
    });

    aspectRatioLoads.set(npcId, load);
    return load;
}

/** Largest axis-aligned bounds inside `outer` with the given width/height aspect ratio. */
export function fitAspectRatioInsideBounds(
    outer: L.LatLngBounds,
    aspectRatio: number,
): L.LatLngBounds {
    if (aspectRatio <= 0) {
        return outer;
    }

    const center = outer.getCenter();
    const latSpan = outer.getNorth() - outer.getSouth();
    const lngSpan = outer.getEast() - outer.getWest();

    let fitLatSpan: number;
    let fitLngSpan: number;

    if (lngSpan / latSpan > aspectRatio) {
        fitLatSpan = latSpan;
        fitLngSpan = latSpan * aspectRatio;
    } else {
        fitLngSpan = lngSpan;
        fitLatSpan = lngSpan / aspectRatio;
    }

    return L.latLngBounds(
        L.latLng(center.lat - fitLatSpan / 2, center.lng - fitLngSpan / 2),
        L.latLng(center.lat + fitLatSpan / 2, center.lng + fitLngSpan / 2),
    );
}

export function getNpcTileBounds(map: L.Map, x: number, y: number, size: number): L.LatLngBounds {
    const position = new Position(x, y, 0);
    return position.toLeaflet(map, undefined, size).getBounds();
}

export function getNpcImageBounds(
    map: L.Map,
    x: number,
    y: number,
    size: number,
    aspectRatio: number,
): L.LatLngBounds {
    const tileBounds = getNpcTileBounds(map, x, y, size);
    return fitAspectRatioInsideBounds(tileBounds, aspectRatio);
}

/** @internal Test helper */
export function clearNpcAspectRatioCache(): void {
    aspectRatioCache.clear();
    aspectRatioLoads.clear();
}
