import React, { useState } from "react";
import { Chip } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { colors } from "../../theme";
import { formatTimeRangeFilterLabel } from "../../utils/timeRangeFilter";
import MechanicHitsplatsChip from "../MechanicHitsplatsChip";
import { useEncounterFilters } from "./EncounterFilterContext";
import TimeRangeEditor from "./TimeRangeEditor";

/** The filter chips that apply on every tab; rendered inside a chip row. */
const EncounterFilterChips: React.FC = () => {
  const filters = useEncounterFilters();
  const [editorAnchor, setEditorAnchor] = useState<HTMLElement | null>(null);

  if (!filters) {
    return null;
  }

  return (
    <>
      {filters.mechanicHitsplatCount > 0 && (
        <MechanicHitsplatsChip
          count={filters.mechanicHitsplatCount}
          shown={filters.showMechanicHitsplats}
          onToggle={filters.onToggleMechanicHitsplats}
        />
      )}
      {filters.timeRange && (
        <Chip
          label={formatTimeRangeFilterLabel(filters.timeRange)}
          onClick={(event) => setEditorAnchor(event.currentTarget)}
          onDelete={filters.onClearTimeRange}
          icon={<ArrowDropDownIcon sx={{ color: "white !important" }} />}
          size="small"
          sx={{
            bgcolor: colors.background.surface,
            color: "white",
            border: "1px solid grey",
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
      )}
      <TimeRangeEditor
        anchorEl={editorAnchor}
        onClose={() => setEditorAnchor(null)}
      />
    </>
  );
};

export default EncounterFilterChips;
