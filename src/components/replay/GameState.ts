import { Fight } from "../../models/Fight";
import {
  BaseLevelsLog,
  BoostedLevelsLog,
  DamageLog,
  GameObjectDespawned,
  GameObjectSpawned,
  GraphicsObjectDespawned,
  GraphicsObjectSpawned,
  GroundObjectDespawned,
  GroundObjectSpawned,
  HealLog,
  LogTypes,
  NpcChangedLog,
  NPCDespawned,
  OverheadLog,
  PlayerEquipmentLog,
  PositionLog,
  PrayerLog,
  TobBossHpLog,
  TobScaleLog,
} from "../../models/LogLine";
import { Actor } from "../../models/Actor";
import { Levels } from "../../models/Levels";
import { getTargetTickFromTime } from "../../lib/replayTiming";

export interface GamePosition {
  x: number;
  y: number;
  plane: number;
}

/**
 * The target's health bar as RuneLite exposes it at the last hitsplat, plus the tick it was last
 * hit. `lastHitTick` drives the fade-after-hit behaviour of on-map health bars for non-bosses.
 */
export interface EntityHealth {
  healthRatio?: number;
  healthScale?: number;
  lastHitTick?: number;
}

export interface PlayerState extends EntityHealth {
  baseLevels?: Levels;
  boostedLevels?: Levels;
  position?: GamePosition;
  prayers?: string[];
  overhead?: string;
  equipment?: string[];
}

export interface NPCState extends EntityHealth {
  position?: GamePosition;
}

/** A single hitsplat applied to an actor on a given tick, for the replay damage overlay. */
export interface CombatHitsplat {
  /** Player name, or `name|id|index` for an NPC — matches the position map keys. */
  targetKey: string;
  isPlayer: boolean;
  hitsplatName: string;
  amount: number;
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
  /** Hitsplats applied on this exact tick (not held forward like positions). */
  hitsplats: CombatHitsplat[];
  /** ToB raid party size (1-5), held from the last `TOB_SCALE` log. */
  tobScale?: number;
  /** ToB active-boss wave-progress varbit (0-1000), held from the last `TOB_BOSS_HP` log. */
  tobBossHpValue?: number;
  /**
   * Whether this fight's logs carry health-bar data at all (log version >= 1.7.0 exposes
   * `targetHealthRatio`/`targetHealthScale`, or ToB varbit logs). Older logs still show
   * hitsplats but must not render health bars.
   */
  hasHealthData: boolean;
}

function clonePlayerMap(players: GameState["players"]): GameState["players"] {
  return JSON.parse(JSON.stringify(players)) as GameState["players"];
}

function cloneNpcMap(npcs: GameState["npcs"]): GameState["npcs"] {
  return JSON.parse(JSON.stringify(npcs)) as GameState["npcs"];
}

function cloneObjectMap<T extends GameObjectState>(objects: {
  [key: string]: T;
}): { [key: string]: T } {
  return JSON.parse(JSON.stringify(objects)) as { [key: string]: T };
}

/** Graphics entries are immutable after creation, so tick snapshots can share object refs. */
function snapshotGraphicsObjects(
  graphicsObjects: GameState["graphicsObjects"],
): GameState["graphicsObjects"] {
  return { ...graphicsObjects };
}

function snapshotGameState(currentState: GameState, tick: number): GameState {
  return {
    tick,
    players: clonePlayerMap(currentState.players),
    npcs: cloneNpcMap(currentState.npcs),
    graphicsObjects: snapshotGraphicsObjects(currentState.graphicsObjects),
    gameObjects: cloneObjectMap(currentState.gameObjects),
    groundObjects: cloneObjectMap(currentState.groundObjects),
    hitsplats: [...currentState.hitsplats],
    tobScale: currentState.tobScale,
    tobBossHpValue: currentState.tobBossHpValue,
    hasHealthData: currentState.hasHealthData,
  };
}

function resolveTargetKey(target: Actor): { key: string; isPlayer: boolean } {
  const isPlayer = !target.id;
  const key = isPlayer
    ? target.name
    : `${target.name}|${target.id}|${target.index}`;
  return { key, isPlayer };
}

/** Records a hitsplat against its target: updates the target's health bar and appends the splat. */
function applyHitsplat(
  currentState: GameState,
  target: Actor,
  hitsplatName: string,
  amount: number,
  healthRatio: number | undefined,
  healthScale: number | undefined,
  tick: number,
): void {
  const { key, isPlayer } = resolveTargetKey(target);

  // Only attach health-bar data to entities we already track (those that have appeared via
  // position/state logs). Damage/heal logs must not create new players or NPCs, otherwise
  // combat-only participants (e.g. nearby non-party players) would leak into the replay
  // selector and tick chart, and position-less entities can't render a bar anyway.
  const entity: EntityHealth | undefined = isPlayer
    ? currentState.players[key]
    : currentState.npcs[key];

  if (entity) {
    if (
      typeof healthRatio === "number" &&
      healthRatio >= 0 &&
      typeof healthScale === "number" &&
      healthScale > 0
    ) {
      entity.healthRatio = healthRatio;
      entity.healthScale = healthScale;
    }
    entity.lastHitTick = tick;
  }

  currentState.hitsplats.push({
    targetKey: key,
    isPlayer,
    hitsplatName,
    amount,
  });
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
      if ("source" in log && !log.source?.id) {
        playersWithActivity.add(log.source!.name);
      }
    }
  }

  // A log carries health-bar data only from version >= 1.7.0 (damage/heal logs expose
  // targetHealthRatio/Scale) or when ToB wave-progress varbit logs are present. Older logs
  // still show hitsplats but must not render any health bars.
  const hasHealthData = fight.data.some((log) => {
    if (log.type === LogTypes.DAMAGE || log.type === LogTypes.HEAL) {
      return (log as DamageLog | HealLog).targetHealthRatio !== undefined;
    }
    return log.type === LogTypes.TOB_BOSS_HP;
  });

  // The raid scale (party size) is only logged once per raid, so per-room fights usually miss it.
  // Fall back to the number of party members present so ToB boss hitpoints can still be resolved;
  // the authoritative TOB_SCALE log, when present, overrides this below.
  const partyPlayers = new Set<string>(playersWithActivity);
  if (partyPlayers.size === 0) {
    for (const log of fight.data) {
      if ("source" in log && !log.source?.id) {
        partyPlayers.add(log.source!.name);
      }
    }
  }
  const fallbackTobScale =
    partyPlayers.size > 0
      ? Math.max(1, Math.min(5, partyPlayers.size))
      : undefined;

  const gameStates: GameState[] = [];
  const currentState: GameState = {
    tick: 0,
    players: {},
    npcs: {},
    graphicsObjects: {},
    gameObjects: {},
    groundObjects: {},
    hitsplats: [],
    hasHealthData,
    tobScale: fallbackTobScale,
  };

  let currentTick: number | undefined = undefined;

  for (const log of fight.data) {
    const tick = log.tick || 0;

    if (tick !== currentTick) {
      if (currentTick !== undefined) {
        gameStates.push(snapshotGameState(currentState, currentTick));
      }

      for (const [key, objectState] of Object.entries(
        currentState.graphicsObjects,
      )) {
        if (objectState.despawnTick != null && objectState.despawnTick < tick) {
          delete currentState.graphicsObjects[key];
        }
      }

      // Hitsplats are instantaneous — reset them when a new tick begins.
      currentState.hitsplats = [];

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

      case LogTypes.DAMAGE: {
        const damageLog = log as DamageLog;
        applyHitsplat(
          currentState,
          damageLog.target,
          damageLog.hitsplatName,
          damageLog.damageAmount,
          damageLog.targetHealthRatio,
          damageLog.targetHealthScale,
          tick,
        );
        break;
      }

      case LogTypes.HEAL: {
        const healLog = log as HealLog;
        applyHitsplat(
          currentState,
          healLog.target,
          healLog.hitsplatName,
          healLog.healAmount,
          healLog.targetHealthRatio,
          healLog.targetHealthScale,
          tick,
        );
        break;
      }

      case LogTypes.TOB_SCALE: {
        currentState.tobScale = (log as TobScaleLog).scale;
        break;
      }

      case LogTypes.TOB_BOSS_HP: {
        currentState.tobBossHpValue = (log as TobBossHpLog).value;
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
              ? { endCycle: graphicsObjectDespawnedLog.endCycle }
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

export function getTargetTick(
  currentTime: number,
  initialTick: number,
): number {
  return getTargetTickFromTime(currentTime, initialTick);
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

export function getGameStateAtTick(
  gameStates: GameState[],
  targetTick: number,
): GameState | undefined {
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
      if (
        mid === gameStates.length - 1 ||
        gameStates[mid + 1].tick > targetTick
      ) {
        return gameStates[mid];
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return gameStates[0];
}
