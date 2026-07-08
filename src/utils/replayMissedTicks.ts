import { Fight } from "../models/Fight";
import { LogTypes } from "../models/LogLine";
import { weaponMap } from "../models/WeaponMap";

export type MissedTicksByTick = Record<number, Record<string, true>>;

function getWeaponSpeedFromEquipment(
  playerEquipment: string[],
): number | undefined {
  for (const itemId of playerEquipment) {
    const weapon = weaponMap[parseInt(itemId, 10)];
    if (weapon) {
      return weapon.speed;
    }
  }

  return undefined;
}

/**
 * Ticks where a player had weapon cooldown ready but did not attack.
 * Mirrors activity / expected-hit timing: first weapon equip can attack immediately,
 * each attack resets cooldown by the equipped weapon's speed.
 */
export function getReplayMissedTicks(
  fight: Fight,
  initialTick: number,
  maxTick: number,
): MissedTicksByTick {
  const attacksByTick = new Map<number, Set<string>>();
  const weaponSpeedByTick = new Map<number, Map<string, number>>();

  for (const log of fight.data) {
    if (!("source" in log) || log.source?.id || !log.source?.name) {
      continue;
    }

    const playerName = log.source.name;
    if (!fight.players.includes(playerName)) {
      continue;
    }

    const tick = log.tick;
    if (typeof tick !== "number") {
      continue;
    }

    if (log.type === LogTypes.PLAYER_EQUIPMENT && log.playerEquipment) {
      const weaponSpeed = getWeaponSpeedFromEquipment(log.playerEquipment);
      if (!weaponSpeed) {
        continue;
      }

      if (!weaponSpeedByTick.has(tick)) {
        weaponSpeedByTick.set(tick, new Map());
      }
      weaponSpeedByTick.get(tick)!.set(playerName, weaponSpeed);
    }

    if (log.type === LogTypes.PLAYER_ATTACK_ANIMATION) {
      if (!attacksByTick.has(tick)) {
        attacksByTick.set(tick, new Set());
      }
      attacksByTick.get(tick)!.add(playerName);
    }
  }

  const trackedPlayers = new Set<string>();
  for (const playersOnTick of weaponSpeedByTick.values()) {
    for (const playerName of playersOnTick.keys()) {
      trackedPlayers.add(playerName);
    }
  }

  const missed: MissedTicksByTick = {};

  for (const playerName of trackedPlayers) {
    let weaponSpeed = 0;
    let nextAvailableTick: number | null = null;
    let hasWeapon = false;

    for (let tick = initialTick; tick <= maxTick; tick++) {
      const equipSpeed = weaponSpeedByTick.get(tick)?.get(playerName);
      if (equipSpeed) {
        if (!hasWeapon) {
          hasWeapon = true;
          weaponSpeed = equipSpeed;
          nextAvailableTick = tick;
        } else {
          weaponSpeed = equipSpeed;
        }
      }

      const attacked = attacksByTick.get(tick)?.has(playerName) ?? false;

      if (
        hasWeapon &&
        nextAvailableTick !== null &&
        tick >= nextAvailableTick &&
        !attacked
      ) {
        if (!missed[tick]) {
          missed[tick] = {};
        }
        missed[tick][playerName] = true;
      }

      if (attacked && weaponSpeed > 0) {
        nextAvailableTick = tick + weaponSpeed;
      }
    }
  }

  return missed;
}
