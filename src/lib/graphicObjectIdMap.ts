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


export interface GraphicObject {
    name: string;
    frames?: string[];    // Optional array of frames
    imageUrl?: string;    // Fallback single image
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
};
