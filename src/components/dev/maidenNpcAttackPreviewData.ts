import { Fight } from "../../models/Fight";
import {
  AttackAnimationLog,
  BoostedLevelsLog,
  GroundObjectSpawned,
  LogLine,
  LogTypes,
  NpcAttackSpecialName,
  PlayerEquipmentLog,
  PositionLog,
} from "../../models/LogLine";
import {
  NPC_ATTACK_ANIMATION_VERSION_1_6_9,
  TRACKED_NPC_ATTACK_NPCS,
} from "../../utils/trackedNpcAttackNpcs";
import { XARPUS_EXHUMED_GROUND_OBJECT_ID } from "../../utils/xarpusExhumeHighlight";
import { npcIdMap } from "../../lib/npcIdMap";

const DATE = "07-11-2026";
const TIME = "13:00:00";
const TZ = "Z-0500";

const PLAYER = "Alice";
const PLAYER_ACTOR = { name: PLAYER, isPlayer: true as const };

/** Maiden room coords — map backdrop only; tick chart is the focus. */
const ROOM_POS = { x: 3178, y: 4446, plane: 0 };

const SCYTHE_EQUIPMENT = [
  "0",
  "0",
  "0",
  "22325",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
];

/**
 * Attack animation ids / timed specials to show per tracked NPC family.
 */
export type PreviewNpcAttack =
  | number
  | { animationId: number; projectileId?: number }
  | { special: NpcAttackSpecialName };

export const PREVIEW_ATTACKS_BY_FAMILY: Record<string, PreviewNpcAttack[]> = {
  maiden: [8092, 8091],
  "nylocas-vasilias": [8004, 7999, 7989],
  sotetseg: [
    8138,
    { animationId: 8139, projectileId: 1606 },
    { animationId: 8139, projectileId: 1607 },
    { special: "DEATH_BALL" },
  ],
  bloat: [8082],
  xarpus: [8059, { special: "TURN" }],
  verzik: [
    8109,
    { animationId: 8114, projectileId: 1583 },
    { animationId: 8114, projectileId: 1585 },
    { animationId: 8114, projectileId: 1586 },
    { animationId: 8114, projectileId: 1591 },
    8116,
    8123,
    8124,
    8125,
    { animationId: 8125, projectileId: 1598 },
    8126,
    8127,
  ],
  mokhaiotl: [
    { animationId: 12406, projectileId: 3378 },
    { animationId: 12406, projectileId: 3379 },
    { animationId: 12406, projectileId: 3380 },
    { animationId: 12407, projectileId: 3384 },
    { animationId: 12407, projectileId: 3385 },
    12409,
    12411,
    12416,
    12417,
    { special: "SLAM" },
    { special: "SHOCKWAVE" },
  ],
  "jal-mejrah": [7578],
  "jal-ak": [7581, 7582, 7583],
  "jal-akrek-mej": [7581],
  "jal-akrek-xil": [7583],
  "jal-akrek-ket": [7582],
  "jal-imkot": [7597, 7600],
  "jal-xil": [7605, 7604],
  "jal-zek": [7610, 7611, 7612],
  "jaltok-jad": [7593, 7592, 7590],
  "yt-hurkot": [2637],
  "tzkal-zuk": [7566],
  "jaguar-warrior": [10847],
  "serpent-shaman": [10859],
  minotaur: [10843],
  "fremennik-archer": [10850],
  "fremennik-seer": [10853],
  "fremennik-berserker": [10856],
  "javelin-colossus": [10892, 10893],
  manticore: [
    10869,
    { special: "MANTICORE_MAGE" },
    { special: "MANTICORE_RANGE" },
    { special: "MANTICORE_MELEE" },
  ],
  "shockwave-colossus": [10903],
  "sol-heredit": [10883, 10884, 10885, 10887],
};

const START_TICK = 1000;
/**
 * First relative tick that holds attack cells. Use 0 so chart column "1"
 * (tick - initialTick + 1) aligns with the first attack — setup logs share tick 0.
 */
const FIRST_ATTACK_TICK = 0;

function base(
  tick: number,
): Pick<LogLine, "date" | "time" | "timezone" | "tick" | "fightTimeMs"> {
  return {
    date: DATE,
    time: TIME,
    timezone: TZ,
    tick: START_TICK + tick,
    fightTimeMs: tick * 600,
  };
}

function position(
  tick: number,
  source: PositionLog["source"],
  pos: PositionLog["position"],
): PositionLog {
  return {
    type: LogTypes.POSITION,
    ...base(tick),
    source,
    position: pos,
  };
}

function equipment(
  tick: number,
  source: PlayerEquipmentLog["source"],
  playerEquipment: string[],
): PlayerEquipmentLog {
  return {
    type: LogTypes.PLAYER_EQUIPMENT,
    ...base(tick),
    source,
    playerEquipment,
  };
}

function boosted(
  tick: number,
  source: BoostedLevelsLog["source"],
): BoostedLevelsLog {
  return {
    type: LogTypes.BOOSTED_LEVELS,
    ...base(tick),
    source,
    boostedLevels: {
      attack: 118,
      strength: 118,
      defence: 99,
      ranged: 112,
      magic: 99,
      hitpoints: 99,
      prayer: 77,
    },
  };
}

function attack(
  tick: number,
  source: AttackAnimationLog["source"],
  target: AttackAnimationLog["target"],
  animationId: number,
  projectileId?: number,
  attackSpecial?: AttackAnimationLog["attackSpecial"],
): AttackAnimationLog {
  return {
    type: LogTypes.PLAYER_ATTACK_ANIMATION,
    ...base(tick),
    source,
    target,
    animationId,
    ...(projectileId != null ? { projectileId } : {}),
    ...(attackSpecial != null ? { attackSpecial } : {}),
  };
}

function groundObjectSpawn(
  tick: number,
  id: number,
  pos: GroundObjectSpawned["position"],
): GroundObjectSpawned {
  return {
    type: LogTypes.GROUND_OBJECT_SPAWNED,
    ...base(tick),
    id,
    position: pos,
  };
}

/**
 * Synthetic fight with one tick-chart row per tracked NPC and every mapped
 * attack icon. Attacks share the earliest ticks (1st icon on display column 1
 * / relative tick 0 for every NPC, 2nd on column 2, etc.).
 */
export function createNpcAttackIconPreviewFight(): Fight {
  const data: LogLine[] = [
    position(0, PLAYER_ACTOR, ROOM_POS),
    equipment(0, PLAYER_ACTOR, SCYTHE_EQUIPMENT),
    boosted(0, PLAYER_ACTOR),
  ];

  let maxAttackIndex = 0;

  TRACKED_NPC_ATTACK_NPCS.forEach((npc, i) => {
    const index = 60000 + i;
    const actor = {
      name: npcIdMap[npc.primaryId]?.name ?? npc.shortName,
      id: npc.primaryId,
      index,
      isPlayer: false as const,
    };

    data.push(position(0, actor, ROOM_POS));

    const animations = PREVIEW_ATTACKS_BY_FAMILY[npc.family] ?? [];
    let familyAttackSlots = animations.length;
    // P1 exhume spawns are ground objects, not attack anims — show on the Xarpus row.
    if (npc.family === "xarpus") {
      familyAttackSlots += 1;
    }
    maxAttackIndex = Math.max(maxAttackIndex, familyAttackSlots - 1);
    animations.forEach((entry, animIndex) => {
      if (typeof entry === "object" && "special" in entry) {
        data.push(
          attack(
            FIRST_ATTACK_TICK + animIndex,
            actor,
            PLAYER_ACTOR,
            0,
            undefined,
            entry.special,
          ),
        );
        return;
      }

      const animationId = typeof entry === "number" ? entry : entry.animationId;
      const projectileId =
        typeof entry === "number" ? undefined : entry.projectileId;
      data.push(
        attack(
          FIRST_ATTACK_TICK + animIndex,
          actor,
          PLAYER_ACTOR,
          animationId,
          projectileId,
        ),
      );
    });

    if (npc.family === "xarpus") {
      data.push(
        groundObjectSpawn(
          FIRST_ATTACK_TICK + animations.length,
          XARPUS_EXHUMED_GROUND_OBJECT_ID,
          ROOM_POS,
        ),
      );
    }
  });

  const fightTicks = FIRST_ATTACK_TICK + maxAttackIndex + 4;
  for (let tick = 4; tick <= fightTicks; tick += 8) {
    data.push(position(tick, PLAYER_ACTOR, ROOM_POS));
  }

  data.sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0));

  const firstLine = data[0];
  const lastLine = data[data.length - 1];

  return {
    id: "preview-npc-attack-icons",
    name: "NPC Attack Icons - Preview",
    mainEnemyName: "The Maiden of Sugadinti",
    startTime: "2026-07-11T18:00:00.000Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    metaData: {
      name: "NPC Attack Icons - Preview",
      startTime: "2026-07-11T18:00:00.000Z",
      fightDurationTicks: fightTicks,
      success: true,
    },
    data,
    enemyNames: TRACKED_NPC_ATTACK_NPCS.map((npc) => npc.shortName),
    loggedInPlayer: PLAYER,
    players: [PLAYER],
    logVersion: NPC_ATTACK_ANIMATION_VERSION_1_6_9,
    firstLine,
    lastLine,
  };
}

/** @deprecated Use createNpcAttackIconPreviewFight */
export function createMaidenNpcAttackPreviewFight(): Fight {
  return createNpcAttackIconPreviewFight();
}
