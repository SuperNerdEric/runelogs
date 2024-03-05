import {BoostedLevels} from "./BoostedLevels";

export enum LogTypes {
    LOG_VERSION = 'Log Version',
    LOGGED_IN_PLAYER = 'Logged In Player',
    BOOSTED_LEVELS = 'Boosted Levels',
    PLAYER_EQUIPMENT = 'Player Equipment',
    DEATH = 'Death',
    TARGET_CHANGE = 'Target Change',
    DAMAGE = 'Damage',
    PLAYER_ATTACK_ANIMATION = 'Attack Animation',
    BLOWPIPE_ANIMATION = 'Blowpipe Animation',
    STOPPED_BLOWPIPING = 'Stopped blowpiping'
}

export interface BaseLog {
    date: string;
    time: string;
    timezone: string;
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

export interface BoostedLevelsLog extends BaseLog {
    type: LogTypes.BOOSTED_LEVELS;
    boostedLevels: BoostedLevels;
}

export interface PlayerEquipmentLog extends BaseLog {
    type: LogTypes.PLAYER_EQUIPMENT;
    playerEquipment: string[];
}

export interface DeathLog extends BaseLog {
    type: LogTypes.DEATH;
    target: string;
}

export interface TargetChangeLog extends BaseLog {
    type: LogTypes.TARGET_CHANGE;
    source: string;
    target: string;
}

export interface DamageLog extends BaseLog {
    type: LogTypes.DAMAGE;
    target: string;
    hitsplatName: string;
    damageAmount: number;
}

export interface AttackAnimationLog extends BaseLog {
    type: LogTypes.PLAYER_ATTACK_ANIMATION;
    animationId: number;
    target: string;
}

export interface BlowpipeAnimationLog extends BaseLog {
    type: LogTypes.BLOWPIPE_ANIMATION;
    animationId: number;
    target: string;
}

export interface StoppedBlowpiping extends BaseLog {
    type: LogTypes.STOPPED_BLOWPIPING;
}

export type LogLine =
    LogVersionLog
    | LoggedInPlayerLog
    | BoostedLevelsLog
    | PlayerEquipmentLog
    | DeathLog
    | TargetChangeLog
    | DamageLog
    | AttackAnimationLog
    | BlowpipeAnimationLog
    | StoppedBlowpiping;

export function filterByType<T extends LogLine['type']>(logs: LogLine[], type: T): Extract<LogLine, { type: T }>[] {
    return logs.filter(log => log.type === type) as Extract<LogLine, { type: T }>[];
}

