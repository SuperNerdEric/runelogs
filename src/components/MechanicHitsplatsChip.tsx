import React from "react";
import { Box } from "@mui/material";
import { colors } from "../theme";
import AppTooltip from "./AppTooltip";
import {
  MECHANIC_HITSPLATS_LABEL,
  formatMechanicHitsplatsTooltip,
} from "../utils/mechanicDamageFilter";

interface MechanicHitsplatsChipProps {
  count: number;
  shown: boolean;
  onToggle: () => void;
}

const SELECTED_COLOR = colors.switch.tanHex;

/** Filter-chip-sized Yes/No selector for showing boss mechanic hitsplats. */
const MechanicHitsplatsChip: React.FC<MechanicHitsplatsChipProps> = ({
  count,
  shown,
  onToggle,
}) => {
  const renderOption = (label: string, value: boolean) => {
    const selected = shown === value;
    return (
      <Box
        component="button"
        type="button"
        aria-pressed={selected}
        onClick={selected ? undefined : onToggle}
        sx={{
          px: "9px",
          border: 0,
          cursor: selected ? "default" : "pointer",
          font: "inherit",
          fontWeight: selected ? 700 : 400,
          bgcolor: selected ? SELECTED_COLOR : "transparent",
          color: selected ? "#000" : "lightgrey",
          "&:hover": selected ? undefined : { color: "white" },
        }}
      >
        {label}
      </Box>
    );
  };

  return (
    <AppTooltip title={formatMechanicHitsplatsTooltip(count)}>
      <Box
        role="group"
        aria-label={MECHANIC_HITSPLATS_LABEL}
        sx={{
          display: "inline-flex",
          alignItems: "stretch",
          height: 24,
          boxSizing: "border-box",
          overflow: "hidden",
          bgcolor: colors.background.surface,
          color: "white",
          border: "1px solid grey",
          borderRadius: "5px",
          fontSize: "0.9rem",
          lineHeight: "22px",
          whiteSpace: "nowrap",
        }}
      >
        <Box component="span" sx={{ px: "10px" }}>
          {MECHANIC_HITSPLATS_LABEL}
        </Box>
        <Box sx={{ display: "flex", borderLeft: "1px solid grey" }}>
          {renderOption("No", false)}
          {renderOption("Yes", true)}
        </Box>
      </Box>
    </AppTooltip>
  );
};

export default MechanicHitsplatsChip;
