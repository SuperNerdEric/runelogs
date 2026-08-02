import { Fight } from "../../models/Fight";
import { GearSetup, GearSetupItem } from "../../models/GearSetup";
import {
  LogTypes,
  PlayerEquipmentLog,
  PlayerInventoryLog,
  RunePouchLog,
  SpellbookLog,
} from "../../models/LogLine";

/**
 * Item ids for rune pouches. The rune pouch varbits are readable even when the
 * pouch is banked, so rune pouch contents are only surfaced when the player is
 * actually carrying a pouch in their inventory.
 */
const RUNE_POUCH_ITEM_IDS = new Set<number>([
  12791, // Rune pouch
  24416, // Rune pouch (l)
  27281, // Divine rune pouch
  27510, // Divine rune pouch (l)
]);

function inventoryHasRunePouch(inventory: GearSetupItem[]): boolean {
  return inventory.some((item) => RUNE_POUCH_ITEM_IDS.has(item.id));
}

/**
 * Derives gear setups from a fight's tick data, mirroring the backend logic.
 * Used as a fallback for fights parsed before gear setups were stored, and for
 * live encounters whose fight has not been finalized yet.
 *
 * A setup is only produced for players with all three of equipment, inventory,
 * and rune pouch logged (the logged-in player and party members). The logged-in
 * player is returned first.
 */
export function deriveGearSetupsFromFight(fight: Fight): GearSetup[] {
  if (!Array.isArray(fight.data)) {
    return [];
  }

  const equipmentByPlayer = new Map<string, number[]>();
  const inventoryByPlayer = new Map<string, GearSetupItem[]>();
  const runePouchByPlayer = new Map<string, GearSetupItem[]>();
  const spellbookByPlayer = new Map<string, number>();

  const isPlayer = (source: { name: string; isPlayer?: boolean }): boolean =>
    Boolean(source.name) && source.isPlayer !== false;

  for (const logLine of fight.data) {
    if (logLine.type === LogTypes.PLAYER_EQUIPMENT) {
      const log = logLine as PlayerEquipmentLog;
      if (isPlayer(log.source) && !equipmentByPlayer.has(log.source.name)) {
        equipmentByPlayer.set(
          log.source.name,
          log.playerEquipment.map((id) => Number(id)),
        );
      }
    } else if (logLine.type === LogTypes.PLAYER_INVENTORY) {
      const log = logLine as PlayerInventoryLog;
      if (isPlayer(log.source) && !inventoryByPlayer.has(log.source.name)) {
        inventoryByPlayer.set(
          log.source.name,
          log.inventory.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        );
      }
    } else if (logLine.type === LogTypes.RUNE_POUCH) {
      const log = logLine as RunePouchLog;
      if (isPlayer(log.source) && !runePouchByPlayer.has(log.source.name)) {
        runePouchByPlayer.set(
          log.source.name,
          log.runePouch.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        );
      }
    } else if (logLine.type === LogTypes.SPELLBOOK) {
      const log = logLine as SpellbookLog;
      if (isPlayer(log.source) && !spellbookByPlayer.has(log.source.name)) {
        spellbookByPlayer.set(log.source.name, log.spellbook);
      }
    }
  }

  const setups: GearSetup[] = [];
  for (const [player, equipment] of equipmentByPlayer) {
    const inventory = inventoryByPlayer.get(player);
    const runePouch = runePouchByPlayer.get(player);
    if (inventory === undefined || runePouch === undefined) {
      continue;
    }
    setups.push({
      player,
      equipment,
      inventory,
      runePouch: inventoryHasRunePouch(inventory) ? runePouch : [],
      spellbook: spellbookByPlayer.get(player),
    });
  }

  setups.sort((a, b) => {
    if (a.player === fight.loggedInPlayer) {
      return -1;
    }
    if (b.player === fight.loggedInPlayer) {
      return 1;
    }
    return a.player.localeCompare(b.player);
  });

  return setups;
}

/** Returns the fight's stored gear setups, falling back to deriving from data. */
export function resolveGearSetups(fight: Fight): GearSetup[] {
  if (fight.gearSetups && fight.gearSetups.length > 0) {
    return fight.gearSetups;
  }
  return deriveGearSetupsFromFight(fight);
}
