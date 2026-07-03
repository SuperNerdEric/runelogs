import exhume from "../assets/groundObjects/32743.png";
import acidicMiasma from "../assets/groundObjects/32744.png";
import sotetsegMazeDisabled from "../assets/groundObjects/33033.png";
import sotetsegMazeInactive from "../assets/groundObjects/33034.png";
import sotetsegMazeActive from "../assets/groundObjects/33035.png";
import coloReentryPoolSecondary from "../assets/groundObjects/50744.png";

export interface GroundObject {
  name: string;
  imageUrl: string;
}

export const groundObjectIdMap: Record<number, GroundObject> = {
  32743: { name: "Xarpus exhume", imageUrl: exhume },
  32744: { name: "Xarpus acidic miasma", imageUrl: acidicMiasma },
  33033: {
    name: "Sotetseg maze disabled tile",
    imageUrl: sotetsegMazeDisabled,
  },
  33034: {
    name: "Sotetseg maze inactive tile",
    imageUrl: sotetsegMazeInactive,
  },
  33035: { name: "Sotetseg maze active tile", imageUrl: sotetsegMazeActive },
  50744: {
    name: "Colosseum reentry pool (secondary)",
    imageUrl: coloReentryPoolSecondary,
  },
};
