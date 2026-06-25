import o1570_0 from '../assets/graphicObjects/1570_0.png';
import o1570_1 from '../assets/graphicObjects/1570_1.png';
import o1570_2 from '../assets/graphicObjects/1570_2.png';

import o1570 from '../assets/graphicObjects/1570.png';
import o1570_20 from '../assets/graphicObjects/1570_20.png';
import o1570_27 from '../assets/graphicObjects/1570_27.png';

import o1571 from '../assets/graphicObjects/1571.png';
import o1571_20 from '../assets/graphicObjects/1571_20.png';
import o1571_27 from '../assets/graphicObjects/1571_27.png';

import o1572 from '../assets/graphicObjects/1572.png';
import o1572_20 from '../assets/graphicObjects/1572_20.png';
import o1572_27 from '../assets/graphicObjects/1572_27.png';

import o1573 from '../assets/graphicObjects/1573.png';
import o1573_20 from '../assets/graphicObjects/1573_20.png';
import o1573_27 from '../assets/graphicObjects/1573_27.png';

import o1579 from '../assets/graphicObjects/1579.png';
import o1595 from '../assets/graphicObjects/1595.png';


const DOOM_SHOCKWAVE_FRAME_LENGTHS = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];

import o3405_0 from '../assets/graphicObjects/3405_0.png';
import o3405_1 from '../assets/graphicObjects/3405_1.png';
import o3405_2 from '../assets/graphicObjects/3405_2.png';
import o3405_3 from '../assets/graphicObjects/3405_3.png';
import o3405_4 from '../assets/graphicObjects/3405_4.png';
import o3405_5 from '../assets/graphicObjects/3405_5.png';
import o3405_6 from '../assets/graphicObjects/3405_6.png';
import o3405_7 from '../assets/graphicObjects/3405_7.png';
import o3405_8 from '../assets/graphicObjects/3405_8.png';
import o3405_9 from '../assets/graphicObjects/3405_9.png';
import o3406_0 from '../assets/graphicObjects/3406_0.png';
import o3406_1 from '../assets/graphicObjects/3406_1.png';
import o3406_2 from '../assets/graphicObjects/3406_2.png';
import o3406_3 from '../assets/graphicObjects/3406_3.png';
import o3406_4 from '../assets/graphicObjects/3406_4.png';
import o3406_5 from '../assets/graphicObjects/3406_5.png';
import o3406_6 from '../assets/graphicObjects/3406_6.png';
import o3406_7 from '../assets/graphicObjects/3406_7.png';
import o3406_8 from '../assets/graphicObjects/3406_8.png';
import o3406_9 from '../assets/graphicObjects/3406_9.png';
import o3407_0 from '../assets/graphicObjects/3407_0.png';
import o3407_1 from '../assets/graphicObjects/3407_1.png';
import o3407_2 from '../assets/graphicObjects/3407_2.png';
import o3407_3 from '../assets/graphicObjects/3407_3.png';
import o3407_4 from '../assets/graphicObjects/3407_4.png';
import o3407_5 from '../assets/graphicObjects/3407_5.png';
import o3407_6 from '../assets/graphicObjects/3407_6.png';
import o3407_7 from '../assets/graphicObjects/3407_7.png';
import o3407_8 from '../assets/graphicObjects/3407_8.png';
import o3407_9 from '../assets/graphicObjects/3407_9.png';
import o3408_0 from '../assets/graphicObjects/3408_0.png';
import o3408_1 from '../assets/graphicObjects/3408_1.png';
import o3408_2 from '../assets/graphicObjects/3408_2.png';
import o3408_3 from '../assets/graphicObjects/3408_3.png';
import o3408_4 from '../assets/graphicObjects/3408_4.png';
import o3408_5 from '../assets/graphicObjects/3408_5.png';
import o3408_6 from '../assets/graphicObjects/3408_6.png';
import o3408_7 from '../assets/graphicObjects/3408_7.png';
import o3408_8 from '../assets/graphicObjects/3408_8.png';
import o3408_9 from '../assets/graphicObjects/3408_9.png';

export interface GraphicObject {
    name: string;
    frames?: string[];
    /** Client animation cycle lengths (20ms each). ~30 cycles per game tick. */
    frameLengths?: number[];
    imageUrl?: string;
}

/** OSRS client cycles per game tick (~600ms / 20ms). */
export const CLIENT_CYCLES_PER_TICK = 30;

export function getGraphicObjectFrameIndex(ticksElapsed: number, definition: GraphicObject): number {
    if (!definition.frames || definition.frames.length === 0) {
        return 0;
    }

    if (!definition.frameLengths || definition.frameLengths.length === 0) {
        return Math.min(Math.max(ticksElapsed, 0), definition.frames.length - 1);
    }

    let cycles = Math.max(ticksElapsed, 0) * CLIENT_CYCLES_PER_TICK;
    for (let i = 0; i < definition.frameLengths.length && i < definition.frames.length; i++) {
        cycles -= definition.frameLengths[i];
        if (cycles < 0) {
            return i;
        }
    }

    return Math.min(definition.frameLengths.length, definition.frames.length) - 1;
}

export const graphicObjectIdMap: Record<number, GraphicObject> = {
    1570: {
        name: "Bloat hand",
        frames: [
            o1570_0,
            o1570_1,
            o1570_2,
            o1570,
            o1570_20,
            o1570_27
        ]
    },
    1571: {
        name: "Bloat foot",
        frames: [
            o1570_0,
            o1570_1,
            o1570_2,
            o1571,
            o1571_20,
            o1571_27
        ]
    },
    1572: {
        name: "Bloat hand",
        frames: [
            o1570_0,
            o1570_1,
            o1570_2,
            o1572,
            o1572_20,
            o1572_27
        ]
    },
    1573: {
        name: "Bloat foot",
        frames: [
            o1570_0,
            o1570_1,
            o1570_2,
            o1573,
            o1573_20,
            o1573_27
        ]
    },
    1579: { name: "Maiden blood", imageUrl: o1579 },
    1595: { name: "Verzik yellow", imageUrl: o1595 },
    3405: {
        name: "VFX_AREA_SLAM_01",
        frameLengths: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        frames: [o3405_0, o3405_1, o3405_2, o3405_3, o3405_4, o3405_5, o3405_6, o3405_7, o3405_8, o3405_9],
    },
    3406: {
        name: "VFX_AREA_SLAM_02",
        frameLengths: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        frames: [o3406_0, o3406_1, o3406_2, o3406_3, o3406_4, o3406_5, o3406_6, o3406_7, o3406_8, o3406_9],
    },
    3407: {
        name: "VFX_AREA_SLAM_03",
        frameLengths: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        frames: [o3407_0, o3407_1, o3407_2, o3407_3, o3407_4, o3407_5, o3407_6, o3407_7, o3407_8, o3407_9],
    },
    3408: {
        name: "VFX_AREA_SLAM_04",
        frameLengths: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        frames: [o3408_0, o3408_1, o3408_2, o3408_3, o3408_4, o3408_5, o3408_6, o3408_7, o3408_8, o3408_9],
    },
};
