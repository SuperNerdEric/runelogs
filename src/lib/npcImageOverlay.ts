import L from "leaflet";
import {
  MAP_HEIGHT_MAX_ZOOM_PX,
  Position,
  RS_MAP_NATIVE_MAX_ZOOM,
  RS_OFFSET_X,
  RS_OFFSET_Y,
  RS_TILE_HEIGHT_PX,
  RS_TILE_WIDTH_PX,
} from "../utils/Position";

export const NPC_IMAGE_BASE_URL =
  "https://chisel.weirdgloop.org/static/img/osrs-npc";

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
      const ratio =
        img.naturalWidth > 0 && img.naturalHeight > 0
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

/**
 * Largest axis-aligned rectangle with the given width/height aspect ratio that fits
 * inside a box of the given pixel dimensions.
 */
export function fitAspectRatioInPixelBox(
  boxWidth: number,
  boxHeight: number,
  aspectRatio: number,
): { width: number; height: number } {
  if (aspectRatio <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { width: boxWidth, height: boxHeight };
  }

  if (boxWidth / boxHeight > aspectRatio) {
    return { width: boxHeight * aspectRatio, height: boxHeight };
  }

  return { width: boxWidth, height: boxWidth / aspectRatio };
}

function rsTileToNativePixelBox(
  x: number,
  y: number,
  size: number,
): { startX: number; startY: number; endX: number; endY: number } {
  return {
    startX: (x - RS_OFFSET_X) * RS_TILE_WIDTH_PX + RS_TILE_WIDTH_PX / 4,
    startY: MAP_HEIGHT_MAX_ZOOM_PX - (y - RS_OFFSET_Y) * RS_TILE_HEIGHT_PX,
    endX: (x + size - RS_OFFSET_X) * RS_TILE_WIDTH_PX + RS_TILE_WIDTH_PX / 4,
    endY: MAP_HEIGHT_MAX_ZOOM_PX - (y + size - RS_OFFSET_Y) * RS_TILE_HEIGHT_PX,
  };
}

function nativePixelBoxToLatLngBounds(
  map: L.Map,
  left: number,
  top: number,
  right: number,
  bottom: number,
): L.LatLngBounds {
  return L.latLngBounds(
    map.unproject(L.point(left, bottom), RS_MAP_NATIVE_MAX_ZOOM),
    map.unproject(L.point(right, top), RS_MAP_NATIVE_MAX_ZOOM),
  );
}

/** Largest axis-aligned bounds inside an npc tile box with the given aspect ratio. */
export function fitAspectRatioInsideBounds(
  map: L.Map,
  x: number,
  y: number,
  size: number,
  aspectRatio: number,
): L.LatLngBounds {
  const tilePixelSize = size * RS_TILE_WIDTH_PX;
  const { width: fitWidth, height: fitHeight } = fitAspectRatioInPixelBox(
    tilePixelSize,
    tilePixelSize,
    aspectRatio,
  );

  const { startX, startY, endX, endY } = rsTileToNativePixelBox(x, y, size);
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  return nativePixelBoxToLatLngBounds(
    map,
    centerX - fitWidth / 2,
    centerY - fitHeight / 2,
    centerX + fitWidth / 2,
    centerY + fitHeight / 2,
  );
}

export function getNpcTileBounds(
  map: L.Map,
  x: number,
  y: number,
  size: number,
): L.LatLngBounds {
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
  return fitAspectRatioInsideBounds(map, x, y, size, aspectRatio);
}

/** @internal Test helper */
export function clearNpcAspectRatioCache(): void {
  aspectRatioCache.clear();
  aspectRatioLoads.clear();
}
