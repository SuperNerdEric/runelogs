import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Typography, IconButton, TextField } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { useAuth0 } from "@auth0/auth0-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { closeSnackbar, SnackbarKey, useSnackbar } from "notistack";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState } from "react";
import { displayUsername } from "../../utils/utils";
import { logNameTextSx, accountTextSx } from "../../theme";
import LogNameDisplay from "../LogNameDisplay";
import {
  isLiveLogSessionOpen,
  type LiveLogState,
} from "../../utils/liveLogState";

interface Props {
  uploaderId: string;
  logName: string | null;
  logId: string;
  uploadedAt: string;
  liveLogState?: LiveLogState;
  receivingData?: boolean;
  onLogNameChange: (name: string | null) => void;
}

const LogInfoBox: React.FC<Props> = ({
  uploaderId,
  logName,
  logId,
  uploadedAt,
  liveLogState = "none",
  receivingData: _receivingData = false,
  onLogNameChange,
}) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const canEdit = user?.username === uploaderId;
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(logName ?? "");
  const [saving, setSaving] = useState(false);

  const action = (snackbarId: SnackbarKey) => (
    <IconButton
      aria-label="close"
      size="small"
      onClick={() => closeSnackbar(snackbarId)}
      sx={{ color: "inherit" }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  const handleDelete = async (logId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this log?",
    );
    if (!confirmed) return;

    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error(`Delete failed with status ${resp.status}`);
      }

      enqueueSnackbar("Log Deleted", {
        variant: "success",
        autoHideDuration: 1000,
        action,
      });
      navigate(`/logs/${uploaderId}`, { replace: true });
    } catch (err: any) {
      console.error("Failed to delete log:", err);
      alert(err.message || "Failed to delete");
    }
  };

  const startEditing = () => {
    setDraft(logName ?? "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(logName ?? "");
    setEditing(false);
  };

  const saveEditing = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: draft.trim() || null }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(
          body.error || `Rename failed with status ${resp.status}`,
        );
      }

      const data: { name: string | null } = await resp.json();
      onLogNameChange(data.name);
      setEditing(false);
      enqueueSnackbar("Log renamed", {
        variant: "success",
        autoHideDuration: 1000,
        action,
      });
    } catch (err: any) {
      console.error("Failed to rename log:", err);
      enqueueSnackbar(err.message || "Failed to rename log", {
        variant: "error",
        action,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="log-info-box" sx={{ position: "relative" }}>
      {canEdit && (
        <IconButton
          aria-label="delete"
          size="large"
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            color: "white",
          }}
          onClick={() => handleDelete(logId)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}

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

      <Typography className="log-info-label">Log&nbsp;Name</Typography>
      {editing ? (
        <Box
          display="flex"
          alignItems="center"
          gap={0.5}
          className="log-info-value"
        >
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveEditing();
              } else if (e.key === "Escape") {
                cancelEditing();
              }
            }}
            size="small"
            autoFocus
            disabled={saving}
            fullWidth
            inputProps={{ maxLength: 100 }}
            sx={{
              flex: 1,
              minWidth: 0,
              "& .MuiInputBase-input": { color: "white", py: 0.5 },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.3)",
              },
            }}
          />
          <IconButton
            aria-label="save log name"
            size="small"
            onClick={() => void saveEditing()}
            disabled={saving}
            sx={{ flexShrink: 0 }}
          >
            <CheckIcon fontSize="small" sx={{ color: "white" }} />
          </IconButton>
          <IconButton
            aria-label="cancel edit"
            size="small"
            onClick={cancelEditing}
            disabled={saving}
            sx={{ flexShrink: 0 }}
          >
            <CloseIcon fontSize="small" sx={{ color: "white" }} />
          </IconButton>
        </Box>
      ) : (
        <Box
          className="log-info-value"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.25,
            minWidth: 0,
          }}
        >
          <LogNameDisplay
            name={logName}
            isLive={isLiveLogSessionOpen(liveLogState)}
            sx={{
              ...logNameTextSx(!!logName),
              minWidth: 0,
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
            waitingSuffixSx={{ color: "rgba(255,255,255,0.55)" }}
          />
          {canEdit && (
            <IconButton
              aria-label="edit log name"
              size="small"
              onClick={startEditing}
              sx={{ flexShrink: 0, p: 0.25 }}
            >
              <EditIcon
                fontSize="small"
                sx={{ color: "rgba(255,255,255,0.7)" }}
              />
            </IconButton>
          )}
        </Box>
      )}

      <Typography className="log-info-label">Log&nbsp;ID</Typography>
      <Typography className="log-info-value log-info-id">{logId}</Typography>

      <Typography className="log-info-label">Uploaded</Typography>
      <Typography className="log-info-value">
        {format(new Date(uploadedAt), "PPpp")}
      </Typography>
    </Box>
  );
};

export default LogInfoBox;
