import o32734 from '../assets/gameObjects/32734.png';
import o32984 from '../assets/gameObjects/32984.png';
import o45570 from '../assets/gameObjects/45570.png';
import o45571 from '../assets/gameObjects/45571.png';
import o45572 from '../assets/gameObjects/45572.png';
import o45573 from '../assets/gameObjects/45573.png';
import o45574 from '../assets/gameObjects/45574.png';
import o45575 from '../assets/gameObjects/45575.png';
import o45576 from '../assets/gameObjects/45576.png';
import o57283 from '../assets/gameObjects/57283.png';
import o57284 from '../assets/gameObjects/57284.png';
import o57286 from '../assets/gameObjects/57286.png';
import o57287 from '../assets/gameObjects/57287.png';
import o50743 from '../assets/gameObjects/50743.png';
import o56335 from '../assets/gameObjects/56335.png';
import o56336 from '../assets/gameObjects/56336.png';
import o56337 from '../assets/gameObjects/56337.png';
import o56338 from '../assets/gameObjects/56338.png';
import o56339 from '../assets/gameObjects/56339.png';
import o56369 from '../assets/gameObjects/56369.png';
import o56370 from '../assets/gameObjects/56370.png';
export interface GameObject {
    name: string;
    imageUrl: string;
}

/** FLOORKIT_SUMMONING03 — logged position is the center tile of a 3x3 object. */
export const YAMA_GLYPH_IDS: ReadonlySet<number> = new Set([
    56335, 56336, 56337, 56338, 56339,
]);

const YAMA_GLYPH_TILE_SIZE = 3;

export function getGameObjectTileSize(objectId: number): number {
    return YAMA_GLYPH_IDS.has(objectId) ? YAMA_GLYPH_TILE_SIZE : 1;
}

/** Offset from logged position to south-west anchor tile (NPCs use 0). */
export function getGameObjectAnchorOffset(objectId: number): number {
    return isCenterAnchoredGameObject(objectId) ? Math.floor(getGameObjectTileSize(objectId) / 2) : 0;
}

export function isCenterAnchoredGameObject(objectId: number): boolean {
    return YAMA_GLYPH_IDS.has(objectId);
}

export const gameObjectIdMap: Record<number, GameObject> = {
    32734: { name: "Verzik web", imageUrl: o32734 },
    32984: { name: "Maiden blood trail", imageUrl: o32984 },
    45570: { name: "Zebak poison", imageUrl: o45570 },
    45571: { name: "Zebak poison", imageUrl: o45571 },
    45572: { name: "Zebak poison", imageUrl: o45572 },
    45573: { name: "Zebak poison", imageUrl: o45573 },
    45574: { name: "Zebak poison", imageUrl: o45574 },
    45575: { name: "Zebak poison", imageUrl: o45575 },
    45576: { name: "Zebak poison", imageUrl: o45576 },
    57283: { name: "Doom venom splat", imageUrl: o57283 },
    57284: { name: "Doom venom splat (diagonal)", imageUrl: o57284 },
    57286: { name: "Doom rock", imageUrl: o57286 },
    57287: { name: "Doom rock (blocks range)", imageUrl: o57287 },
    50743: { name: "Colosseum reentry pool", imageUrl: o50743 },
    56335: { name: "Yama glyph (full 1)", imageUrl: o56335 },
    56336: { name: "Yama glyph (full 2)", imageUrl: o56336 },
    56337: { name: "Yama glyph (inactive)", imageUrl: o56337 },
    56338: { name: "Yama glyph (full 1 deactivate)", imageUrl: o56338 },
    56339: { name: "Yama glyph (full 2 deactivate)", imageUrl: o56339 },
    56369: { name: "Yama COF firewall", imageUrl: o56369 },
    56370: { name: "Yama COF firewall (active)", imageUrl: o56370 },
};
