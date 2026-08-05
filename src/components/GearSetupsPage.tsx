import React from "react";
import { Box, Typography } from "@mui/material";

import { colors, contentColumnSx, media } from "../theme";
import { usePageMeta } from "../hooks/usePageMeta";
import gearSetupsIcon from "../assets/gearSetupsIcon.png";
import GearSetupsList from "./gear/GearSetupsList";

const GearSetupsPage: React.FC = () => {
  usePageMeta({
    title: "Gear Setups - Runelogs",
    description:
      "Browse gear setups from top-ranked OSRS boss and raid encounters. Export them to RuneLite Bank Tags or the Inventory Setups plugin.",
  });

  return (
    <Box
      sx={{
        ...contentColumnSx,
        mt: 2,
        px: 2,
        pb: 4,
        [media.mobileDown]: { px: 1 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          pt: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: colors.background.surfaceAlt,
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <Box
            component="img"
            src={gearSetupsIcon}
            alt=""
            aria-hidden
            sx={{ width: 32, height: 32, imageRendering: "pixelated" }}
          />
        </Box>
        <Box>
          <Typography
            variant="h4"
            sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
          >
            Gear Setups
          </Typography>
          <Typography
            sx={{ mt: 0.5, color: colors.text.iconHover, fontSize: 14 }}
          >
            Gear setups are auto-generated from ranked runs on eligible
            leaderboards.
          </Typography>
        </Box>
      </Box>

      <GearSetupsList />
    </Box>
  );
};

export default GearSetupsPage;
