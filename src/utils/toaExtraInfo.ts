import { ToaExtraInfo } from "./fightGroupExtraInfo";

export type ToaRaidMode = "entry" | "normal" | "expert";

export function hasToaRaidLevelData(
  toa?: ToaExtraInfo | null,
): toa is ToaExtraInfo {
  return toa != null && typeof toa.raidLevel === "number";
}

export function getToaRaidMode(raidLevel: number): ToaRaidMode {
  if (raidLevel < 150) {
    return "entry";
  }
  if (raidLevel < 300) {
    return "normal";
  }
  return "expert";
}

export function getToaRaidModeLabel(mode: ToaRaidMode): string {
  switch (mode) {
    case "entry":
      return "Entry Mode";
    case "normal":
      return "Normal Mode";
    case "expert":
      return "Expert Mode";
  }
}

export function getToaRaidModeIconUrl(mode: ToaRaidMode): string {
  return `/images/toa/${mode}.png`;
}

export function formatToaRaidLevel(raidLevel: number): string {
  return raidLevel.toLocaleString();
}
