/**
 * A snapshot of a player's worn equipment, inventory, and rune pouch at the
 * start of a fight, derived by the backend at parse time. Exposed on the
 * `/encounter` (per fight) and `/fightGroup` (first fight of the run) responses.
 */
export interface GearSetupItem {
  id: number;
  quantity: number;
}

export interface GearSetup {
  /** The logged-in player this setup belongs to. */
  player: string;
  /**
   * Worn equipment indexed by RuneLite's WORN item container slot. See
   * {@link EquipmentSlotIndex}. An optional trailing index 14 holds the ammo
   * loaded in a Dizana's quiver. Empty slots are -1.
   */
  equipment: number[];
  /** Inventory contents, up to 28 slots. Empty slots have an id of -1. */
  inventory: GearSetupItem[];
  /** Rune pouch contents (3 or 4 runes). Empty slots have an id of -1. */
  runePouch: GearSetupItem[];
  /** Active spellbook: 0 = Standard, 1 = Ancient, 2 = Lunar, 3 = Arceuus. */
  spellbook?: number;
}

/** Inventory Setups plugin spellbook values. */
export enum SpellbookId {
  STANDARD = 0,
  ANCIENT = 1,
  LUNAR = 2,
  ARCEUUS = 3,
  NONE = 4,
}

/**
 * RuneLite `EquipmentInventorySlot` indices for the WORN item container. Gear
 * setup `equipment` arrays are indexed by these values.
 */
export enum EquipmentSlotIndex {
  HEAD = 0,
  CAPE = 1,
  AMULET = 2,
  WEAPON = 3,
  BODY = 4,
  SHIELD = 5,
  ARMS = 6,
  LEGS = 7,
  HAIR = 8,
  GLOVES = 9,
  BOOTS = 10,
  JAW = 11,
  RING = 12,
  AMMO = 13,
  /** Not a real WORN slot; ammo inside a Dizana's quiver, appended by the client. */
  QUIVER = 14,
}

/** Number of real WORN equipment slots (excludes the appended quiver ammo). */
export const NUM_EQUIPMENT_SLOTS = 14;

/** Number of inventory slots. */
export const NUM_INVENTORY_SLOTS = 28;
