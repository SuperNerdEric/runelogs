import { EquipmentSlotIndex, GearSetup } from "../../models/GearSetup";

/** Number of bank slots per row in the bank tag grid. */
export const BANK_ITEMS_PER_ROW = 8;

/**
 * Equipment placement map used by RuneLite's Bank Tags "Default" auto layout.
 * Each entry is a WORN equipment slot index (or -1 for a blank cell). The map
 * lays the 15 cells out three-per-row, mirroring the in-game equipment tab:
 *
 * ```
 *   .    HEAD   .
 *   CAPE AMULET AMMO
 *   WEAP BODY   SHIELD
 *   .    LEGS   .
 *   GLOV BOOTS  RING
 * ```
 */
const EQUIPMENT_FORMAT: number[] = [
  -1,
  EquipmentSlotIndex.HEAD,
  -1,
  EquipmentSlotIndex.CAPE,
  EquipmentSlotIndex.AMULET,
  EquipmentSlotIndex.AMMO,
  EquipmentSlotIndex.WEAPON,
  EquipmentSlotIndex.BODY,
  EquipmentSlotIndex.SHIELD,
  -1,
  EquipmentSlotIndex.LEGS,
  -1,
  EquipmentSlotIndex.GLOVES,
  EquipmentSlotIndex.BOOTS,
  EquipmentSlotIndex.RING,
];

/** First bank slot used for rune pouch runes in the Default layout. */
const RUNE_POUCH_START = 40;

function setItemAtPos(layout: number[], pos: number, itemId: number): void {
  if (pos < 0) {
    return;
  }
  while (layout.length <= pos) {
    layout.push(-1);
  }
  layout[pos] = itemId;
}

/**
 * Builds the dense bank tag layout array for a gear setup, faithfully
 * reproducing RuneLite's Bank Tags "Default" auto layout: equipment on the
 * left three columns, inventory on the right four columns, and the rune pouch
 * runes below. `layout[pos]` is the item id at bank slot `pos`, or -1 if empty.
 */
export function buildDefaultBankLayout(setup: GearSetup): number[] {
  const layout: number[] = [];

  // Equipment: three cells per row, advancing the row base by a full grid row.
  {
    let base = 0;
    for (let pos = 0; pos < EQUIPMENT_FORMAT.length; pos++) {
      if (pos > 0 && pos % 3 === 0) {
        base += BANK_ITEMS_PER_ROW;
      }
      const slot = EQUIPMENT_FORMAT[pos];
      if (slot === -1) {
        continue;
      }
      const itemId = setup.equipment[slot];
      if (itemId != null && itemId > 0) {
        setItemAtPos(layout, base + (pos % 3), itemId);
      }
    }
  }

  // Inventory: four cells per row starting in the right half of the grid.
  {
    let base = 4;
    for (let pos = 0; pos < setup.inventory.length; pos++) {
      if (pos > 0 && pos % 4 === 0) {
        base += BANK_ITEMS_PER_ROW;
      }
      const itemId = setup.inventory[pos]?.id;
      if (itemId != null && itemId > 0) {
        setItemAtPos(layout, base + (pos % 4), itemId);
      }
    }
  }

  // Rune pouch runes occupy consecutive slots starting at RUNE_POUCH_START.
  for (let idx = 0; idx < setup.runePouch.length; idx++) {
    const itemId = setup.runePouch[idx]?.id;
    if (itemId != null && itemId > 0) {
      setItemAtPos(layout, RUNE_POUCH_START + idx, itemId);
    }
  }

  return layout;
}
