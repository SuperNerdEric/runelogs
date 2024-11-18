import {Fight} from '../../models/Fight';
import {
    BaseLevelsLog,
    BoostedLevelsLog,
    LogTypes,
    NPCDespawned,
    PlayerEquipmentLog,
    PositionLog,
    PrayerLog
} from '../../models/LogLine';
import {Levels} from "../../models/Levels";

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
    equipment?: string[];
}

export interface NPCState {
    position?: GamePosition;
}

export interface GameState {
    tick: number;
    players: { [playerName: string]: PlayerState };
    npcs: { [npcKey: string]: NPCState };
}

export function createGameStates(fight: Fight): GameState[] {
    const gameStates: GameState[] = [];
    const currentState: GameState = {
        tick: 0,
        players: {},
        npcs: {},
    };

    let currentTick: number | undefined = undefined;

    for (const log of fight.data) {
        const tick = log.tick || 0;

        if (tick !== currentTick) {
            if (currentTick !== undefined) {
                // After processing all logs for the previous tick,
                // clone the current state and push to gameStates
                const stateToPush: GameState = {
                    tick: currentTick,
                    players: JSON.parse(JSON.stringify(currentState.players)),
                    npcs: JSON.parse(JSON.stringify(currentState.npcs)),
                };
                gameStates.push(stateToPush);
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
                    const actorName = `${positionLog.source.name}-${positionLog.source.id}-${positionLog.source.index}`;
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
                const actorName = `${npcDespawnLog.source.name}-${npcDespawnLog.source.id}-${npcDespawnLog.source.index}`;
                delete currentState.npcs[actorName];
                break;
            }

            default:
                break;
        }
    }

    // Push the final state after processing all logs
    if (currentTick !== undefined) {
        const stateToPush: GameState = {
            tick: currentTick,
            players: JSON.parse(JSON.stringify(currentState.players)),
            npcs: JSON.parse(JSON.stringify(currentState.npcs)),
        };
        gameStates.push(stateToPush);
    }

    return gameStates;
}

export function getCurrentGameState(gameStates: GameState[], currentTime: number, initialTick: number): GameState | undefined {
    const targetTick = Math.floor(currentTime / 0.6) + initialTick;

    // Find the last gameState with tick <= targetTick
    let index = gameStates.findIndex((gs) => gs.tick > targetTick);

    let currentGameState: GameState | undefined = undefined;

    if (index === -1) {
        // All ticks are <= targetTick
        currentGameState = gameStates[gameStates.length - 1];
    } else if (index === 0) {
        // All ticks are > targetTick
        currentGameState = gameStates[0];
    } else {
        // gameStates[index - 1].tick <= targetTick < gameStates[index].tick
        currentGameState = gameStates[index - 1];
    }

    return currentGameState;
}
