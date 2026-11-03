import React from "react";
import { Box, Chip } from "@mui/material";
import { colors, layout } from "../theme";
import AppTooltip from "./AppTooltip";
import { formatMechanicHitsplatsLabel } from "../utils/mechanicDamageFilter";

interface MechanicHitsplatsChipProps {
  count: number;
  shown: boolean;
  onToggle: () => void;
}

const TOOLTIP =
  "Hitsplats the game draws on a boss for a mechanic, such as the Ocellus " +
  "phase 2 transition. They are not damage a player dealt and never count " +
  "toward DPS leaderboards.";

/** Default-on filter that hides boss mechanic hitsplats from every tab. */
const MechanicHitsplatsChip: React.FC<MechanicHitsplatsChipProps> = ({
  count,
  shown,
  onToggle,
}) => (
  <Box
    sx={{
      width: "100%",
      maxWidth: `${layout.contentMaxWidth}px`,
      mb: 1,
      display: "flex",
    }}
  >
    <AppTooltip title={TOOLTIP}>
      <Chip
        label={formatMechanicHitsplatsLabel(count, shown)}
        onClick={onToggle}
        onDelete={shown ? undefined : onToggle}
        variant={shown ? "outlined" : "filled"}
        size="small"
        sx={{
          bgcolor: shown ? "transparent" : colors.background.surface,
          color: "white",
          border: shown ? "1px dashed grey" : "1px solid grey",
          borderRadius: "5px",
          "& .MuiChip-label": {
            fontSize: "0.9rem",
            paddingLeft: "10px",
            paddingRight: "10px",
          },
          "& .MuiChip-deleteIcon": {
            color: "white",
            fontSize: "1.05rem",
            marginRight: "6px",
          },
          "& .MuiChip-deleteIcon:hover": {
            color: "white",
          },
        }}
      />
    </AppTooltip>
  </Box>
);

export default MechanicHitsplatsChip;
