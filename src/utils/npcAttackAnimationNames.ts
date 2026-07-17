import { getNpcImageUrl } from "../lib/npcImageOverlay";
import { getTrackedNpcAttackNpc } from "./trackedNpcAttackNpcs";
import type { NpcAttackSpecialName } from "../models/LogLine";

/**
 * Display metadata for recorded NPC attack animations (tick-chart cells/tooltips).
 * Keys are animation IDs logged by Combat Logger.
 * Omit imageUrl for autos — the NPC moid image is used instead.
 */
export interface NpcAttackAnimationMeta {
  name: string;
  /** Custom attack icon; when omitted, use the NPC's moid image. */
  imageUrl?: string;
}

const ROOT = "/images/npc-attacks";
/**
 * Bump when replacing public NPC-attack PNGs/WEBPs in place.
 * Public URLs are not content-hashed by Vite, so browsers (and some preview
 * sessions) keep serving the previous bytes until the query string changes.
 *
 * Wiring rule: all tick-chart attack icons live under public/images/npc-attacks
 * and resolve through publicNpcAttackIcon() in this module. Field map
 * spotanims stay under src/assets/graphicObjects (graphicObjectIdMap) — do not
 * mix the two.
 */
const PUBLIC_ICON_VERSION = "20260713q";

function publicNpcAttackIcon(relativePath: string): string {
  return `${ROOT}/${relativePath}?v=${PUBLIC_ICON_VERSION}`;
}

/** Synthesized Bloat Stomp icon (not a logged attack special). */
export const BLOAT_STOMP_IMAGE_URL = publicNpcAttackIcon("bloat_stomp.png");

/** Nylocas Matomenos moid, used for Maiden phase-spawn markers/tick events. */
export const NYLOCAS_MATOMENOS_IMAGE_URL = getNpcImageUrl(8366);

/** Nylocas Vasilias moid, used for the Nylo boss-spawn marker/tick event. */
export const NYLOCAS_VASILIAS_IMAGE_URL = getNpcImageUrl(8355);

/** Nylocas Prinkipas moid, used for the HMT miniboss-spawn markers. */
export const NYLOCAS_PRINKIPAS_IMAGE_URL = getNpcImageUrl(10803);

/** Sotetseg moid, used for the maze-phase highlight markers. */
export const SOTETSEG_IMAGE_URL = getNpcImageUrl(8388);

/** Synthesized Xarpus Turn icon (from logged SCREECH; not a per-tick special). */
export const XARPUS_TURN_IMAGE_URL = publicNpcAttackIcon("xarpus_turn.png");

/** Bloblets share Jal-Ak anims but always show their own moid icon. */
function usesNpcMoidAttackIcon(npcId: number): boolean {
  const family = getTrackedNpcAttackNpc(npcId)?.family;
  return family?.startsWith("jal-akrek") ?? false;
}

export const NPC_ATTACK_ANIMATION_META: Record<number, NpcAttackAnimationMeta> =
  {
    // Theatre of Blood — Maiden
    8091: {
      name: "Blood throw",
      imageUrl: publicNpcAttackIcon("maiden_blood_throw.png"),
    },
    8092: { name: "Auto attack" },
    // Theatre of Blood — Nylocas Vasilias (form moids)
    7989: {
      name: "Magic attack",
      imageUrl: getNpcImageUrl(8356),
    },
    7999: {
      name: "Ranged attack",
      imageUrl: getNpcImageUrl(8357),
    },
    8004: {
      name: "Melee attack",
      imageUrl: getNpcImageUrl(8355),
    },
    // Theatre of Blood — Sotetseg
    // Melee: cropped local moid (Chisel 8388) — tighter than remote chisel URL
    8138: {
      name: "Melee attack",
      imageUrl: publicNpcAttackIcon("sote_melee.png"),
    },
    8139: {
      name: "Ball",
      imageUrl: publicNpcAttackIcon("sote_magic_ball.png"),
    },
    // Theatre of Blood — Xarpus P2 spit (P3 turns synthesize from SCREECH)
    8059: {
      name: "Spit",
      imageUrl: publicNpcAttackIcon("xarpus_spit.png"),
    },
    // Theatre of Blood — Bloat down (stomp remains timed special)
    8082: {
      name: "Down",
      imageUrl: publicNpcAttackIcon("bloat_down.png"),
    },
    // Theatre of Blood — Verzik
    8109: {
      name: "Auto attack",
      imageUrl: publicNpcAttackIcon("verzik_p1_auto.png"),
    },
    // P2 cast anim; style comes from projectileId when present
    8114: { name: "Auto attack" },
    8116: {
      name: "Bounce",
      imageUrl: publicNpcAttackIcon("verzik_p2_bounce.png"),
    },
    // P3 attack anims (replaces timed special lines for new logs)
    8123: {
      name: "Melee attack",
      imageUrl: publicNpcAttackIcon("verzik_p3_melee.png"),
    },
    8124: {
      name: "Magic attack",
      imageUrl: publicNpcAttackIcon("verzik_p3_mage.png"),
    },
    8125: {
      name: "Ranged attack",
      imageUrl: publicNpcAttackIcon("verzik_p3_range.png"),
    },
    8126: {
      name: "Yellows",
      imageUrl: publicNpcAttackIcon("verzik_p3_yellow.png"),
    },
    8127: {
      name: "Webs",
      imageUrl: publicNpcAttackIcon("verzik_p3_webs.png"),
    },
    // Doom of Mokhaiotl — orb/ball styles come from projectileId when present
    12406: { name: "Orb" },
    12407: { name: "Ball" },
    12409: {
      name: "Charge",
      // Face halves 56470+56467 (seam ±2) + 3412 frame-12 overlay (ffront_p12_s85 style).
      imageUrl: publicNpcAttackIcon("mokhaiotl/charge.png"),
    },
    12411: {
      name: "Blast",
      imageUrl: publicNpcAttackIcon("mokhaiotl/blast.png"),
    },
    12416: {
      name: "Melee attack",
      // Chisel moid 14707 + SpriteID 247 (unarmed punch) overlay
      imageUrl: publicNpcAttackIcon("mokhaiotl/melee.png"),
    },
    12417: {
      name: "Car",
      // Burrowed form moid
      imageUrl: getNpcImageUrl(14709),
    },
    // Inferno
    // Bat auto: cropped local moid (Chisel 7692) — tighter than remote chisel URL
    // (drops distant ground shadow / empty vertical space; same pattern as Sotetseg melee)
    7578: {
      name: "Auto attack",
      imageUrl: publicNpcAttackIcon("inferno/bat-auto.png"),
    },
    // Jal-Ak styles use the matching bloblet moid icon
    7581: {
      name: "Magic attack",
      imageUrl: getNpcImageUrl(7694),
    },
    7582: {
      name: "Melee attack",
      imageUrl: getNpcImageUrl(7696),
    },
    7583: {
      name: "Ranged attack",
      imageUrl: getNpcImageUrl(7695),
    },
    7597: { name: "Auto attack" },
    7600: {
      name: "Dig",
      imageUrl: publicNpcAttackIcon("inferno/meleer-dig.png"),
    },
    7604: {
      name: "Melee attack",
      // Chisel moid 7698 + SpriteID 247 (unarmed punch) overlay
      imageUrl: publicNpcAttackIcon("inferno/ranger-melee.png"),
    },
    7605: { name: "Auto attack" },
    7610: { name: "Auto attack" },
    7611: {
      name: "Resurrect",
      imageUrl: publicNpcAttackIcon("inferno/mager-resurrect.png"),
    },
    7612: {
      name: "Melee attack",
      // Chisel moid 7699 + SpriteID 247 (unarmed punch) overlay
      imageUrl: publicNpcAttackIcon("inferno/mager-melee.png"),
    },
    7590: {
      name: "Melee attack",
      // Chisel moid 7700 + SpriteID 247 (unarmed punch) overlay
      imageUrl: publicNpcAttackIcon("inferno/jad-melee.png"),
    },
    7592: {
      name: "Magic attack",
      imageUrl: publicNpcAttackIcon("inferno/jad-mage.png"),
    },
    7593: {
      name: "Ranged attack",
      imageUrl: publicNpcAttackIcon("inferno/jad-ranged.png"),
    },
    2637: { name: "Auto attack" },
    7566: { name: "Auto attack" },
    // Fortis Colosseum
    10847: { name: "Auto attack" },
    10859: { name: "Auto attack" },
    10843: { name: "Auto attack" },
    10850: { name: "Auto attack" },
    10853: { name: "Auto attack" },
    10856: { name: "Auto attack" },
    10892: { name: "Auto attack" },
    10893: {
      name: "Javelin toss",
      // Maya 10893 frame 55 (peak arm-up artillery wind-up); waist-up crop
      imageUrl: publicNpcAttackIcon("colosseum/javelin-toss.png"),
    },
    // Manticore throw anim is shared; styles are logged as specials.
    10869: {
      name: "Attack",
      imageUrl: publicNpcAttackIcon("colosseum/manticore.png"),
    },
    10903: { name: "Auto attack" },
    10883: {
      name: "Spear attack",
      // Maya 10883 f130; side yan 480; square zoom 215 + digitalZoom 3 on spear/hand
      imageUrl: publicNpcAttackIcon("colosseum/heredit-spear.png"),
    },
    10884: {
      name: "Grapple",
      // Maya 10884 f33; flipX/Y zoom 565 yan 1024 rotateY 257 shift -142/-9; onTop 52578,52582
      imageUrl: publicNpcAttackIcon("colosseum/heredit-grapple.png"),
    },
    10885: {
      name: "Shield attack",
      // Heredit shield model 52578 face-on (not helmet crest)
      imageUrl: publicNpcAttackIcon("colosseum/heredit-shield.png"),
    },
    10887: {
      name: "Triple parry attack",
      // Maya 10887 f65 pose-viewer + sparse spotanim 2668 telegraph sparkles; 640x640
      imageUrl: publicNpcAttackIcon("colosseum/heredit-combo.png"),
    },
  };

const UNKNOWN_FALLBACK_IMAGE = publicNpcAttackIcon("huh.png");

/** Verzik P2 shared cast (8114) styles keyed by projectile id. */
export const VERZIK_P2_PROJECTILE_META: Record<number, NpcAttackAnimationMeta> =
  {
    1583: {
      name: "Ranged attack",
      imageUrl: publicNpcAttackIcon("verzik_p2_cabbage.png"),
    },
    1585: {
      name: "Zap",
      imageUrl: publicNpcAttackIcon("verzik_p2_zap.png"),
    },
    1586: {
      name: "Purple crab",
      imageUrl: getNpcImageUrl(8384),
    },
    1591: {
      name: "Magic attack",
      imageUrl: publicNpcAttackIcon("verzik_p2_mage.png"),
    },
  };

/** Mokhaiotl orb (12406) / ball (12407) styles keyed by projectile id. */
export const MOKHAIOTL_STYLE_PROJECTILE_META: Record<
  number,
  NpcAttackAnimationMeta
> = {
  3378: {
    name: "Melee orb",
    imageUrl: publicNpcAttackIcon("mokhaiotl/melee-orb.png"),
  },
  3379: {
    name: "Magic orb",
    imageUrl: publicNpcAttackIcon("mokhaiotl/magic-orb.png"),
  },
  3380: {
    name: "Ranged orb",
    imageUrl: publicNpcAttackIcon("mokhaiotl/ranged-orb.png"),
  },
  3384: {
    name: "Ranged ball",
    imageUrl: publicNpcAttackIcon("mokhaiotl/ranged-ball.png"),
  },
  3385: {
    name: "Magic ball",
    imageUrl: publicNpcAttackIcon("mokhaiotl/magic-ball.png"),
  },
};

/** Sotetseg shared ball anim (8139) styles keyed by projectile id. */
export const SOTE_BALL_PROJECTILE_META: Record<number, NpcAttackAnimationMeta> =
  {
    1606: {
      name: "Magic ball",
      imageUrl: publicNpcAttackIcon("sote_magic_ball.png"),
    },
    1607: {
      name: "Ranged ball",
      imageUrl: publicNpcAttackIcon("sote_ranged_ball.png"),
    },
  };

/** Verzik P3 range anim (8125) + green-ball projectile. */
export const VERZIK_P3_PROJECTILE_META: Record<number, NpcAttackAnimationMeta> =
  {
    1598: {
      name: "Green ball",
      imageUrl: publicNpcAttackIcon("verzik_p3_ball.png"),
    },
  };

/** Helper-derived NPC attack specials (not animation-based). */
export const NPC_ATTACK_SPECIAL_META: Record<
  NpcAttackSpecialName,
  NpcAttackAnimationMeta
> = {
  WEBS: {
    name: "Webs",
    imageUrl: publicNpcAttackIcon("verzik_p3_webs.png"),
  },
  YELLOWS: {
    name: "Yellows",
    imageUrl: publicNpcAttackIcon("verzik_p3_yellow.png"),
  },
  BALL: {
    name: "Green ball",
    imageUrl: publicNpcAttackIcon("verzik_p3_ball.png"),
  },
  AUTO: { name: "Auto attack" },
  MELEE: {
    name: "Melee attack",
    imageUrl: publicNpcAttackIcon("verzik_p3_melee.png"),
  },
  RANGE: {
    name: "Ranged attack",
    imageUrl: publicNpcAttackIcon("verzik_p3_range.png"),
  },
  MAGE: {
    name: "Magic attack",
    imageUrl: publicNpcAttackIcon("verzik_p3_mage.png"),
  },
  DEATH_BALL: {
    name: "Death ball",
    imageUrl: publicNpcAttackIcon("sote_death_ball.png"),
  },
  SPIT: {
    name: "Spit",
    imageUrl: publicNpcAttackIcon("xarpus_spit.png"),
  },
  /** Logged once at P3 start; Turn icons are synthesized on the tick chart. */
  SCREECH: {
    name: "Screech",
  },
  /** Legacy / synthesized Turn display. */
  TURN: {
    name: "Turn",
    imageUrl: XARPUS_TURN_IMAGE_URL,
  },
  MANTICORE_MAGE: {
    name: "Magic attack",
    imageUrl: publicNpcAttackIcon("colosseum/manticore-mage.png"),
  },
  MANTICORE_RANGE: {
    name: "Ranged attack",
    imageUrl: publicNpcAttackIcon("colosseum/manticore-range.png"),
  },
  MANTICORE_MELEE: {
    name: "Melee attack",
    imageUrl: publicNpcAttackIcon("colosseum/manticore-melee.png"),
  },
  SLAM: {
    name: "Slam",
    imageUrl: publicNpcAttackIcon("mokhaiotl/shockwave.png"),
  },
  SHOCKWAVE: {
    name: "Shockwave",
    imageUrl: publicNpcAttackIcon("mokhaiotl/shockwave.png"),
  },
};

/** @deprecated Prefer NPC_ATTACK_SPECIAL_META */
export const VERZIK_P3_SPECIAL_META = {
  WEBS: NPC_ATTACK_SPECIAL_META.WEBS,
  YELLOWS: NPC_ATTACK_SPECIAL_META.YELLOWS,
  BALL: NPC_ATTACK_SPECIAL_META.BALL,
};

export type VerzikP3SpecialName = "WEBS" | "YELLOWS" | "BALL";

const VERZIK_P2_CAST_ANIMATION = 8114;
const VERZIK_P3_RANGE_ANIMATION = 8125;
const SOTE_BALL_ANIMATION = 8139;
const MOKHAIOTL_ORB_ANIMATION = 12406;
const MOKHAIOTL_BALL_ANIMATION = 12407;

export function getNpcAttackAnimationMeta(
  animationId: number,
  projectileId?: number,
  attackSpecial?: NpcAttackSpecialName,
): NpcAttackAnimationMeta {
  if (attackSpecial && NPC_ATTACK_SPECIAL_META[attackSpecial]) {
    return NPC_ATTACK_SPECIAL_META[attackSpecial];
  }
  if (
    animationId === VERZIK_P2_CAST_ANIMATION &&
    projectileId != null &&
    VERZIK_P2_PROJECTILE_META[projectileId]
  ) {
    return VERZIK_P2_PROJECTILE_META[projectileId];
  }
  if (
    animationId === VERZIK_P3_RANGE_ANIMATION &&
    projectileId != null &&
    VERZIK_P3_PROJECTILE_META[projectileId]
  ) {
    return VERZIK_P3_PROJECTILE_META[projectileId];
  }
  if (
    animationId === SOTE_BALL_ANIMATION &&
    projectileId != null &&
    SOTE_BALL_PROJECTILE_META[projectileId]
  ) {
    return SOTE_BALL_PROJECTILE_META[projectileId];
  }
  if (
    (animationId === MOKHAIOTL_ORB_ANIMATION ||
      animationId === MOKHAIOTL_BALL_ANIMATION) &&
    projectileId != null &&
    MOKHAIOTL_STYLE_PROJECTILE_META[projectileId]
  ) {
    return MOKHAIOTL_STYLE_PROJECTILE_META[projectileId];
  }
  const known = NPC_ATTACK_ANIMATION_META[animationId];
  if (known) {
    return known;
  }
  return {
    name: `Animation ${animationId}`,
    imageUrl: UNKNOWN_FALLBACK_IMAGE,
  };
}

export function resolveNpcAttackImageUrl(
  animationId: number,
  npcId: number,
  projectileId?: number,
  attackSpecial?: NpcAttackSpecialName,
): string {
  if (attackSpecial) {
    return (
      NPC_ATTACK_SPECIAL_META[attackSpecial]?.imageUrl ?? getNpcImageUrl(npcId)
    );
  }
  if (usesNpcMoidAttackIcon(npcId)) {
    return getNpcImageUrl(npcId);
  }
  const meta = getNpcAttackAnimationMeta(animationId, projectileId);
  return meta.imageUrl ?? getNpcImageUrl(npcId);
}

export function getNpcAttackAnimationName(
  animationId: number,
  npcId?: number,
  projectileId?: number,
  attackSpecial?: NpcAttackSpecialName,
): string {
  if (attackSpecial) {
    return NPC_ATTACK_SPECIAL_META[attackSpecial]?.name ?? attackSpecial;
  }
  if (npcId != null && usesNpcMoidAttackIcon(npcId)) {
    return "Auto attack";
  }
  return getNpcAttackAnimationMeta(animationId, projectileId).name;
}

/**
 * Events-table label for an attack animation. NPC attacks use the same pretty
 * names as tick-chart tooltips; animation ids are included when present.
 */
export function formatAttackAnimationEventDetail(log: {
  animationId: number;
  projectileId?: number;
  attackSpecial?: NpcAttackSpecialName;
  source?: { id?: number; isPlayer?: boolean };
}): string {
  const source = log.source;
  const isNpc = source?.id != null && source.isPlayer === false;
  if (!isNpc) {
    return String(log.animationId);
  }

  const pretty = getNpcAttackAnimationName(
    log.animationId,
    source.id,
    log.projectileId,
    log.attackSpecial,
  );

  if (log.attackSpecial || !log.animationId) {
    return pretty;
  }

  return `${pretty} (${log.animationId})`;
}
