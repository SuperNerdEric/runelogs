import React from "react";

import { Box } from "@mui/material";

import { Fight } from "../../models/Fight";

import { getEncounterRaidType } from "../../utils/encounterRaidType";

import { getBoostPotionsForRaid } from "../../utils/boostPotions";

import { getItemImageUrl } from "../replay/PlayerEquipment";

interface BoostPotionsDisplayProps {
  fight: Fight;
}

const BoostPotionsDisplay: React.FC<BoostPotionsDisplayProps> = ({ fight }) => {
  const potions = getBoostPotionsForRaid(getEncounterRaidType(fight));

  return (
    <Box className="summary-boost-potions summary-boost-potions--icons-only">
      {potions.map((potion) => (
        <Box
          key={potion.id}

          className="summary-boost-potion-icon"

          component="span"
        >
          <img
            src={getItemImageUrl(potion.itemId)}

            alt=""

            className="osrs-item-icon"

            loading="lazy"
          />
        </Box>
      ))}
    </Box>
  );
};

export default BoostPotionsDisplay;
