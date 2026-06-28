import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { colors, fontSizes } from "../theme";
import {
  getOverallReparseProgress,
  getReparseStatusLabel,
  type ReparseProgressPayload,
} from "../utils/reparseProgress";

const progressBarSx = {
  flex: 1,
  height: 10,
  borderRadius: 5,
  backgroundColor: colors.background.progress,
  "& .MuiLinearProgress-bar": {
    backgroundColor: colors.upload.dragActive,
    borderRadius: 5,
  },
} as const;

interface ReparseProgressIndicatorProps {
  progress: ReparseProgressPayload;
}

const ReparseProgressIndicator: React.FC<ReparseProgressIndicatorProps> = ({
  progress,
}) => {
  const overallProgress = getOverallReparseProgress(progress);
  const statusLabel = getReparseStatusLabel(progress);

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: colors.background.surfaceAlt,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <Typography
        sx={{
          m: 0,
          mb: 1,
          fontSize: fontSizes.base,
          fontWeight: 600,
          color: colors.text.primary,
        }}
      >
        {statusLabel}
      </Typography>

      {progress.logId && (
        <Typography
          sx={{
            m: 0,
            mb: 1,
            fontSize: fontSizes.sm,
            color: colors.text.muted,
            wordBreak: "break-all",
          }}
        >
          {progress.logId}
        </Typography>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={progressBarSx}
        />
        <Typography
          sx={{
            minWidth: 40,
            fontSize: fontSizes.sm,
            fontWeight: 600,
            color: colors.text.primary,
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          {Math.round(overallProgress)}%
        </Typography>
      </Box>
    </Box>
  );
};

export default ReparseProgressIndicator;
