import React from "react";
import SensorsIcon from "@mui/icons-material/Sensors";
import { colors } from "../theme";
import AppTooltip from "./AppTooltip";
import {
  isLiveLogPending,
  wasEverLiveLogged,
  type LiveLogState,
} from "../utils/liveLogState";

const liveLogIconSx = {
  flexShrink: 0,
  fontSize: 16,
} as const;

interface LiveLogIndicatorProps {
  liveLogState?: LiveLogState | null;
}

const LiveLogIndicator: React.FC<LiveLogIndicatorProps> = ({
  liveLogState,
}) => {
  const state = liveLogState ?? "none";
  if (!wasEverLiveLogged(state)) {
    return null;
  }

  const active = isLiveLogPending(state);
  const tooltip =
    state === "live"
      ? "Live log in progress"
      : state === "finalizing"
        ? "Finalizing live log"
        : "Uploaded via live logging";

  return (
    <AppTooltip title={tooltip} arrow placement="top" disableTouch>
      <SensorsIcon
        aria-label={tooltip}
        sx={{
          ...liveLogIconSx,
          color: active ? colors.replay.marker : colors.text.muted,
        }}
      />
    </AppTooltip>
  );
};

export default LiveLogIndicator;
