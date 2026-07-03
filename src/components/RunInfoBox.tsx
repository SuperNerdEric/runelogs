import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Typography } from "@mui/material";
import { format } from "date-fns";
import { displayUsername } from "../utils/utils";
import { accountTextSx } from "../theme";

interface RunInfoBoxProps {
  uploaderId: string;
  startTime: string;
  players: string[];
}

const RunInfoBox: React.FC<RunInfoBoxProps> = ({
  uploaderId,
  startTime,
  players,
}) => {
  return (
    <Box className="log-info-box">
      <Typography className="log-info-label">Uploader</Typography>
      <Link
        component={RouterLink}
        style={{ textTransform: "capitalize" }}
        to={`/logs/${uploaderId}`}
        underline="hover"
        variant="body1"
        sx={accountTextSx}
      >
        {displayUsername(uploaderId)}
      </Link>

      <Typography className="log-info-label">Started</Typography>
      <Typography className="log-info-value">
        {format(new Date(startTime), "PPp")}
      </Typography>

      <Typography className="log-info-label">Players</Typography>
      <Typography component="div" className="log-info-value">
        {players.map((player, i) => (
          <React.Fragment key={player}>
            <Link
              component={RouterLink}
              to={`/player/${player}`}
              underline="hover"
              color="primary"
              sx={{ fontSize: "inherit" }}
            >
              {displayUsername(player)}
            </Link>
            {i < players.length - 1 ? ", " : ""}
          </React.Fragment>
        ))}
      </Typography>
    </Box>
  );
};

export default RunInfoBox;
