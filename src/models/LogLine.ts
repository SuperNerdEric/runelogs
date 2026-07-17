import { Actor } from "./Actor";
import { Levels } from "./Levels";
import { Fight, FightMetaData } from "./Fight";
import { FightGroup, FightGroupMetaData } from "./FightGroup";
import { GamePosition } from "../components/replay/GameState";

export enum LogTypes {
  LOG_VERSION = "Log Version",
  LOGGED_IN_PLAYER = "Logged In Player",
  PLAYER_REGION = "Player Region",
  BASE_LEVELS = "Base Levels",
  BOOSTED_LEVELS = "Boosted Levels",
  PRAYER = "Prayers",
  OVERHEAD = "Overhead Prayer",
  PLAYER_EQUIPMENT = "Player Equipment",
  DEATH = "Death",
  TARGET_CHANGE = "Target Change",
  DAMAGE = "Damage",
  HEAL = "Heal",
  PLAYER_ATTACK_ANIMATION = "Attack Animation",
  PLAYER_SPELL = "Player Spell",
  VENGEANCE_OTHER_CAST = "Vengeance Other Cast",
  POSITION = "Position",
  NPC_DESPAWNED = "NPC Despawned",
  GRAPHICS_OBJECT_SPAWNED = "Graphics Object Spawned",
  GRAPHICS_OBJECT_DESPAWNED = "Graphics Object Despawned",
  GAME_OBJECT_SPAWNED = "Game Object Spawned",
  GAME_OBJECT_DESPAWNED = "Game Object Despawned",
  GROUND_OBJECT_SPAWNED = "Ground Object Spawned",
  GROUND_OBJECT_DESPAWNED = "Ground Object Despawned",
  WAVE_START = "Wave Start",
  WAVE_END = "Wave End",
  WIPE = "Wipe",
  NPC_CHANGED = "NPC Changed",
  PATH_START = "ToA Path Start",
  PATH_COMPLETE = "ToA Path Complete",
  RAID_COMPLETE = "Raids Completion",
  DURATION = "Duration",
  FIGHT_START = "Fight Start",
  TOB_SCALE = "ToB Scale",
  TOB_BOSS_HP = "ToB Boss HP",
}

export interface BaseLog {
  date: string;
  time: string;
  timezone: string;
  tick?: number;
  fightTimeMs?: number;
}

export interface LogVersionLog extends BaseLog {
  type: LogTypes.LOG_VERSION;
  logVersion: string;
}

export interface LoggedInPlayerLog extends BaseLog {
  type: LogTypes.LOGGED_IN_PLAYER;
  loggedInPlayer: string;
}

export interface PlayerRegionLog extends BaseLog {
  type: LogTypes.PLAYER_REGION;
  playerRegion: number;
}

export interface BaseLevelsLog extends BaseLog {
  type: LogTypes.BASE_LEVELS;
  source: Actor;
  baseLevels: Levels;
}

export interface BoostedLevelsLog extends BaseLog {
  type: LogTypes.BOOSTED_LEVELS;
  source: Actor;
  boostedLevels: Levels;
}

export interface PrayerLog extends BaseLog {
  type: LogTypes.PRAYER;
  source: Actor;
  prayers: string[];
}

export interface OverheadLog extends BaseLog {
  type: LogTypes.OVERHEAD;
  source: Actor;
  overhead: string;
}

export interface PlayerEquipmentLog extends BaseLog {
  type: LogTypes.PLAYER_EQUIPMENT;
  source: Actor;
  playerEquipment: string[];
}

export interface DeathLog extends BaseLog {
  type: LogTypes.DEATH;
  target: Actor;
}

export interface TargetChangeLog extends BaseLog {
  type: LogTypes.TARGET_CHANGE;
  source: Actor;
  target: Actor;
}

export interface DamageLog extends BaseLog {
  type: LogTypes.DAMAGE;
  source: Actor;
  target: Actor;
  hitsplatName: string;
  damageAmount: number;
  /** Target's health bar ratio as RuneLite exposes it (log version >= 1.7.0). */
  targetHealthRatio?: number;
  /** Target's health bar scale as RuneLite exposes it (log version >= 1.7.0). */
  targetHealthScale?: number;
}

export interface HealLog extends BaseLog {
  type: LogTypes.HEAL;
  source: Actor;
  target: Actor;
  hitsplatName: string;
  healAmount: number;
  /** Target's health bar ratio as RuneLite exposes it (log version >= 1.7.0). */
  targetHealthRatio?: number;
  /** Target's health bar scale as RuneLite exposes it (log version >= 1.7.0). */
  targetHealthScale?: number;
}

export interface AttackAnimationLog extends BaseLog {
  type: LogTypes.PLAYER_ATTACK_ANIMATION;
  animationId: number;
  /** Optional projectile id (e.g. Verzik P2 cabbage/zap/purple/mage). */
  projectileId?: number;
  /** Timed / helper-derived NPC special (e.g. Verzik P3 webs, Bloat stomp). */
  attackSpecial?: NpcAttackSpecialName;
  /**
   * Optional icon URL override for tick-chart cells (dev comparison previews).
   * When set, skips normal animation/special image resolution.
   */
  attackImageUrl?: string;
  source?: Actor;
  target: Actor;
}

export type NpcAttackSpecialName =
  | "WEBS"
  | "YELLOWS"
  | "BALL"
  | "AUTO"
  | "MELEE"
  | "RANGE"
  | "MAGE"
  | "DEATH_BALL"
  | "SPIT"
  | "TURN"
  | "SCREECH"
  | "MANTICORE_MAGE"
  | "MANTICORE_RANGE"
  | "MANTICORE_MELEE"
  | "SLAM"
  | "SHOCKWAVE";

export type PlayerSpellName =
  | "VENGEANCE"
  | "VENGEANCE_OTHER"
  | "SPELLBOOK_SWAP"
  | "HEAL_OTHER"
  | "DEATH_CHARGE"
  | "MARK_OF_DARKNESS"
  | "WARD_OF_ARCEUUS"
  | "LESSER_CORRUPTION"
  | "GREATER_CORRUPTION"
  | "DARK_LURE"
  | "THRALL_GHOST"
  | "THRALL_SKELETON"
  | "THRALL_ZOMBIE";

export interface PlayerSpellLog extends BaseLog {
  type: LogTypes.PLAYER_SPELL;
  source: Actor;
  spell: PlayerSpellName;
}

export interface VengeanceOtherCastLog extends BaseLog {
  type: LogTypes.VENGEANCE_OTHER_CAST;
  source: Actor;
  target: Actor;
}

export interface PositionLog extends BaseLog {
  type: LogTypes.POSITION;
  source: Actor;
  position: GamePosition;
}

export interface NPCDespawned extends BaseLog {
  type: LogTypes.NPC_DESPAWNED;
  source: Actor;
}

export interface GraphicsObjectSpawned extends BaseLog {
  type: LogTypes.GRAPHICS_OBJECT_SPAWNED;
  id: number;
  position: GamePosition;
  /** Absolute client game cycle when animation became visible (1.6.2+). */
  startCycle?: number;
}

export interface GraphicsObjectDespawned extends BaseLog {
  type: LogTypes.GRAPHICS_OBJECT_DESPAWNED;
  id: number;
  position: GamePosition;
  /** Absolute client game cycle when animation finished (1.6.2+). */
  endCycle?: number;
}

export interface GameObjectSpawned extends BaseLog {
  type: LogTypes.GAME_OBJECT_SPAWNED;
  id: number;
  position: GamePosition;
}

export interface GameObjectDespawned extends BaseLog {
  type: LogTypes.GAME_OBJECT_DESPAWNED;
  id: number;
  position: GamePosition;
}

export interface GroundObjectSpawned extends BaseLog {
  type: LogTypes.GROUND_OBJECT_SPAWNED;
  id: number;
  position: GamePosition;
}

export interface GroundObjectDespawned extends BaseLog {
  type: LogTypes.GROUND_OBJECT_DESPAWNED;
  id: number;
  position: GamePosition;
}

export interface WaveStartLog extends BaseLog {
  type: LogTypes.WAVE_START;
  waveNumber: number;
}

export interface WaveEndLog extends BaseLog {
  type: LogTypes.WAVE_END;
}

export interface WipeLog extends BaseLog {
  type: LogTypes.WIPE;
  raidName: string;
}

export interface NpcChangedLog extends BaseLog {
  type: LogTypes.NPC_CHANGED;
  source: Actor;
  oldNpc: Actor;
  newNpc: Actor;
}

export interface ToAPathStartLog extends BaseLog {
  type: LogTypes.PATH_START;
  pathName: string;
}

export interface ToAPathCompleteLog extends BaseLog {
  type: LogTypes.PATH_COMPLETE;
  pathName: string;
  duration: string;
  total: string;
}

export interface RaidCompleteLog extends BaseLog {
  type: LogTypes.RAID_COMPLETE;
  raidName: string;
  duration: string;
}

export interface DurationLog extends BaseLog {
  type: LogTypes.DURATION;
  duration: string;
}

/** TobHelper room fight-start marker. */
export interface FightStartLog extends BaseLog {
  type: LogTypes.FIGHT_START;
  source: Actor;
}

/** ToB raid scale (party size 1-5), logged once per raid. */
export interface TobScaleLog extends BaseLog {
  type: LogTypes.TOB_SCALE;
  scale: number;
}

/**
 * ToB active boss health, logged when the wave-progress varbit changes.
 * `value` is 0-1000 (permille of the boss's health remaining).
 */
export interface TobBossHpLog extends BaseLog {
  type: LogTypes.TOB_BOSS_HP;
  value: number;
}

export type LogLine =
  | LogVersionLog
  | LoggedInPlayerLog
  | PlayerRegionLog
  | BaseLevelsLog
  | BoostedLevelsLog
  | PrayerLog
  | OverheadLog
  | PlayerEquipmentLog
  | DeathLog
  | TargetChangeLog
  | DamageLog
  | HealLog
  | AttackAnimationLog
  | PlayerSpellLog
  | VengeanceOtherCastLog
  | PositionLog
  | NPCDespawned
  | GraphicsObjectSpawned
  | GraphicsObjectDespawned
  | GameObjectSpawned
  | GameObjectDespawned
  | GroundObjectSpawned
  | GroundObjectDespawned
  | WaveStartLog
  | WaveEndLog
  | WipeLog
  | NpcChangedLog
  | ToAPathStartLog
  | ToAPathCompleteLog
  | RaidCompleteLog
  | DurationLog
  | FightStartLog
  | TobScaleLog
  | TobBossHpLog;

export function filterByType<T extends LogLine["type"]>(
  logs: LogLine[],
  type: T,
): Extract<LogLine, { type: T }>[] {
  return logs.filter((log) => log.type === type) as Extract<
    LogLine,
    { type: T }
  >[];
}

export type Encounter = Fight | FightGroup;
export type EncounterMetaData = FightMetaData | FightGroupMetaData;
