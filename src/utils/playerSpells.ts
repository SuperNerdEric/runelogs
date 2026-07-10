import { PlayerSpellName } from "../models/LogLine";

export const PLAYER_SPELL_LABELS: Record<PlayerSpellName, string> = {
  VENGEANCE: "Vengeance",
  VENGEANCE_OTHER: "Received Vengeance Other",
  SPELLBOOK_SWAP: "Spellbook Swap",
  DEATH_CHARGE: "Death Charge",
  MARK_OF_DARKNESS: "Mark of Darkness",
  WARD_OF_ARCEUUS: "Ward of Arceuus",
  LESSER_CORRUPTION: "Lesser Corruption",
  GREATER_CORRUPTION: "Greater Corruption",
  DARK_LURE: "Dark Lure",
  THRALL_GHOST: "Ghost Thrall",
  THRALL_SKELETON: "Skeleton Thrall",
  THRALL_ZOMBIE: "Zombie Thrall",
};

export const PLAYER_SPELL_ICON_URLS: Record<PlayerSpellName, string> = {
  VENGEANCE: "/images/vengeance-icon.png",
  VENGEANCE_OTHER: "/images/vengeance-other-icon.png",
  SPELLBOOK_SWAP: "/images/spellbook-swap-icon.png",
  DEATH_CHARGE: "/images/death-charge-icon.png",
  MARK_OF_DARKNESS: "/images/mark-of-darkness-icon.png",
  WARD_OF_ARCEUUS: "/images/ward-of-arceuus-icon.png",
  LESSER_CORRUPTION: "/images/lesser-corruption-icon.png",
  GREATER_CORRUPTION: "/images/greater-corruption-icon.png",
  DARK_LURE: "/images/dark-lure-icon.png",
  THRALL_GHOST: "/images/thrall-ghost-icon.png",
  THRALL_SKELETON: "/images/thrall-skeleton-icon.png",
  THRALL_ZOMBIE: "/images/thrall-zombie-icon.png",
};

export const VENGEANCE_OTHER_ICON_URL = PLAYER_SPELL_ICON_URLS.VENGEANCE_OTHER;
export const VENGEANCE_OTHER_CAST_ARROW_URL =
  "/images/vengeance-other-cast-arrow.svg";
