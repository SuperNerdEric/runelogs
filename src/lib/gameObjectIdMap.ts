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
export interface GameObject {
    name: string;
    imageUrl: string;
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
};
