import React from "react";
import { Alert, type SxProps, type Theme } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

const LIVE_LOG_PROGRESS_MESSAGE =
  "Live log in progress — this page will refresh while new data is received.";

interface LiveLogProgressAlertProps {
  refreshing: boolean;
  sx?: SxProps<Theme>;
}

const LiveLogProgressAlert: React.FC<LiveLogProgressAlertProps> = ({
  refreshing,
  sx,
}) => (
  <Alert
    severity="info"
    sx={sx}
    icon={
      refreshing ? (
        <RefreshIcon
          sx={{
            fontSize: 22,
            animation: "liveLogRefreshSpin 0.5s linear infinite",
            "@keyframes liveLogRefreshSpin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
          }}
        />
      ) : (
        <InfoOutlinedIcon sx={{ fontSize: 22 }} />
      )
    }
  >
    {LIVE_LOG_PROGRESS_MESSAGE}
  </Alert>
);

export default LiveLogProgressAlert;
