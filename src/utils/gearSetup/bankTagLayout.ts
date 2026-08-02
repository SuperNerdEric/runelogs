import { EquipmentSlotIndex, GearSetup } from "../../models/GearSetup";
import { buildDefaultBankLayout } from "./layout";

/** RuneLite only understands version 1 of the bank tag export format. */
const BANK_TAG_EXPORT_VERSION = "1";

/** Fallback tab icon (Coins) when the setup has no obvious icon item. */
const DEFAULT_ICON_ITEM_ID = 995;

/**
 * Picks a sensible tab icon: the weapon if worn, otherwise the head slot, the
 * first inventory item, or coins.
 */
function pickIconItemId(setup: GearSetup): number {
  const weapon = setup.equipment[EquipmentSlotIndex.WEAPON];
  if (weapon != null && weapon > 0) {
    return weapon;
  }
  const head = setup.equipment[EquipmentSlotIndex.HEAD];
  if (head != null && head > 0) {
    return head;
  }
  const firstInventory = setup.inventory.find((item) => item.id > 0);
  if (firstInventory) {
    return firstInventory.id;
  }
  return DEFAULT_ICON_ITEM_ID;
}

/**
 * Standardizes a tab name to be safe inside the comma-delimited export string.
 */
function sanitizeTabName(name: string): string {
  const cleaned = name
    .replace(/[,\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return cleaned.length > 0 ? cleaned : "loadout";
}

/**
 * Builds a Bank Tags plugin export string for a gear setup using the "Default"
 * auto layout (items placed according to their slot). The resulting string can
 * be pasted into RuneLite via the bank tag tab import.
 *
 * Format: `banktags,1,<name>,<iconItemId>,layout,<pos>,<itemId>,...`
 */
export function buildBankTagExport(
  setup: GearSetup,
  name: string,
  iconItemId?: number,
): string {
  const layout = buildDefaultBankLayout(setup);
  const parts: string[] = [
    "banktags",
    BANK_TAG_EXPORT_VERSION,
    sanitizeTabName(name),
    String(
      iconItemId != null && iconItemId > 0 ? iconItemId : pickIconItemId(setup),
    ),
    "layout",
  ];

  for (let idx = 0; idx < layout.length; idx++) {
    if (layout[idx] !== -1) {
      parts.push(String(idx), String(layout[idx]));
    }
  }

  return parts.join(",");
}
