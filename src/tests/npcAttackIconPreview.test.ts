import { describe, expect, it } from "vitest";
import {
  PREVIEW_ATTACKS_BY_FAMILY,
  createNpcAttackIconPreviewFight,
} from "../components/dev/maidenNpcAttackPreviewData";
import { TRACKED_NPC_ATTACK_NPCS } from "../utils/trackedNpcAttackNpcs";
import { NPC_ATTACK_ANIMATION_META } from "../utils/npcAttackAnimationNames";
import { getPresentTrackedNpcAttackNpcs } from "../utils/trackedNpcAttackNpcs";
import { LogTypes } from "../models/LogLine";

describe("npc attack icon preview", () => {
  it("includes a row for every tracked NPC family", () => {
    const fight = createNpcAttackIconPreviewFight();
    const present = getPresentTrackedNpcAttackNpcs(fight);
    expect(present).toHaveLength(TRACKED_NPC_ATTACK_NPCS.length);
    for (const npc of TRACKED_NPC_ATTACK_NPCS) {
      expect(present.some((p) => p.family === npc.family)).toBe(true);
    }
  });

  it("fires every mapped animation id at least once", () => {
    const fight = createNpcAttackIconPreviewFight();
    const attackLines = fight.data.filter(
      (line) => line.type === LogTypes.PLAYER_ATTACK_ANIMATION,
    );
    const fired = new Set(
      attackLines
        .map((line) => ("animationId" in line ? line.animationId : undefined))
        .filter((id): id is number => id != null),
    );

    for (const animationId of Object.keys(NPC_ATTACK_ANIMATION_META).map(
      Number,
    )) {
      expect(fired.has(animationId)).toBe(true);
    }

    const verzikP2Projectiles = new Set(
      attackLines
        .filter(
          (line) =>
            "animationId" in line &&
            line.animationId === 8114 &&
            "projectileId" in line &&
            line.projectileId != null,
        )
        .map((line) => ("projectileId" in line ? line.projectileId : undefined))
        .filter((id): id is number => id != null),
    );
    expect(verzikP2Projectiles).toEqual(new Set([1583, 1585, 1586, 1591]));

    const verzikSpecials = new Set(
      attackLines
        .filter((line) => "attackSpecial" in line && line.attackSpecial != null)
        .map((line) =>
          "attackSpecial" in line ? line.attackSpecial : undefined,
        )
        .filter((name): name is NonNullable<typeof name> => name != null),
    );
    expect(verzikSpecials.has("DEATH_BALL")).toBe(true);
    expect(verzikSpecials.has("SLAM")).toBe(true);
    expect(verzikSpecials.has("SHOCKWAVE")).toBe(true);
    expect(verzikSpecials.has("MANTICORE_MAGE")).toBe(true);

    const animationIds = new Set(
      attackLines
        .filter((line) => "animationId" in line && line.animationId)
        .map((line) => ("animationId" in line ? line.animationId : undefined))
        .filter((id): id is number => id != null),
    );
    expect(animationIds.has(8082)).toBe(true); // Bloat down
    expect(animationIds.has(8059)).toBe(true); // Xarpus spit
    expect(animationIds.has(8123)).toBe(true); // Verzik P3 melee
    expect(animationIds.has(8126)).toBe(true); // Verzik P3 yellows
    expect(animationIds.has(8127)).toBe(true); // Verzik P3 webs

    const mokhaiotlProjectiles = new Set(
      attackLines
        .filter(
          (line) =>
            "animationId" in line &&
            (line.animationId === 12406 || line.animationId === 12407) &&
            "projectileId" in line &&
            line.projectileId != null,
        )
        .map((line) => ("projectileId" in line ? line.projectileId : undefined))
        .filter((id): id is number => id != null),
    );
    expect(mokhaiotlProjectiles).toEqual(
      new Set([3378, 3379, 3380, 3384, 3385]),
    );
  });

  it("defines preview attacks for every tracked family", () => {
    for (const npc of TRACKED_NPC_ATTACK_NPCS) {
      expect(PREVIEW_ATTACKS_BY_FAMILY[npc.family]?.length).toBeGreaterThan(0);
    }
  });
});
