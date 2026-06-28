import {Fight} from '../../models/Fight';
import {
    BaseLevelsLog,
    BoostedLevelsLog,
    GameObjectDespawned,
    GameObjectSpawned,
    GraphicsObjectDespawned,
    GraphicsObjectSpawned, GroundObjectDespawned, GroundObjectSpawned,
    LogTypes, NpcChangedLog,
    NPCDespawned,
    OverheadLog,
    PlayerEquipmentLog,
    PositionLog,
    PrayerLog
} from '../../models/LogLine';
import {Levels} from "../../models/Levels";
import {getAbsoluteTick} from '../../lib/replayTiming';

export interface GamePosition {
    x: number;
    y: number;
    plane: number;
}

export interface PlayerState {
    baseLevels?: Levels;
    boostedLevels?: Levels;
    position?: GamePosition;
    prayers?: string[];
    overhead?: string;
    equipment?: string[];
}

export interface NPCState {
    position?: GamePosition;
}

export interface GraphicsObjectState {
    id: number;
    position: GamePosition;
    spawnTick: number;
    /** Absolute client game cycle when animation became visible (1.6.2+). */
    startCycle?: number;
    /** Absolute client game cycle when animation finished (1.6.2+). */
    endCycle?: number;
    /** Game tick of the despawn log; object stays in state through this tick. */
    despawnTick?: number;
}

export interface GameObjectState {
    id: number;
    position: GamePosition;
}

export interface GroundObjectState {
    id: number;
    position: GamePosition;
}

export interface GameState {
    tick: number;
    players: { [playerName: string]: PlayerState };
    npcs: { [npcKey: string]: NPCState };
    graphicsObjects: { [key: string]: GraphicsObjectState };
    gameObjects: { [key: string]: GameObjectState };
    groundObjects: { [key: string]: GameObjectState };
}

function clonePlayerMap(players: GameState['players']): GameState['players'] {
    return JSON.parse(JSON.stringify(players)) as GameState['players'];
}

function cloneNpcMap(npcs: GameState['npcs']): GameState['npcs'] {
    return JSON.parse(JSON.stringify(npcs)) as GameState['npcs'];
}

function cloneObjectMap<T extends GameObjectState>(objects: { [key: string]: T }): { [key: string]: T } {
    return JSON.parse(JSON.stringify(objects)) as { [key: string]: T };
}

/** Graphics entries are immutable after creation, so tick snapshots can share object refs. */
function snapshotGraphicsObjects(
    graphicsObjects: GameState['graphicsObjects'],
): GameState['graphicsObjects'] {
    return {...graphicsObjects};
}

function snapshotGameState(currentState: GameState, tick: number): GameState {
    return {
        tick,
        players: clonePlayerMap(currentState.players),
        npcs: cloneNpcMap(currentState.npcs),
        graphicsObjects: snapshotGraphicsObjects(currentState.graphicsObjects),
        gameObjects: cloneObjectMap(currentState.gameObjects),
        groundObjects: cloneObjectMap(currentState.groundObjects),
    };
}

export function createGameStates(fight: Fight): GameState[] {
    // Collect all players who appear AFTER the first tick
    // This is kind of hacky, but it's because the LogSplitter brought all the state logs forward into the fight, so that we know what state everyone is in when we started the fight
    // However, there could be players from previous fights who were brought forward even though they are no longer in the party/fight
    // https://github.com/SuperNerdEric/runelogs/issues/9
    const playersWithActivity = new Set<string>();
    const firstTick = fight.data[0].tick || 0;
    for (const log of fight.data) {
        if ((log.tick || 0) > firstTick) {
            if ('source' in log && !log.source?.id) {
                playersWithActivity.add(log.source!.name);
            }
        }
    }

    const gameStates: GameState[] = [];
    const currentState: GameState = {
        tick: 0,
        players: {},
        npcs: {},
        graphicsObjects: {},
        gameObjects: {},
        groundObjects: {},
    };

    let currentTick: number | undefined = undefined;

    for (const log of fight.data) {
        const tick = log.tick || 0;

        if (tick !== currentTick) {
            if (currentTick !== undefined) {
                gameStates.push(snapshotGameState(currentState, currentTick));
            }

            for (const [key, objectState] of Object.entries(currentState.graphicsObjects)) {
                if (objectState.despawnTick != null && objectState.despawnTick < tick) {
                    delete currentState.graphicsObjects[key];
                }
            }

            currentTick = tick;
        }

        // Update the current state based on the log type
        switch (log.type) {
            case LogTypes.POSITION: {
                const positionLog = log as PositionLog;
                if (!positionLog.source.id) {
                    // Update player position
                    let playerState = currentState.players[positionLog.source.name];
                    if (!playerState) {
                        playerState = {};
                        currentState.players[positionLog.source.name] = playerState;
                    }
                    playerState.position = positionLog.position;
                } else {
                    // Update NPC position
                    const actorName = `${positionLog.source.name}|${positionLog.source.id}|${positionLog.source.index}`;
                    let npcState = currentState.npcs[actorName];
                    if (!npcState) {
                        npcState = {};
                        currentState.npcs[actorName] = npcState;
                    }
                    npcState.position = positionLog.position;
                }
                break;
            }

            case LogTypes.BASE_LEVELS: {
                const baseLevelsLog = log as BaseLevelsLog;
                const actorName = baseLevelsLog.source.name;

                let playerState = currentState.players[actorName];
                if (!playerState) {
                    playerState = {};
                    currentState.players[actorName] = playerState;
                }
                playerState.baseLevels = baseLevelsLog.baseLevels;
                break;
            }

            case LogTypes.BOOSTED_LEVELS: {
                const boostedLevelsLog = log as BoostedLevelsLog;
                const actorName = boostedLevelsLog.source.name;

                let playerState = currentState.players[actorName];
                if (!playerState) {
                    playerState = {};
                    currentState.players[actorName] = playerState;
                }
                playerState.boostedLevels = boostedLevelsLog.boostedLevels;
                break;
            }

            case LogTypes.PRAYER: {
                const prayerLog = log as PrayerLog;
                const actorName = prayerLog.source.name;

                let playerState = currentState.players[actorName];
                if (!playerState) {
                    playerState = {};
                    currentState.players[actorName] = playerState;
                }
                playerState.prayers = prayerLog.prayers;
                break;
            }

            case LogTypes.OVERHEAD: {
                const overheadLog = log as OverheadLog;
                const actorName = overheadLog.source.name;

                let playerState = currentState.players[actorName];
                if (!playerState) {
                    playerState = {};
                    currentState.players[actorName] = playerState;
                }
                playerState.overhead = overheadLog.overhead;
                break;
            }

            case LogTypes.PLAYER_EQUIPMENT: {
                const equipmentLog = log as PlayerEquipmentLog;
                const actorName = equipmentLog.source.name;

                let playerState = currentState.players[actorName];
                if (!playerState) {
                    playerState = {};
                    currentState.players[actorName] = playerState;
                }
                playerState.equipment = equipmentLog.playerEquipment;
                break;
            }

            case LogTypes.NPC_DESPAWNED: {
                const npcDespawnLog = log as NPCDespawned;
                const actorName = `${npcDespawnLog.source.name}|${npcDespawnLog.source.id}|${npcDespawnLog.source.index}`;
                delete currentState.npcs[actorName];
                break;
            }

            case LogTypes.NPC_CHANGED: {
                const npcChangedLog = log as NpcChangedLog;
                const actorName = `${npcChangedLog.oldNpc.name}|${npcChangedLog.oldNpc.id}|${npcChangedLog.oldNpc.index}`;
                delete currentState.npcs[actorName];
                break;
            }

            case LogTypes.GRAPHICS_OBJECT_SPAWNED: {
                const graphicsObjectSpawnedLog = log as GraphicsObjectSpawned;
                const objectKey = `${graphicsObjectSpawnedLog.id}-${graphicsObjectSpawnedLog.position.x}-${graphicsObjectSpawnedLog.position.y}-${graphicsObjectSpawnedLog.position.plane}`;
                const objectState: GraphicsObjectState = {
                    id: graphicsObjectSpawnedLog.id,
                    position: graphicsObjectSpawnedLog.position,
                    spawnTick: tick,
                };
                if (graphicsObjectSpawnedLog.startCycle != null) {
                    objectState.startCycle = graphicsObjectSpawnedLog.startCycle;
                }
                currentState.graphicsObjects[objectKey] = objectState;
                break;
            }

            case LogTypes.GRAPHICS_OBJECT_DESPAWNED: {
                const graphicsObjectDespawnedLog = log as GraphicsObjectDespawned;
                const objectKey = `${graphicsObjectDespawnedLog.id}-${graphicsObjectDespawnedLog.position.x}-${graphicsObjectDespawnedLog.position.y}-${graphicsObjectDespawnedLog.position.plane}`;
                const objectState = currentState.graphicsObjects[objectKey];
                if (objectState) {
                    currentState.graphicsObjects[objectKey] = {
                        ...objectState,
                        ...(graphicsObjectDespawnedLog.endCycle != null
                            ? {endCycle: graphicsObjectDespawnedLog.endCycle}
                            : {}),
                        despawnTick: tick,
                    };
                } else {
                    delete currentState.graphicsObjects[objectKey];
                }
                break;
            }

            case LogTypes.GAME_OBJECT_SPAWNED: {
                const gameObjectSpawnedLog = log as GameObjectSpawned;
                const objectKey = `${gameObjectSpawnedLog.id}-${gameObjectSpawnedLog.position.x}-${gameObjectSpawnedLog.position.y}-${gameObjectSpawnedLog.position.plane}`;
                const objectState = {
                    id: gameObjectSpawnedLog.id,
                    position: gameObjectSpawnedLog.position,
                };
                currentState.gameObjects[objectKey] = objectState;
                break;
            }

            case LogTypes.GAME_OBJECT_DESPAWNED: {
                const gameObjectDespawnedLog = log as GameObjectDespawned;
                const objectKey = `${gameObjectDespawnedLog.id}-${gameObjectDespawnedLog.position.x}-${gameObjectDespawnedLog.position.y}-${gameObjectDespawnedLog.position.plane}`;
                delete currentState.gameObjects[objectKey];
                break;
            }

            case LogTypes.GROUND_OBJECT_SPAWNED: {
                const groundObjectSpawnedLog = log as GroundObjectSpawned;
                const objectKey = `${groundObjectSpawnedLog.id}-${groundObjectSpawnedLog.position.x}-${groundObjectSpawnedLog.position.y}-${groundObjectSpawnedLog.position.plane}`;
                const objectState = {
                    id: groundObjectSpawnedLog.id,
                    position: groundObjectSpawnedLog.position,
                };
                currentState.groundObjects[objectKey] = objectState;
                break;
            }

            case LogTypes.GROUND_OBJECT_DESPAWNED: {
                const groundObjectDespawnedLog = log as GroundObjectDespawned;
                const objectKey = `${groundObjectDespawnedLog.id}-${groundObjectDespawnedLog.position.x}-${groundObjectDespawnedLog.position.y}-${groundObjectDespawnedLog.position.plane}`;
                delete currentState.groundObjects[objectKey];
                break;
            }

            default:
                break;
        }
    }

    // Push the final state after processing all logs
    if (currentTick !== undefined) {
        gameStates.push(snapshotGameState(currentState, currentTick));
    }

    // Remove any player not in playersWithActivity from each GameState
    for (const gs of gameStates) {
        for (const playerName of Object.keys(gs.players)) {
            if (!playersWithActivity.has(playerName)) {
                delete gs.players[playerName];
            }
        }
    }

    return gameStates;
}

export function getTargetTick(currentTime: number, initialTick: number): number {
    return Math.floor(getAbsoluteTick(currentTime, initialTick));
}

export function getCurrentGameState(
    gameStates: GameState[],
    currentTime: number,
    initialTick: number,
): GameState | undefined {
    if (gameStates.length === 0) {
        return undefined;
    }

    const targetTick = getTargetTick(currentTime, initialTick);
    return getGameStateAtTick(gameStates, targetTick);
}

export function getGameStateAtTick(gameStates: GameState[], targetTick: number): GameState | undefined {
    if (gameStates.length === 0) {
        return undefined;
    }

    if (targetTick < gameStates[0].tick) {
        return gameStates[0];
    }

    const lastState = gameStates[gameStates.length - 1];
    if (targetTick >= lastState.tick) {
        return lastState;
    }

    let low = 0;
    let high = gameStates.length - 1;

    while (low <= high) {
        const mid = (low + high) >> 1;
        const midTick = gameStates[mid].tick;

        if (midTick === targetTick) {
            return gameStates[mid];
        }

        if (midTick < targetTick) {
            if (mid === gameStates.length - 1 || gameStates[mid + 1].tick > targetTick) {
                return gameStates[mid];
            }
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return gameStates[0];
}
