import exhume from '../assets/groundObjects/32743.png';
import acidicMiasma from '../assets/groundObjects/32744.png';

export interface GroundObject {
    name: string;
    imageUrl: string;
}

export const groundObjectIdMap: Record<number, GroundObject> = {
    32743: { name: "Xarpus exhume", imageUrl: exhume },
    32744: { name: "Xarpus acidic miasma", imageUrl: acidicMiasma },
};
