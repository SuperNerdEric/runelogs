import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Popover, TextField, Typography } from "@mui/material";
import { colors } from "../../theme";
import {
  clampTimeRange,
  formatFightTime,
  formatTimeRangeSpan,
  parseFightTime,
} from "../../utils/timeRangeFilter";
import { useEncounterFilters } from "./EncounterFilterContext";

interface TimeRangeEditorProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const fieldSx = {
  flex: 1,
  "& .MuiInputBase-root": { color: "white" },
  "& .MuiInputLabel-root": { color: "lightgrey" },
};

/** Popover for typing a time range by hand. */
const TimeRangeEditor: React.FC<TimeRangeEditorProps> = ({
  anchorEl,
  onClose,
}) => {
  const filters = useEncounterFilters();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const startInputRef = useRef<HTMLInputElement>(null);

  const open = Boolean(anchorEl);
  const activeRange = filters?.timeRange ?? filters?.fullBounds;
  const activeStartMs = activeRange?.startMs;
  const activeEndMs = activeRange?.endMs;

  useEffect(() => {
    if (open && activeStartMs !== undefined && activeEndMs !== undefined) {
      setStart(formatFightTime(activeStartMs));
      setEnd(formatFightTime(activeEndMs));
      setError(null);
    }
  }, [open, activeStartMs, activeEndMs]);

  if (!filters) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const startMs = parseFightTime(start);
    const endMs = parseFightTime(end);
    if (startMs === null || endMs === null) {
      setError("Enter times like 1:23 or 1:23.4");
      return;
    }
    if (startMs >= endMs) {
      setError("End must be after start");
      return;
    }
    const range = clampTimeRange({ startMs, endMs }, filters.fullBounds);
    if (!range) {
      setError("That range is outside this fight");
      return;
    }
    filters.onSelectTimeRange(range);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      TransitionProps={{ onEntered: () => startInputRef.current?.select() }}
      PaperProps={{
        sx: {
          bgcolor: colors.background.surface,
          color: "white",
          border: `3px solid ${colors.border.default}`,
          borderRadius: "5px",
          boxShadow: "none",
          backgroundImage: "none",
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 1.5, width: 280, maxWidth: "100%" }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label="Start"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            size="small"
            inputRef={startInputRef}
            sx={fieldSx}
          />
          <TextField
            label="End"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            size="small"
            sx={fieldSx}
          />
        </Box>
        <Typography
          variant="caption"
          component="p"
          sx={{ mt: 1, color: error ? "#f44336" : "lightgrey" }}
        >
          {error ?? `This fight: ${formatTimeRangeSpan(filters.fullBounds)}`}
        </Typography>
        <Box
          sx={{ mt: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          <Button
            size="small"
            onClick={onClose}
            sx={{ color: "white", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            type="submit"
            variant="outlined"
            sx={{ color: "white", borderColor: "grey", textTransform: "none" }}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

export default TimeRangeEditor;
