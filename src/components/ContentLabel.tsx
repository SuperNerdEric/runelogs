import React from "react";
import { Box, SxProps, Theme } from "@mui/material";
import HiscoreSpriteIcon from "./HiscoreSpriteIcon";

interface ContentLabelProps {
  label: React.ReactNode;
  spriteKey?: string | null;
  iconHeight?: number | string;
  gap?: number | string;
  sx?: SxProps<Theme>;
}

const ContentLabel: React.FC<ContentLabelProps> = ({
  label,
  spriteKey,
  iconHeight = "1em",
  gap = 0.5,
  sx,
}) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap,
      minWidth: 0,
      ...sx,
    }}
  >
    <HiscoreSpriteIcon spriteKey={spriteKey} height={iconHeight} alt="" />
    <Box component="span" sx={{ minWidth: 0 }}>
      {label}
    </Box>
  </Box>
);

export default ContentLabel;
