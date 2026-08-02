import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";

import {
  EquipmentSlotIndex,
  GearSetup,
  NUM_INVENTORY_SLOTS,
  SpellbookId,
} from "../../models/GearSetup";
import { itemIdMap } from "../../lib/itemIdMap";
import { getItemImageUrl } from "../replay/PlayerEquipment";
import SummarySection from "../summary/SummarySection";
import GearSetupExportModal from "./GearSetupExportModal";
import standardSpellbookIcon from "../../assets/spellbooks/Standard_spellbook.png";
import ancientSpellbookIcon from "../../assets/spellbooks/Ancient_spellbook.png";
import lunarSpellbookIcon from "../../assets/spellbooks/Lunar_spellbook.png";
import arceuusSpellbookIcon from "../../assets/spellbooks/Arceuus_spellbook.png";
import wornEquipmentTab from "../../assets/gear/wornEquipmentTab.png";
import blankSlot from "../../assets/gear/blankSlot.png";
import inventoryTabBackground from "../../assets/gear/inventoryTabBackground.png";
import runePouchBackground from "../../assets/gear/runePouchBackground.png";
import interfaceBorder from "../../assets/gear/interfaceBorder.png";

const SPELLBOOKS: Record<number, { name: string; icon: string }> = {
  [SpellbookId.STANDARD]: { name: "Standard", icon: standardSpellbookIcon },
  [SpellbookId.ANCIENT]: { name: "Ancient", icon: ancientSpellbookIcon },
  [SpellbookId.LUNAR]: { name: "Lunar", icon: lunarSpellbookIcon },
  [SpellbookId.ARCEUUS]: { name: "Arceuus", icon: arceuusSpellbookIcon },
};

interface GearSetupDisplayProps {
  gearSetups: GearSetup[];
  /** Name used for the exported bank tag tab / inventory setup. */
  name: string;
}

const formatItemQuantity = (quantity: number): string => {
  if (quantity >= 10_000_000) {
    return `${Math.floor(quantity / 1_000_000)}M`;
  }
  if (quantity >= 100_000) {
    return `${Math.floor(quantity / 1000)}K`;
  }
  return `${quantity}`;
};

const quantityColor = (quantity: number): string => {
  if (quantity >= 10_000_000) {
    return "#00ff80";
  }
  if (quantity >= 100_000) {
    return "#ffffff";
  }
  return "#ffff00";
};

const itemName = (itemId: number): string =>
  itemIdMap[itemId] || `Item ${itemId}`;

const wikiLink = (itemId: number): string =>
  `https://oldschool.runescape.wiki/w/${encodeURIComponent(
    itemName(itemId).replace(/ /g, "_"),
  )}`;

interface ItemImageProps {
  itemId: number;
  quantity: number;
}

/** An item sprite with wiki link and stack-quantity overlay, no slot border. */
const ItemImage: React.FC<ItemImageProps> = ({ itemId, quantity }) => {
  if (itemId <= 0) {
    return null;
  }
  return (
    <a
      href={wikiLink(itemId)}
      target="_blank"
      rel="noopener noreferrer"
      title={itemName(itemId)}
      style={{ lineHeight: 0, position: "relative", display: "inline-block" }}
    >
      <img
        src={getItemImageUrl(itemId)}
        alt={itemName(itemId)}
        style={{
          maxWidth: "36px",
          maxHeight: "32px",
          imageRendering: "pixelated",
        }}
      />
      {quantity > 1 && (
        <span
          style={{
            position: "absolute",
            top: "-6px",
            left: "0px",
            fontSize: "12px",
            lineHeight: "12px",
            color: quantityColor(quantity),
            textShadow: "1px 1px 0 #000",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {formatItemQuantity(quantity)}
        </span>
      )}
    </a>
  );
};

const centeredSlotSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative" as const,
};

/**
 * Top-left position (in the 175x222 wiki equipment tab) of each worn slot that
 * the OSRS wiki's {@link https://oldschool.runescape.wiki Template:Equipment}
 * renders. Slots not present on the interface (arms/hair/jaw) are omitted.
 */
const EQUIPMENT_SLOT_POSITIONS: Partial<
  Record<EquipmentSlotIndex, { left: number; top: number }>
> = {
  [EquipmentSlotIndex.HEAD]: { left: 70, top: 0 },
  [EquipmentSlotIndex.QUIVER]: { left: 111, top: 0 },
  [EquipmentSlotIndex.CAPE]: { left: 29, top: 39 },
  [EquipmentSlotIndex.AMULET]: { left: 70, top: 39 },
  [EquipmentSlotIndex.AMMO]: { left: 111, top: 39 },
  [EquipmentSlotIndex.WEAPON]: { left: 14, top: 78 },
  [EquipmentSlotIndex.BODY]: { left: 70, top: 78 },
  [EquipmentSlotIndex.SHIELD]: { left: 126, top: 78 },
  [EquipmentSlotIndex.LEGS]: { left: 70, top: 118 },
  [EquipmentSlotIndex.GLOVES]: { left: 14, top: 158 },
  [EquipmentSlotIndex.BOOTS]: { left: 70, top: 158 },
  [EquipmentSlotIndex.RING]: { left: 126, top: 158 },
};

const EquipmentPanel: React.FC<{ gearSetup: GearSetup }> = ({ gearSetup }) => {
  return (
    <Box
      sx={{
        // Match the OSRS wiki's Template:Equipment wrapper: dark background with
        // the shared interface border, sized to the same width and height as the
        // inventory, with the equipment interface scaled up and centered inside.
        width: "204px",
        height: "275px",
        boxSizing: "border-box",
        flexShrink: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#3e3529",
        borderStyle: "solid",
        borderWidth: "9px",
        borderColor: "transparent",
        borderImageSource: `url(${interfaceBorder})`,
        borderImageSlice: 9,
        borderImageWidth: "9px",
        borderImageOutset: 0,
        borderImageRepeat: "repeat",
        borderRadius: "6px",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "175px",
          height: "194px",
          // Scale the interface up to fill the box width (it is width-bound by
          // the 175x194 aspect ratio), staying crisp and centered.
          transform: "scale(1.06)",
          transformOrigin: "center",
          backgroundImage: `url(${wornEquipmentTab})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "175px 194px",
          imageRendering: "pixelated",
        }}
      >
        {gearSetup.equipment.map((itemId, index) => {
          const position =
            EQUIPMENT_SLOT_POSITIONS[index as EquipmentSlotIndex];
          if (!position || itemId <= 0) {
            return null;
          }
          return (
            <Box
              key={index}
              sx={{
                ...centeredSlotSx,
                position: "absolute",
                left: `${position.left}px`,
                top: `${position.top}px`,
                width: "36px",
                height: "36px",
              }}
            >
              <img
                src={blankSlot}
                alt=""
                aria-hidden
                style={{
                  position: "absolute",
                  width: "36px",
                  height: "36px",
                  imageRendering: "pixelated",
                }}
              />
              <Box sx={{ ...centeredSlotSx, zIndex: 1 }}>
                <ItemImage itemId={itemId} quantity={1} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const InventoryGrid: React.FC<{ gearSetup: GearSetup }> = ({ gearSetup }) => {
  const slots = Array.from({ length: NUM_INVENTORY_SLOTS }, (_, i) => {
    const item = gearSetup.inventory[i];
    return { id: item?.id ?? -1, quantity: item?.quantity ?? 1 };
  });

  return (
    <Box
      sx={{
        width: "204px",
        boxSizing: "border-box",
        padding: "13px 16px 10px",
        flexShrink: 0,
        backgroundImage: `url(${inventoryTabBackground})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        imageRendering: "pixelated",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 43px)",
          gridAutoRows: "36px",
        }}
      >
        {slots.map((slot, i) => (
          <Box key={i} sx={centeredSlotSx}>
            <ItemImage itemId={slot.id} quantity={slot.quantity} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const RunePouch: React.FC<{ gearSetup: GearSetup }> = ({ gearSetup }) => {
  const runes = gearSetup.runePouch.filter((rune) => rune.id > 0);
  if (runes.length === 0) {
    return null;
  }
  const isDivine = runes.length >= 4;
  return (
    <Box
      sx={{
        width: "158px",
        boxSizing: "border-box",
        padding: "24px 7px 6px",
        backgroundImage: `url(${runePouchBackground})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        imageRendering: "pixelated",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {runes.map((rune, i) => {
        const isMiddle = i !== 0 && i !== runes.length - 1;
        const marginX = isMiddle ? (isDivine ? 6 : 24) : 0;
        return (
          <Box
            key={i}
            sx={{
              ...centeredSlotSx,
              width: "32px",
              height: "32px",
              mx: `${marginX}px`,
            }}
          >
            <ItemImage itemId={rune.id} quantity={rune.quantity} />
          </Box>
        );
      })}
    </Box>
  );
};

const SpellbookDisplay: React.FC<{ spellbook?: number }> = ({ spellbook }) => {
  if (spellbook == null) {
    return null;
  }
  const info = SPELLBOOKS[spellbook];
  if (!info) {
    return null;
  }
  return (
    <Box>
      <Box sx={{ fontSize: "12px", opacity: 0.7, mb: "4px" }}>Spellbook</Box>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <img
          src={info.icon}
          alt={`${info.name} spellbook`}
          title={`${info.name} spellbook`}
          style={{ width: "24px", height: "24px" }}
        />
        <span style={{ fontSize: "13px" }}>{info.name}</span>
      </Stack>
    </Box>
  );
};

const GearSetupDisplay: React.FC<GearSetupDisplayProps> = ({
  gearSetups,
  name,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (gearSetups.length === 0) {
      return null;
    }
    return (
      gearSetups.find((setup) => setup.player === selectedPlayer) ??
      gearSetups[0]
    );
  }, [gearSetups, selectedPlayer]);

  if (!selected) {
    return null;
  }

  return (
    <SummarySection title="Gear Setup" defaultExpanded={false}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {gearSetups.length > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={selected.player}
            onChange={(_event, value) => {
              if (value) {
                setSelectedPlayer(value);
              }
            }}
            sx={{
              mb: 2,
              flexWrap: "wrap",
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            {gearSetups.map((setup) => (
              <ToggleButton key={setup.player} value={setup.player}>
                {setup.player}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "flex-start",
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <EquipmentPanel gearSetup={selected} />
          <InventoryGrid gearSetup={selected} />
          <Stack spacing={2}>
            <SpellbookDisplay spellbook={selected.spellbook} />
            <RunePouch gearSetup={selected} />
          </Stack>
        </Box>

        <Box
          sx={{
            order: { xs: -1, sm: 0 },
            mt: { xs: 0, sm: 2 },
            mb: { xs: 2, sm: 0 },
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<IosShareIcon />}
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
        </Box>
      </Box>

      <GearSetupExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        gearSetup={selected}
        name={name}
      />
    </SummarySection>
  );
};

export default GearSetupDisplay;
