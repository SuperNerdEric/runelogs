import React from "react";
import { Box } from "@mui/material";
import { colors } from "../theme";

const OSRS = "Old School RuneScape";
const SUBTITLE = "Review fights, track performance, and compare ranks.";

export function HomeHeroTagline() {
  return (
    <>
      <Box component="span" sx={{ color: colors.text.logs }}>
        Combat analysis
      </Box>
      <Box component="span" sx={{ color: "grey.500" }}>
        {" "}
        for{" "}
      </Box>
      <Box component="span" sx={{ color: colors.text.rune }}>
        {OSRS}
      </Box>
    </>
  );
}

export function HomeHeroSubtitle() {
  return (
    <Box component="span" sx={{ color: colors.text.link }}>
      {SUBTITLE}
    </Box>
  );
}
