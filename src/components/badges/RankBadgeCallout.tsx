import React from "react";
import { Box, SxProps, Theme } from "@mui/material";

interface RankBadgeCalloutProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

const RankBadgeCallout: React.FC<RankBadgeCalloutProps> = ({
  children,
  sx,
}) => (
  <Box
    className="fight-group-rank-callouts"
    sx={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 1,
      width: "100%",
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default RankBadgeCallout;
