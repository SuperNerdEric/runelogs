import { describe, expect, it } from "vitest";
import {
  BLOAT_STOMP_IMAGE_URL,
  formatAttackAnimationEventDetail,
  getNpcAttackAnimationMeta,
  getNpcAttackAnimationName,
  resolveNpcAttackImageUrl,
} from "../utils/npcAttackAnimationNames";
import { getNpcImageUrl } from "../lib/npcImageOverlay";

const V = "20260713q";
const icon = (path: string) => `/images/npc-attacks/${path}?v=${V}`;

describe("npcAttackAnimationNames", () => {
  it("formats events-table labels with pretty names and ids", () => {
    expect(
      formatAttackAnimationEventDetail({
        animationId: 8082,
        source: { id: 8359, isPlayer: false },
      }),
    ).toBe("Down (8082)");
    expect(
      formatAttackAnimationEventDetail({
        animationId: 8056,
        source: { name: "Player", isPlayer: true },
      }),
    ).toBe("8056");
  });

  it("names Maiden attacks", () => {
    expect(getNpcAttackAnimationName(8092)).toBe("Auto attack");
    expect(getNpcAttackAnimationName(8091)).toBe("Blood throw");
  });

  it("uses the NPC moid image for auto attacks", () => {
    expect(getNpcAttackAnimationMeta(8092).imageUrl).toBeUndefined();
    expect(resolveNpcAttackImageUrl(8092, 8360)).toBe(getNpcImageUrl(8360));
  });

  it("uses form moid icons for Nylo boss styles", () => {
    expect(resolveNpcAttackImageUrl(8004, 8355)).toBe(getNpcImageUrl(8355));
    expect(resolveNpcAttackImageUrl(7989, 8356)).toBe(getNpcImageUrl(8356));
    expect(resolveNpcAttackImageUrl(7999, 8357)).toBe(getNpcImageUrl(8357));
  });

  it("keeps custom icons for non-auto attacks", () => {
    expect(getNpcAttackAnimationMeta(8091).imageUrl).toBeTruthy();
    expect(resolveNpcAttackImageUrl(8091, 8360)).toBe(
      getNpcAttackAnimationMeta(8091).imageUrl,
    );
    expect(resolveNpcAttackImageUrl(8091, 8360)).toBe(
      icon("maiden_blood_throw.png"),
    );
  });

  it("uses the NPC moid image for bloblet attacks", () => {
    expect(resolveNpcAttackImageUrl(7581, 7694)).toBe(getNpcImageUrl(7694));
    expect(resolveNpcAttackImageUrl(7583, 7695)).toBe(getNpcImageUrl(7695));
    expect(resolveNpcAttackImageUrl(7582, 7696)).toBe(getNpcImageUrl(7696));
    expect(getNpcAttackAnimationName(7581, 7694)).toBe("Auto attack");
  });

  it("keeps Jal-Ak style icons as the matching bloblet moid", () => {
    expect(resolveNpcAttackImageUrl(7581, 7693)).toBe(getNpcImageUrl(7694));
    expect(resolveNpcAttackImageUrl(7582, 7693)).toBe(getNpcImageUrl(7696));
    expect(resolveNpcAttackImageUrl(7583, 7693)).toBe(getNpcImageUrl(7695));
  });

  it("differentiates Verzik P2 styles by projectile id", () => {
    expect(getNpcAttackAnimationName(8114, 8370, 1583)).toBe("Ranged attack");
    expect(getNpcAttackAnimationName(8114, 8370, 1585)).toBe("Zap");
    expect(getNpcAttackAnimationName(8114, 8370, 1586)).toBe("Purple crab");
    expect(getNpcAttackAnimationName(8114, 8370, 1591)).toBe("Magic attack");
    expect(resolveNpcAttackImageUrl(8114, 8370, 1583)).toBe(
      icon("verzik_p2_cabbage.png"),
    );
    expect(resolveNpcAttackImageUrl(8114, 8370, 1586)).toBe(
      getNpcImageUrl(8384),
    );
    expect(resolveNpcAttackImageUrl(8114, 8370)).toBe(getNpcImageUrl(8370));
  });

  it("names Verzik P3 attack animations", () => {
    expect(getNpcAttackAnimationName(8123, 8374)).toBe("Melee attack");
    expect(getNpcAttackAnimationName(8124, 8374)).toBe("Magic attack");
    expect(getNpcAttackAnimationName(8125, 8374)).toBe("Ranged attack");
    expect(getNpcAttackAnimationName(8125, 8374, 1598)).toBe("Green ball");
    expect(getNpcAttackAnimationName(8126, 8374)).toBe("Yellows");
    expect(getNpcAttackAnimationName(8127, 8374)).toBe("Webs");
    expect(resolveNpcAttackImageUrl(8127, 8374)).toBe(
      icon("verzik_p3_webs.png"),
    );
    expect(resolveNpcAttackImageUrl(8126, 8374)).toBe(
      icon("verzik_p3_yellow.png"),
    );
    expect(resolveNpcAttackImageUrl(8125, 8374, 1598)).toBe(
      icon("verzik_p3_ball.png"),
    );
  });

  it("keeps legacy Verzik P3 timed special names for old logs", () => {
    expect(getNpcAttackAnimationName(0, 8374, undefined, "WEBS")).toBe("Webs");
    expect(getNpcAttackAnimationName(0, 8374, undefined, "YELLOWS")).toBe(
      "Yellows",
    );
    expect(getNpcAttackAnimationName(0, 8374, undefined, "BALL")).toBe(
      "Green ball",
    );
  });

  it("names helper-derived specials", () => {
    expect(getNpcAttackAnimationName(8082, 8359)).toBe("Down");
    expect(resolveNpcAttackImageUrl(8082, 8359)).toBe(icon("bloat_down.png"));
    expect(BLOAT_STOMP_IMAGE_URL).toBe(icon("bloat_stomp.png"));
    expect(getNpcAttackAnimationName(0, 8388, undefined, "DEATH_BALL")).toBe(
      "Death ball",
    );
    expect(getNpcAttackAnimationName(8059, 8340)).toBe("Spit");
    expect(resolveNpcAttackImageUrl(8059, 8340)).toBe(icon("xarpus_spit.png"));
    expect(getNpcAttackAnimationName(0, 8340, undefined, "SPIT")).toBe("Spit");
    expect(getNpcAttackAnimationName(0, 8340, undefined, "SCREECH")).toBe(
      "Screech",
    );
    expect(getNpcAttackAnimationName(0, 8340, undefined, "TURN")).toBe("Turn");
    expect(
      getNpcAttackAnimationName(0, 12818, undefined, "MANTICORE_MAGE"),
    ).toBe("Magic attack");
    expect(
      resolveNpcAttackImageUrl(0, 12818, undefined, "MANTICORE_MAGE"),
    ).toBe(icon("colosseum/manticore-mage.png"));
    expect(
      resolveNpcAttackImageUrl(0, 12818, undefined, "MANTICORE_RANGE"),
    ).toBe(icon("colosseum/manticore-range.png"));
    expect(
      resolveNpcAttackImageUrl(0, 12818, undefined, "MANTICORE_MELEE"),
    ).toBe(icon("colosseum/manticore-melee.png"));
    expect(getNpcAttackAnimationName(0, 14707, undefined, "SLAM")).toBe("Slam");
  });

  it("uses cropped local moid for Bat auto (like Sotetseg melee)", () => {
    expect(getNpcAttackAnimationName(7578, 7692)).toBe("Auto attack");
    expect(resolveNpcAttackImageUrl(7578, 7692)).toBe(
      icon("inferno/bat-auto.png"),
    );
  });

  it("differentiates Sotetseg ball styles by projectile id", () => {
    expect(getNpcAttackAnimationName(8138, 8388)).toBe("Melee attack");
    expect(resolveNpcAttackImageUrl(8138, 8388)).toBe(icon("sote_melee.png"));
    expect(getNpcAttackAnimationName(8139, 8388, 1606)).toBe("Magic ball");
    expect(getNpcAttackAnimationName(8139, 8388, 1607)).toBe("Ranged ball");
    expect(getNpcAttackAnimationName(8139, 8388)).toBe("Ball");
    expect(resolveNpcAttackImageUrl(8139, 8388, 1606)).toBe(
      icon("sote_magic_ball.png"),
    );
    expect(resolveNpcAttackImageUrl(8139, 8388, 1607)).toBe(
      icon("sote_ranged_ball.png"),
    );
    expect(resolveNpcAttackImageUrl(0, 8388, undefined, "DEATH_BALL")).toBe(
      icon("sote_death_ball.png"),
    );
  });

  it("differentiates Mokhaiotl styles by projectile id", () => {
    expect(getNpcAttackAnimationName(12406, 14707, 3378)).toBe("Melee orb");
    expect(getNpcAttackAnimationName(12406, 14707, 3379)).toBe("Magic orb");
    expect(getNpcAttackAnimationName(12407, 14707, 3384)).toBe("Ranged ball");
    expect(resolveNpcAttackImageUrl(12406, 14707, 3380)).toBe(
      icon("mokhaiotl/ranged-orb.png"),
    );
    expect(resolveNpcAttackImageUrl(12406, 14707, 3378)).toBe(
      icon("mokhaiotl/melee-orb.png"),
    );
    expect(resolveNpcAttackImageUrl(12407, 14707, 3385)).toBe(
      icon("mokhaiotl/magic-ball.png"),
    );
  });

  it("uses moid+punch composites for Inferno/Mokhaiotl melee styles", () => {
    expect(getNpcAttackAnimationName(7604, 7698)).toBe("Melee attack");
    expect(resolveNpcAttackImageUrl(7604, 7698)).toBe(
      icon("inferno/ranger-melee.png"),
    );
    expect(resolveNpcAttackImageUrl(7612, 7699)).toBe(
      icon("inferno/mager-melee.png"),
    );
    expect(resolveNpcAttackImageUrl(7590, 7700)).toBe(
      icon("inferno/jad-melee.png"),
    );
    expect(resolveNpcAttackImageUrl(12416, 14707)).toBe(
      icon("mokhaiotl/melee.png"),
    );
    expect(resolveNpcAttackImageUrl(12417, 14707)).toBe(getNpcImageUrl(14709));
  });

  it("resolves Verzik bounce / cabbage / webs and Javelin toss to the shipped assets", () => {
    expect(resolveNpcAttackImageUrl(8116, 8372)).toBe(
      icon("verzik_p2_bounce.png"),
    );
    expect(resolveNpcAttackImageUrl(8114, 8370, 1583)).toBe(
      icon("verzik_p2_cabbage.png"),
    );
    expect(resolveNpcAttackImageUrl(8127, 8374)).toBe(
      icon("verzik_p3_webs.png"),
    );
    expect(resolveNpcAttackImageUrl(0, 8374, undefined, "WEBS")).toBe(
      icon("verzik_p3_webs.png"),
    );
    expect(resolveNpcAttackImageUrl(10893, 12817)).toBe(
      icon("colosseum/javelin-toss.png"),
    );
  });

  it("falls back for unknown animation ids", () => {
    const unknown = getNpcAttackAnimationMeta(1);
    expect(unknown.name).toBe("Animation 1");
    expect(unknown.imageUrl).toBe(icon("huh.png"));
  });
});
