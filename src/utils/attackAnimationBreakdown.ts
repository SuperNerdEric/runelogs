import { Actor } from "../models/Actor";
import { Fight } from "../models/Fight";
import {
  AttackAnimationLog,
  BoostedLevelsLog,
  LogTypes,
} from "../models/LogLine";
import { Levels } from "../models/Levels";
import { weaponMap } from "../models/WeaponMap";
import { itemIdMap } from "../lib/itemIdMap";
import { isSpecialAttack } from "./specialAttackAnimations";

export interface AttackAnimationEvent {
  source: Actor;
  playerName: string;
  animationId: number;
  fightTimeMs: number;
  weaponItemId: number;
  weaponName: string;
  target: Actor;
  targetName: string;
  boostedLevels?: Levels;
  isSpecialAttack: boolean;
}

export interface WeaponAttackCount {
  itemId: number;
  name: string;
  count: number;
  percent: number;
  events: AttackAnimationEvent[];
}

export interface PlayerAttackBreakdown {
  playerName: string;
  weapons: WeaponAttackCount[];
  totalAttacks: number;
  events: AttackAnimationEvent[];
}

export function getWeaponFromEquipment(playerEquipment: string[]): {
  itemId: number;
  name: string;
} | null {
  for (const itemIdStr of playerEquipment) {
    const itemId = parseInt(itemIdStr, 10);
    if (itemId <= 0) {
      continue;
    }

    const weapon = weaponMap[itemId];
    if (weapon) {
      return { itemId, name: weapon.name };
    }
  }

  return null;
}

export function resolveWeaponFromEquipment(
  equipment: string[] | undefined,
): { itemId: number; name: string } | null {
  if (!equipment) {
    return null;
  }

  const weapon = getWeaponFromEquipment(equipment);
  if (weapon) {
    return {
      itemId: weapon.itemId,
      name: weapon.name || itemIdMap[weapon.itemId] || `Item ${weapon.itemId}`,
    };
  }

  const weaponSlotId = parseInt(equipment[3] ?? "", 10);
  if (!isNaN(weaponSlotId) && weaponSlotId > 0) {
    return {
      itemId: weaponSlotId,
      name: itemIdMap[weaponSlotId] || `Item ${weaponSlotId}`,
    };
  }

  return null;
}

export function getAttackAnimationBreakdown(
  fight: Fight,
): PlayerAttackBreakdown[] {
  const weaponByPlayer = new Map<string, { itemId: number; name: string }>();
  const countsByPlayer = new Map<string, Map<number, WeaponAttackCount>>();
  const eventsByPlayer = new Map<string, AttackAnimationEvent[]>();
  const lastKnownBoostedLevels: Record<string, Levels | undefined> = {};
  const boostedLevelsAtTick: Record<number, Record<string, Levels>> = {};
  const pendingEvents: Array<{
    event: AttackAnimationEvent;
    tick?: number;
    playerName: string;
  }> = [];

  for (const log of fight.data) {
    if (!("source" in log) || !log.source?.name) {
      continue;
    }

    const playerName = log.source.name;
    if (!fight.players.includes(playerName)) {
      continue;
    }

    if (log.type === LogTypes.PLAYER_EQUIPMENT && log.playerEquipment) {
      const weapon = getWeaponFromEquipment(log.playerEquipment);
      if (weapon) {
        weaponByPlayer.set(playerName, weapon);
      }
      continue;
    }

    if (log.type === LogTypes.BOOSTED_LEVELS) {
      const boostedLevels = (log as BoostedLevelsLog).boostedLevels;
      lastKnownBoostedLevels[playerName] = boostedLevels;
      if (typeof log.tick === "number") {
        if (!boostedLevelsAtTick[log.tick]) {
          boostedLevelsAtTick[log.tick] = {};
        }
        boostedLevelsAtTick[log.tick][playerName] = boostedLevels;
      }
      continue;
    }

    if (log.type !== LogTypes.PLAYER_ATTACK_ANIMATION) {
      continue;
    }

    const attackLog = log as AttackAnimationLog;
    const weapon = weaponByPlayer.get(playerName);
    if (!weapon || log.fightTimeMs == null) {
      continue;
    }

    const target = attackLog.target ?? { name: "Unknown target" };

    const event: AttackAnimationEvent = {
      source: log.source ?? { name: playerName },
      playerName,
      animationId: attackLog.animationId,
      fightTimeMs: log.fightTimeMs,
      weaponItemId: weapon.itemId,
      weaponName:
        weapon.name || itemIdMap[weapon.itemId] || `Item ${weapon.itemId}`,
      target,
      targetName: target.name,
      boostedLevels: lastKnownBoostedLevels[playerName]
        ? { ...lastKnownBoostedLevels[playerName]! }
        : undefined,
      isSpecialAttack: isSpecialAttack(weapon.itemId, attackLog.animationId),
    };

    pendingEvents.push({
      event,
      tick: log.tick,
      playerName,
    });

    if (!eventsByPlayer.has(playerName)) {
      eventsByPlayer.set(playerName, []);
    }
    eventsByPlayer.get(playerName)!.push(event);

    if (!countsByPlayer.has(playerName)) {
      countsByPlayer.set(playerName, new Map());
    }

    const playerCounts = countsByPlayer.get(playerName)!;
    const existing = playerCounts.get(weapon.itemId);

    if (existing) {
      existing.count += 1;
      existing.events.push(event);
    } else {
      playerCounts.set(weapon.itemId, {
        itemId: weapon.itemId,
        name: event.weaponName,
        count: 1,
        percent: 0,
        events: [event],
      });
    }
  }

  for (const { event, tick, playerName } of pendingEvents) {
    if (tick == null) {
      continue;
    }

    const tickLevels = boostedLevelsAtTick[tick]?.[playerName];
    if (tickLevels) {
      event.boostedLevels = { ...tickLevels };
    }
  }

  return [...countsByPlayer.entries()]
    .map(([playerName, weaponCounts]) => {
      const weapons = [...weaponCounts.values()]
        .sort((a, b) => b.count - a.count)
        .map((weapon) => ({
          ...weapon,
          percent: 0,
        }));

      const totalAttacks = weapons.reduce(
        (sum, weapon) => sum + weapon.count,
        0,
      );

      for (const weapon of weapons) {
        weapon.percent =
          totalAttacks > 0
            ? Number(((weapon.count / totalAttacks) * 100).toFixed(1))
            : 0;
      }

      const events = (eventsByPlayer.get(playerName) ?? []).sort(
        (a, b) => a.fightTimeMs - b.fightTimeMs,
      );

      return {
        playerName,
        weapons,
        totalAttacks,
        events,
      };
    })
    .sort((a, b) => b.totalAttacks - a.totalAttacks);
}

export function hasAttackAnimationBreakdown(fight: Fight): boolean {
  return getAttackAnimationBreakdown(fight).length > 0;
}
