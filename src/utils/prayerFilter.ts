import {LogLine, LogTypes} from "../models/LogLine";
import {ActorFilter} from "./actorFilter";

export interface PrayerFilter {
    id: number;
    name: string;
}

type PrayerSnapshot = { fightTimeMs: number; prayers: string[]; overhead?: string };

export const serializePrayerFilter = (filter: PrayerFilter): string => {
    return `${filter.id}|${filter.name}`;
};

export const deserializePrayerFilter = (value: string | null): PrayerFilter | null => {
    if (!value) {
        return null;
    }

    const pipeIndex = value.indexOf("|");
    if (pipeIndex === -1) {
        const id = Number(value);
        if (Number.isNaN(id)) {
            return null;
        }
        return {id, name: ""};
    }

    const id = Number(value.slice(0, pipeIndex));
    const name = value.slice(pipeIndex + 1);
    if (Number.isNaN(id)) {
        return null;
    }

    return {id, name};
};

export const buildPrayerTimelines = (logs: LogLine[]): Map<string, PrayerSnapshot[]> => {
    const timelines = new Map<string, PrayerSnapshot[]>();
    const currentState = new Map<string, { prayers: string[]; overhead?: string }>();

    for (const log of logs) {
        if (!log.source?.name || log.fightTimeMs === undefined) {
            continue;
        }

        if (log.type === LogTypes.PRAYER && log.prayers) {
            const state = currentState.get(log.source.name) ?? {prayers: []};
            state.prayers = log.prayers;
            currentState.set(log.source.name, state);

            const snapshots = timelines.get(log.source.name) ?? [];
            snapshots.push({
                fightTimeMs: log.fightTimeMs,
                prayers: [...log.prayers],
                overhead: state.overhead,
            });
            timelines.set(log.source.name, snapshots);
        } else if (log.type === LogTypes.OVERHEAD) {
            const state = currentState.get(log.source.name) ?? {prayers: []};
            state.overhead = log.overhead;
            currentState.set(log.source.name, state);

            const snapshots = timelines.get(log.source.name) ?? [];
            snapshots.push({
                fightTimeMs: log.fightTimeMs,
                prayers: [...state.prayers],
                overhead: log.overhead,
            });
            timelines.set(log.source.name, snapshots);
        }
    }

    for (const snapshots of timelines.values()) {
        snapshots.sort((a, b) => a.fightTimeMs - b.fightTimeMs);
    }

    return timelines;
};

const getPrayerStateAtTime = (
    timelines: Map<string, PrayerSnapshot[]>,
    playerName: string,
    timeMs: number
): PrayerSnapshot | null => {
    const snapshots = timelines.get(playerName);
    if (!snapshots?.length) {
        return null;
    }

    let result: PrayerSnapshot | null = null;
    for (const snapshot of snapshots) {
        if (snapshot.fightTimeMs <= timeMs) {
            result = snapshot;
        } else {
            break;
        }
    }

    return result;
};

export const playerHasPrayerAtTime = (
    timelines: Map<string, PrayerSnapshot[]>,
    playerName: string,
    timeMs: number,
    prayerId: number
): boolean => {
    const state = getPrayerStateAtTime(timelines, playerName, timeMs);
    if (!state) {
        return false;
    }

    if (state.prayers.some((prayerIdStr) => parseInt(prayerIdStr, 10) === prayerId)) {
        return true;
    }

    if (state.overhead && state.overhead !== '-1') {
        return parseInt(state.overhead, 10) === prayerId;
    }

    return false;
};

export const matchesPrayerFilter = (
    log: LogLine,
    timelines: Map<string, PrayerSnapshot[]>,
    prayerFilter: PrayerFilter | null,
    sourceFilter: ActorFilter | null,
    targetFilter: ActorFilter | null
): boolean => {
    if (!prayerFilter) {
        return true;
    }

    const timeMs = log.fightTimeMs;
    if (timeMs === undefined) {
        return true;
    }

    const playersToCheck = new Set<string>();

    if (sourceFilter) {
        playersToCheck.add(sourceFilter.name);
    }
    if (targetFilter) {
        playersToCheck.add(targetFilter.name);
    }
    if (!sourceFilter && !targetFilter) {
        if ("source" in log && log.source?.name) {
            playersToCheck.add(log.source.name);
        }
        if ("target" in log && log.target?.name) {
            playersToCheck.add(log.target.name);
        }
    }

    if (playersToCheck.size === 0) {
        for (const playerName of timelines.keys()) {
            if (playerHasPrayerAtTime(timelines, playerName, timeMs, prayerFilter.id)) {
                return true;
            }
        }
        return false;
    }

    return Array.from(playersToCheck).some((playerName) =>
        playerHasPrayerAtTime(timelines, playerName, timeMs, prayerFilter.id)
    );
};
