import {Actor} from "./Actor";
import {Levels} from "./Levels";
import {Fight, FightMetaData} from "./Fight";
import {Raid, RaidMetaData} from "./Raid";
import {Waves, WavesMetaData} from "./Waves";
import {GamePosition} from "../components/replay/GameState";

export enum LogTypes {
    LOG_VERSION = 'Log Version',
    LOGGED_IN_PLAYER = 'Logged In Player',
    PLAYER_REGION = 'Player Region',
    BASE_LEVELS = 'Base Levels',
    BOOSTED_LEVELS = 'Boosted Levels',
    PRAYER = 'Prayers',
    OVERHEAD = 'Overhead Prayer',
    PLAYER_EQUIPMENT = 'Player Equipment',
    DEATH = 'Death',
    TARGET_CHANGE = 'Target Change',
    DAMAGE = 'Damage',
    HEAL = 'Heal',
    PLAYER_ATTACK_ANIMATION = 'Attack Animation',
    POSITION = 'Position',
    NPC_DESPAWNED = 'NPC Despawned',
    GRAPHICS_OBJECT_SPAWNED = 'Graphics Object Spawned',
    GRAPHICS_OBJECT_DESPAWNED = 'Graphics Object Despawned',
    GAME_OBJECT_SPAWNED = 'Game Object Spawned',
    GAME_OBJECT_DESPAWNED = 'Game Object Despawned',
    GROUND_OBJECT_SPAWNED = 'Ground Object Spawned',
    GROUND_OBJECT_DESPAWNED = 'Ground Object Despawned',
    WAVE_START = 'Wave Start',
    WAVE_END = 'Wave End',
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
}

export interface HealLog extends BaseLog {
    type: LogTypes.HEAL;
    source: Actor;
    target: Actor;
    hitsplatName: string;
    healAmount: number;
}

export interface AttackAnimationLog extends BaseLog {
    type: LogTypes.PLAYER_ATTACK_ANIMATION;
    animationId: number;
    source?: Actor;
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
}

export interface GraphicsObjectDespawned extends BaseLog {
    type: LogTypes.GRAPHICS_OBJECT_DESPAWNED;
    id: number;
    position: GamePosition;
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

export type LogLine =
    LogVersionLog
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
    | PositionLog
    | NPCDespawned
    | GraphicsObjectSpawned
    | GraphicsObjectDespawned
    | GameObjectSpawned
    | GameObjectDespawned
    | GroundObjectSpawned
    | GroundObjectDespawned
    | WaveStartLog
    | WaveEndLog;

export function filterByType<T extends LogLine['type']>(logs: LogLine[], type: T): Extract<LogLine, { type: T }>[] {
    return logs.filter(log => log.type === type) as Extract<LogLine, { type: T }>[];
}


export type Encounter = Fight | Raid | Waves;
export type EncounterMetaData = FightMetaData | RaidMetaData | WavesMetaData;