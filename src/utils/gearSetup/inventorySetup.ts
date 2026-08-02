import {
  EquipmentSlotIndex,
  GearSetup,
  NUM_EQUIPMENT_SLOTS,
  NUM_INVENTORY_SLOTS,
} from "../../models/GearSetup";
import { buildDefaultBankLayout } from "./layout";

/**
 * A single item entry in an Inventory Setups export. `q` (quantity) and `f`
 * (fuzzy) are omitted when at their defaults, matching the plugin's compact
 * serialization. Empty slots serialize as `null`.
 */
interface InventorySetupPortableItem {
  id: number;
  q?: number;
}

interface InventorySetupPortable {
  setup: {
    inv: (InventorySetupPortableItem | null)[];
    eq: (InventorySetupPortableItem | null)[];
    rp?: (InventorySetupPortableItem | null)[];
    qv?: (InventorySetupPortableItem | null)[];
    name: string;
    hc: string;
    fb: boolean;
    sb: number;
  };
  layout: number[];
}

/** Default highlight color used by the Inventory Setups plugin (red). */
const DEFAULT_HIGHLIGHT_COLOR = "#FFFF0000";

function toItem(
  id: number | undefined,
  quantity?: number,
): InventorySetupPortableItem | null {
  if (id == null || id <= 0) {
    return null;
  }
  const item: InventorySetupPortableItem = { id };
  if (quantity != null && quantity !== 1) {
    item.q = quantity;
  }
  return item;
}

/**
 * Builds an Inventory Setups plugin export object for a gear setup. The result
 * can be `JSON.stringify`-ed and pasted into the plugin's import.
 *
 * - `inv` is padded to 28 slots, `eq` to the 14 WORN slots.
 * - `rp` (rune pouch) and `qv` (quiver ammo) are only included when present.
 * - `layout` reuses the Bank Tags "Default" auto layout.
 */
export function buildInventorySetup(
  setup: GearSetup,
  name: string,
): InventorySetupPortable {
  const inv: (InventorySetupPortableItem | null)[] = [];
  for (let i = 0; i < NUM_INVENTORY_SLOTS; i++) {
    const slot = setup.inventory[i];
    inv.push(slot ? toItem(slot.id, slot.quantity) : null);
  }

  const eq: (InventorySetupPortableItem | null)[] = [];
  for (let slot = 0; slot < NUM_EQUIPMENT_SLOTS; slot++) {
    eq.push(toItem(setup.equipment[slot]));
  }

  const portable: InventorySetupPortable = {
    setup: {
      inv,
      eq,
      name,
      hc: DEFAULT_HIGHLIGHT_COLOR,
      fb: true,
      // 0 = Standard, 1 = Ancient, 2 = Lunar, 3 = Arceuus (default Standard).
      sb: setup.spellbook ?? 0,
    },
    layout: buildDefaultBankLayout(setup),
  };

  const hasRunePouch = setup.runePouch.some((rune) => rune.id > 0);
  if (hasRunePouch) {
    portable.setup.rp = setup.runePouch.map((rune) =>
      toItem(rune.id, rune.quantity),
    );
  }

  const quiverAmmoId = setup.equipment[EquipmentSlotIndex.QUIVER];
  if (quiverAmmoId != null && quiverAmmoId > 0) {
    portable.setup.qv = [toItem(quiverAmmoId)];
  }

  return portable;
}

/** Convenience: builds and serializes an Inventory Setups export string. */
export function buildInventorySetupJson(
  setup: GearSetup,
  name: string,
): string {
  return JSON.stringify(buildInventorySetup(setup, name));
}
