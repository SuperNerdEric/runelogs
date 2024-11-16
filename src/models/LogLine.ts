import { Actor } from "./Actor";
import {BoostedLevels} from "./BoostedLevels";
import { Fight, FightMetaData } from "./Fight";
import { Raid, RaidMetaData } from "./Raid";
import { Waves, WavesMetaData } from "./Waves";

export enum LogTypes {
    LOG_VERSION = 'Log Version',
    LOGGED_IN_PLAYER = 'Logged In Player',
    PLAYER_REGION = 'Player Region',
    BOOSTED_LEVELS = 'Boosted Levels',
    PLAYER_EQUIPMENT = 'Player Equipment',
    DEATH = 'Death',
    TARGET_CHANGE = 'Target Change',
    DAMAGE = 'Damage',
    HEAL = 'Heal',
    PLAYER_ATTACK_ANIMATION = 'Attack Animation',
    POSITION = 'Position',
    NPC_DESPAWNED = 'NPC_DESPAWNED',
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

export interface BoostedLevelsLog extends BaseLog {
    type: LogTypes.BOOSTED_LEVELS;
    boostedLevels: BoostedLevels;
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
    position: { x: number; y: number; plane: number };
}

export interface NPCDespawned extends BaseLog {
    type: LogTypes.NPC_DESPAWNED;
    source: Actor;
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
    | BoostedLevelsLog
    | PlayerEquipmentLog
    | DeathLog
    | TargetChangeLog
    | DamageLog
    | HealLog
    | AttackAnimationLog
    | PositionLog
    | NPCDespawned
    | WaveStartLog
    | WaveEndLog;

export function filterByType<T extends LogLine['type']>(logs: LogLine[], type: T): Extract<LogLine, { type: T }>[] {
    return logs.filter(log => log.type === type) as Extract<LogLine, { type: T }>[];
}


export type Encounter = Fight | Raid | Waves;
export type EncounterMetaData = FightMetaData | RaidMetaData | WavesMetaData;