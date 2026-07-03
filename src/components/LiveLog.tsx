import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SensorsIcon from "@mui/icons-material/Sensors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SectionBox from "./SectionBox";
import AllowLiveLoggingScreenshot from "../assets/help/allow_live_logging.png";
import PanelIcon from "../assets/help/panel_icon.png";
import StartLiveLoggingScreenshot from "../assets/help/start_live_logging.png";
import {
  colors,
  contentColumnSx,
  fonts,
  fontSizes,
  media,
  typography,
} from "../theme";
import { isPrerenderPass } from "../utils/isPrerenderPass";
import { usePageMeta } from "../hooks/usePageMeta";
import { LIVE_LOG_PAGE_META } from "../utils/seoContent";

const STEP_LINE_HEIGHT = 1.4;

const stepRowSx = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  columnGap: 1.5,
  alignItems: "center",
  fontSize: typography.h5,
  fontWeight: 600,
  lineHeight: STEP_LINE_HEIGHT,
};

const stepBadgeSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: `${STEP_LINE_HEIGHT}em`,
  height: `${STEP_LINE_HEIGHT}em`,
  borderRadius: "50%",
  bgcolor: colors.background.surfaceAlt,
  border: `1px solid ${colors.border.default}`,
  color: colors.upload.dragActive,
  fontWeight: 600,
  fontSize: "0.7em",
  lineHeight: 1,
};

const stepTextSx = {
  m: 0,
  p: 0,
  fontSize: "inherit",
  fontWeight: "inherit",
  lineHeight: "inherit",
};

const panelIconInlineSx = {
  height: "1em",
  width: "auto",
  display: "inline-block",
  verticalAlign: "-0.125em",
  mx: 0.25,
};

const instructionScreenshotSx = {
  mt: 1.5,
  maxWidth: 300,
  width: "100%",
  height: "auto",
  display: "block",
};

const NO_ACCESS_KEY_MESSAGE = "You do not have a live log access key yet.";

const textFieldSx = {
  "& .MuiInputBase-root": {
    bgcolor: colors.background.surfaceAlt,
    color: colors.text.primary,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: colors.border.default,
  },
};

const primaryButtonSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  cursor: "pointer",
  minWidth: 140,
  px: 3,
  py: 1.25,
  borderRadius: "5px",
  border: `3px solid ${colors.border.default}`,
  bgcolor: "white",
  color: colors.background.page,
  fontFamily: fonts.body,
  fontSize: fontSizes.base,
  fontWeight: 600,
  transition: "background-color 0.2s ease, border-color 0.2s ease",
  "&:hover:not(:disabled)": {
    bgcolor: colors.upload.buttonHover,
    borderColor: colors.text.rune,
  },
  "&:disabled": {
    bgcolor: colors.background.progress,
    color: "rgba(255, 255, 255, 0.5)",
    borderColor: colors.border.default,
    cursor: "not-allowed",
  },
};

interface AccessKeyResponse {
  hasKey: boolean;
  key?: string;
  createdAt?: string;
  lastUsedAt?: string | null;
}

const LiveLog: React.FC = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  usePageMeta(LIVE_LOG_PAGE_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPrerenderPass()) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const fetchAccessKey = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/live-log/access-key`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to load access key (${res.status})`);
      }

      const data: AccessKeyResponse = await res.json();
      setAccessKey(data.hasKey ? (data.key ?? null) : null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load access key");
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccessKey();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchAccessKey]);

  const handleRegenerate = async () => {
    if (accessKey) {
      const confirmed = window.confirm(
        "Regenerating your access key will invalidate the previous key. Continue?",
      );
      if (!confirmed) {
        return;
      }
    }

    setRegenerating(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/live-log/access-key/regenerate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to regenerate access key (${res.status})`);
      }

      const data: AccessKeyResponse = await res.json();
      setAccessKey(data.key ?? null);
      setRevealed(true);
      setCopied(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to regenerate access key");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!accessKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(accessKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy access key:", err);
    }
  };

  if (isLoading || !isAuthenticated || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

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
          <SensorsIcon sx={{ fontSize: 32, color: colors.upload.dragActive }} />
        </Box>
        <Typography
          variant="h4"
          sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
        >
          Live Log
        </Typography>
      </Box>

      <SectionBox sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 4 }}>
          <Box sx={stepRowSx}>
            <Box component="span" sx={stepBadgeSx}>
              1
            </Box>
            <Box sx={stepTextSx}>
              Install the{" "}
              <Link
                href="https://runelite.net/plugin-hub/show/combat-logger"
                target="_blank"
                rel="noopener noreferrer"
              >
                Combat Logger
              </Link>{" "}
              plugin from the RuneLite plugin hub.
            </Box>
          </Box>

          <Box sx={stepRowSx}>
            <Box component="span" sx={stepBadgeSx}>
              2
            </Box>
            <Box sx={stepTextSx}>
              Generate your Runelogs access key below and copy it.
            </Box>
          </Box>

          <Box sx={{ ...stepRowSx, alignItems: "flex-start" }}>
            <Box component="span" sx={stepBadgeSx}>
              3
            </Box>
            <Box>
              <Box sx={stepTextSx}>
                In RuneLite, open Combat Logger settings, click{" "}
                <Box
                  component="span"
                  sx={{ color: "yellow", fontFamily: "monospace" }}
                >
                  Allow Live Logging
                </Box>
                , and paste the key into{" "}
                <Box
                  component="span"
                  sx={{ color: "yellow", fontFamily: "monospace" }}
                >
                  Runelogs Access Key
                </Box>
                .
              </Box>
              <Box
                component="img"
                src={AllowLiveLoggingScreenshot}
                alt="Allow Live Logging and Runelogs Access Key settings"
                sx={instructionScreenshotSx}
              />
            </Box>
          </Box>

          <Box sx={{ ...stepRowSx, alignItems: "flex-start" }}>
            <Box component="span" sx={stepBadgeSx}>
              4
            </Box>
            <Box>
              <Box sx={stepTextSx}>
                Click the Combat Logger{" "}
                <Box
                  component="img"
                  src={PanelIcon}
                  alt="Panel Icon"
                  sx={panelIconInlineSx}
                />{" "}
                panel icon in the RuneLite sidebar and click{" "}
                <Box
                  component="span"
                  sx={{ color: "yellow", fontFamily: "monospace" }}
                >
                  Start Live Logging
                </Box>
                .
              </Box>
              <Box
                component="img"
                src={StartLiveLoggingScreenshot}
                alt="Start Live Logging button"
                sx={instructionScreenshotSx}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography
              sx={{ mb: 0.75, color: colors.text.primary, fontWeight: 500 }}
            >
              Runelogs Access Key
            </Typography>
            <TextField
              fullWidth
              value={
                accessKey
                  ? revealed
                    ? accessKey
                    : "•".repeat(Math.min(accessKey.length, 48))
                  : NO_ACCESS_KEY_MESSAGE
              }
              InputProps={{
                readOnly: true,
                endAdornment: accessKey ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        revealed ? "Hide access key" : "Reveal access key"
                      }
                      onClick={() => setRevealed((prev) => !prev)}
                      edge="end"
                    >
                      {revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      aria-label="Copy access key"
                      onClick={handleCopy}
                      edge="end"
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
              sx={textFieldSx}
            />
            {copied && accessKey && (
              <Typography
                variant="body2"
                sx={{ mt: 1, color: colors.text.heal }}
              >
                Copied to clipboard
              </Typography>
            )}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box
            display="flex"
            justifyContent="flex-end"
            sx={{ [media.mobileDown]: { justifyContent: "center" } }}
          >
            <Box
              component="button"
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              sx={primaryButtonSx}
            >
              {regenerating ? (
                <CircularProgress size={24} sx={{ color: "inherit" }} />
              ) : (
                <>
                  {accessKey ? (
                    <RefreshIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <SensorsIcon sx={{ fontSize: 20 }} />
                  )}
                  {accessKey ? "Regenerate Key" : "Generate Key"}
                </>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              mt: 1,
              p: 2,
              borderRadius: 1.5,
              bgcolor: colors.background.page,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <InfoOutlinedIcon
              sx={{ color: colors.text.rune, mt: 0.25, flexShrink: 0 }}
            />
            <Typography
              variant="body1"
              sx={{ color: colors.text.primary, m: 0 }}
            >
              You can enable or disable live logging with the{" "}
              <Box
                component="span"
                sx={{ color: "yellow", fontFamily: fonts.mono }}
              >
                ::livelog
              </Box>{" "}
              command in-game.
            </Typography>
          </Box>
        </Box>
      </SectionBox>
    </Box>
  );
};

export default LiveLog;
