import * as semver from "semver";
import { Actor } from "../models/Actor";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";
import { npcIdMap } from "../lib/npcIdMap";

/**
 * Combat Logger version that began recording NPC attack animations.
 * When adding newly tracked NPCs later, give them their own minVersion.
 */
export const NPC_ATTACK_ANIMATION_VERSION_1_6_9 = "1.6.9";

export interface TrackedNpcAttackNpcDef {
  /** Stable id for morphing / multi-form NPCs (Maiden phases, Nylo styles, etc.). */
  family: string;
  /** Compact label for tick-chart rows and tooltips. */
  shortName: string;
  /** Preferred NPC id for icons. */
  primaryId: number;
  /** All NPC ids that belong to this tracked family. */
  ids: number[];
  /** Minimum Combat Logger log version that records this family's attack animations. */
  minVersion: string;
}

/**
 * NPCs whose attack animations are recorded by Combat Logger and shown on the
 * replay tick chart when present in a fight on a supported log version.
 */
export const TRACKED_NPC_ATTACK_NPCS: TrackedNpcAttackNpcDef[] = [
  // Theatre of Blood — Maiden (regular / entry / hard phase ids)
  {
    family: "maiden",
    shortName: "Maiden",
    primaryId: 8360,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [
      8360,
      8361,
      8362,
      8363,
      8364,
      8365, // regular
      10814,
      10815,
      10816,
      10817,
      10818,
      10819, // entry
      10822,
      10823,
      10824,
      10825,
      10826,
      10827, // hard
    ],
  },
  // Theatre of Blood — Nylocas Vasilias (style / mode forms)
  {
    family: "nylocas-vasilias",
    shortName: "Nylo Boss",
    primaryId: 8355,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [
      8354,
      8355,
      8356,
      8357, // regular
      10786,
      10787,
      10788,
      10789, // entry
      10807,
      10808,
      10809,
      10810, // hard
    ],
  },
  // Theatre of Blood — Sotetseg
  {
    family: "sotetseg",
    shortName: "Sotetseg",
    primaryId: 8388,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [
      8387,
      8388, // regular idle / combat
      10864,
      10865, // entry
      10867,
      10868, // hard
    ],
  },
  // Theatre of Blood — Bloat
  {
    family: "bloat",
    shortName: "Bloat",
    primaryId: 8359,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [8359, 10812, 10813],
  },
  // Theatre of Blood — Xarpus
  {
    family: "xarpus",
    shortName: "Xarpus",
    primaryId: 8340,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [
      8338,
      8339,
      8340,
      8341, // regular
      10766,
      10767,
      10768,
      10769, // entry
      10770,
      10771,
      10772,
      10773, // hard
    ],
  },
  // Theatre of Blood — Verzik (P1–P3 combat forms)
  {
    family: "verzik",
    shortName: "Verzik",
    primaryId: 8370,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [
      8370,
      8371,
      8372,
      8373,
      8374,
      8375, // regular
      10830,
      10831,
      10832,
      10833,
      10834,
      10835,
      10836, // entry
      10848,
      10849,
      10850,
      10851,
      10852,
      10853, // hard
    ],
  },
  // Doom of Mokhaiotl
  {
    family: "mokhaiotl",
    shortName: "Mokhaiotl",
    primaryId: 14707,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [14707, 14708, 14709],
  },
  // Inferno
  {
    family: "jal-mejrah",
    shortName: "Bat",
    primaryId: 7692,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7692],
  },
  {
    family: "jal-ak",
    shortName: "Blob",
    primaryId: 7693,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7693],
  },
  {
    family: "jal-akrek-mej",
    shortName: "Mage bloblet",
    primaryId: 7694,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7694],
  },
  {
    family: "jal-akrek-xil",
    shortName: "Ranged bloblet",
    primaryId: 7695,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7695],
  },
  {
    family: "jal-akrek-ket",
    shortName: "Melee bloblet",
    primaryId: 7696,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7696],
  },
  {
    family: "jal-imkot",
    shortName: "Meleer",
    primaryId: 7697,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7697],
  },
  {
    family: "jal-xil",
    shortName: "Ranger",
    primaryId: 7698,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7698, 7702],
  },
  {
    family: "jal-zek",
    shortName: "Mager",
    primaryId: 7699,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7699, 7703],
  },
  {
    family: "jaltok-jad",
    shortName: "Jad",
    primaryId: 7700,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7700, 7704],
  },
  {
    family: "yt-hurkot",
    shortName: "Healer",
    primaryId: 7701,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7701, 7705],
  },
  {
    family: "tzkal-zuk",
    shortName: "Zuk",
    primaryId: 7706,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [7706],
  },
  // Fortis Colosseum
  {
    family: "jaguar-warrior",
    shortName: "Jaguar",
    primaryId: 12810,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12810],
  },
  {
    family: "serpent-shaman",
    shortName: "Shaman",
    primaryId: 12811,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12811],
  },
  {
    family: "minotaur",
    shortName: "Minotaur",
    primaryId: 12812,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12812, 12813],
  },
  {
    family: "fremennik-archer",
    shortName: "Archer",
    primaryId: 12814,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12814],
  },
  {
    family: "fremennik-seer",
    shortName: "Seer",
    primaryId: 12815,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12815],
  },
  {
    family: "fremennik-berserker",
    shortName: "Berserker",
    primaryId: 12816,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12816],
  },
  {
    family: "javelin-colossus",
    shortName: "Javelin",
    primaryId: 12817,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12817],
  },
  {
    family: "manticore",
    shortName: "Manticore",
    primaryId: 12818,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12818],
  },
  {
    family: "shockwave-colossus",
    shortName: "Shockwave",
    primaryId: 12819,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12819],
  },
  {
    family: "sol-heredit",
    shortName: "Sol Heredit",
    primaryId: 12821,
    minVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    ids: [12821],
  },
];

export interface TrackedNpcAttackLookup {
  family: string;
  shortName: string;
  primaryId: number;
  minVersion: string;
}

const TRACKED_BY_ID: Map<number, TrackedNpcAttackLookup> = (() => {
  const map = new Map<number, TrackedNpcAttackLookup>();
  for (const def of TRACKED_NPC_ATTACK_NPCS) {
    const lookup: TrackedNpcAttackLookup = {
      family: def.family,
      shortName: def.shortName,
      primaryId: def.primaryId,
      minVersion: def.minVersion,
    };
    for (const id of def.ids) {
      map.set(id, lookup);
    }
  }
  return map;
})();

export function getTrackedNpcAttackNpc(
  npcId: number | undefined,
): TrackedNpcAttackLookup | undefined {
  if (npcId == null) {
    return undefined;
  }
  return TRACKED_BY_ID.get(npcId);
}

export function isNpcAttackTrackingSupported(
  logVersion: string | undefined,
  minVersion: string = NPC_ATTACK_ANIMATION_VERSION_1_6_9,
): boolean {
  if (!logVersion) {
    return false;
  }
  try {
    return semver.gte(logVersion, minVersion);
  } catch {
    return false;
  }
}

export function npcAttackRowKey(family: string, index: number): string {
  return `${family}:${index}`;
}

export function getTrackedNpcDisplayName(
  tracked: Pick<TrackedNpcAttackLookup, "shortName" | "primaryId">,
  fallback?: string,
): string {
  return (
    tracked.shortName ||
    npcIdMap[tracked.primaryId]?.name ||
    fallback ||
    `NPC ${tracked.primaryId}`
  );
}

/**
 * Whether a tracked NPC should sort first on the tick chart for this fight.
 */
export function isMainBossTrackedNpc(
  tracked: Pick<TrackedNpcAttackLookup, "shortName" | "primaryId">,
  fight: Fight,
): boolean {
  const mainEnemy = fight.mainEnemyName;
  if (!mainEnemy) {
    return false;
  }

  const shortName = tracked.shortName;
  const fullName = npcIdMap[tracked.primaryId]?.name;

  if (shortName === mainEnemy || fullName === mainEnemy) {
    return true;
  }
  if (mainEnemy.startsWith(shortName)) {
    return true;
  }
  if (
    fullName &&
    (mainEnemy.startsWith(fullName) || fullName.startsWith(mainEnemy))
  ) {
    return true;
  }
  // Content-level names that differ from the short label
  if (mainEnemy === "Doom of Mokhaiotl" && shortName === "Mokhaiotl") {
    return true;
  }
  if (mainEnemy.includes("Nylocas") && shortName === "Nylo Boss") {
    return true;
  }
  return false;
}

function actorsFromLogLine(logLine: LogLine): Actor[] {
  const actors: Actor[] = [];
  if ("source" in logLine && logLine.source) {
    actors.push(logLine.source);
  }
  if ("target" in logLine && logLine.target) {
    actors.push(logLine.target);
  }
  if (logLine.type === LogTypes.NPC_CHANGED) {
    if (logLine.oldNpc) {
      actors.push(logLine.oldNpc);
    }
    if (logLine.newNpc) {
      actors.push(logLine.newNpc);
    }
  }
  return actors;
}

export interface PresentTrackedNpc {
  key: string;
  family: string;
  primaryId: number;
  index: number;
  name: string;
  minVersion: string;
}

/**
 * Finds tracked NPC instances present in the fight when the log version supports
 * recording their attack animations.
 */
export function getPresentTrackedNpcAttackNpcs(
  fight: Fight,
): PresentTrackedNpc[] {
  if (!isNpcAttackTrackingSupported(fight.logVersion)) {
    return [];
  }

  const byKey = new Map<string, PresentTrackedNpc>();

  for (const logLine of fight.data) {
    for (const actor of actorsFromLogLine(logLine)) {
      const tracked = getTrackedNpcAttackNpc(actor.id);
      if (!tracked || actor.index == null) {
        continue;
      }
      if (!isNpcAttackTrackingSupported(fight.logVersion, tracked.minVersion)) {
        continue;
      }

      const key = npcAttackRowKey(tracked.family, actor.index);
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          family: tracked.family,
          primaryId: tracked.primaryId,
          index: actor.index,
          name:
            actor.chartLabel?.trim() ||
            getTrackedNpcDisplayName(tracked, actor.name),
          minVersion: tracked.minVersion,
        });
      }
    }
  }

  return Array.from(byKey.values());
}
