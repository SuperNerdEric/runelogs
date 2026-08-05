import React, { useMemo, useState } from "react";
import { Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";

import { GearSetup } from "../../models/GearSetup";
import SummarySection from "../summary/SummarySection";
import GearSetupExportModal from "./GearSetupExportModal";
import GearSetupPanels from "./GearSetupPanels";
import gearSetupsIcon from "../../assets/gearSetupsIcon.png";

interface GearSetupDisplayProps {
  gearSetups: GearSetup[];
  /** Name used for the exported bank tag tab / inventory setup. */
  name: string;
}

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
    <SummarySection
      title="Gear Setup"
      defaultExpanded={false}
      titleIcon={
        <Box
          component="img"
          src={gearSetupsIcon}
          alt=""
          aria-hidden
          sx={{ width: 20, height: 20, imageRendering: "pixelated" }}
        />
      }
    >
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

        <GearSetupPanels gearSetup={selected} />

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
