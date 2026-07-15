import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Box,
  CircularProgress,
  LinearProgress,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import AppTooltip from "./AppTooltip";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { flushSync } from "react-dom";
import SectionBox from "./SectionBox";
import { useStableDropzone } from "../hooks/useStableDropzone";
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
import { UPLOAD_PAGE_META } from "../utils/seoContent";
import { combineOverallUploadProgress } from "../utils/uploadProgress";

async function pollLogUntilReadable(
  logId: string,
  token: string,
  onProgress?: (progress: number) => void,
): Promise<boolean> {
  const maxAttempts = 360;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/log/${logId}/status`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status === 404) {
      return false;
    }

    if (response.ok) {
      const body = (await response.json()) as {
        saveStatus?: string;
        processingProgress?: number;
      };

      if (typeof body.processingProgress === "number") {
        onProgress?.(body.processingProgress);
      }

      if (body.saveStatus === "complete") {
        return true;
      }
      if (body.saveStatus === "failed") {
        return false;
      }
    }

    if (response.status === 410) {
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false;
}

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

function UploadProgressIndicator({
  uploadPercent,
  parsePercent,
  parseStarted,
  recovering,
}: {
  uploadPercent: number;
  parsePercent: number | null;
  parseStarted: boolean;
  recovering: boolean;
}) {
  const isParsing = parsePercent !== null;
  const overallProgress = combineOverallUploadProgress(
    uploadPercent,
    parsePercent,
  );
  const uploadComplete = isParsing || uploadPercent >= 100;
  const parseWaiting = uploadComplete && !parseStarted;

  return (
    <Box
      sx={{
        my: 1,
        p: 2,
        borderRadius: 1.5,
        bgcolor: colors.background.surfaceAlt,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <Typography
        component="h3"
        sx={{
          m: 0,
          mb: 1.25,
          fontSize: typography.h6,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: colors.text.primary,
        }}
      >
        Step {isParsing ? 2 : 1} of 2
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.75,
          mb: 1.5,
          fontSize: fontSizes.base,
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: colors.text.primary,
            fontWeight: uploadComplete ? 400 : 600,
          }}
        >
          {uploadComplete && (
            <CheckIcon sx={{ fontSize: 18, color: colors.upload.dragActive }} />
          )}
          Upload
          <Box component="span" sx={{ fontWeight: 500 }}>
            · {Math.round(uploadPercent)}%
          </Box>
        </Box>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: colors.text.primary,
            fontWeight: isParsing && !parseWaiting ? 600 : 400,
          }}
        >
          Parse
          <Box component="span" sx={{ fontWeight: 500 }}>
            ·{" "}
            {parseWaiting
              ? "Waiting"
              : isParsing
                ? `${Math.round(parsePercent)}%`
                : "Waiting"}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <LinearProgress
          variant={recovering ? "indeterminate" : "determinate"}
          value={
            recovering ? undefined : Math.min(Math.max(overallProgress, 0), 100)
          }
          sx={{
            flex: 1,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.background.progress,
            "& .MuiLinearProgress-bar": {
              backgroundColor: colors.upload.dragActive,
              borderRadius: 6,
            },
          }}
        />
        {!recovering && (
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
        )}
      </Box>

      {isParsing && (
        <Typography
          sx={{
            m: 0,
            mt: 1.25,
            fontSize: fontSizes.sm,
            color: colors.text.muted,
          }}
        >
          {recovering
            ? "Connection lost — still parsing in the background. You can leave this page and check your logs list."
            : "You can leave this page while parsing finishes. Check your logs list for progress."}
        </Typography>
      )}
    </Box>
  );
}

const Upload: React.FC = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  usePageMeta(UPLOAD_PAGE_META);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logName, setLogName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [parsePercent, setParsePercent] = useState<number | null>(null);
  const [parseStarted, setParseStarted] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPrerenderPass()) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const onDrop = React.useCallback((files: File[]) => {
    if (files.length > 1) {
      setErrorText("Only one file can be uploaded at a time.");
    }
    if (files.length) {
      setUploadPercent(null);
      setParsePercent(null);
      setParseStarted(false);
      setRecovering(false);
      setSelectedFile(files[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useStableDropzone({
    onDrop,
    multiple: true,
    accept: { "text/plain": [".txt"] },
    noClick: true,
    noKeyboard: true,
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorText(null);
    setUploadPercent(null);
    setParsePercent(null);
    setParseStarted(false);
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorText("Please select a file before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);
    setUploadPercent(0);
    setParsePercent(null);
    setParseStarted(false);
    setRecovering(false);

    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("logFile", selectedFile);
      const trimmedName = logName.trim();
      if (trimmedName) {
        formData.append("name", trimmedName);
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${import.meta.env.VITE_API_URL}/log`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          flushSync(() => setUploadPercent(percent));
        }
      };

      const resetUploadState = () => {
        setIsSubmitting(false);
        setUploadPercent(null);
        setParsePercent(null);
        setParseStarted(false);
        setRecovering(false);
      };

      const finishUpload = (logId: string) => {
        resetUploadState();
        navigate(`/log/${logId}`);
      };

      const pollAfterAccept = async (logId: string) => {
        setParseStarted(true);
        setParsePercent(0);
        setRecovering(false);

        const ready = await pollLogUntilReadable(logId, token, (progress) => {
          flushSync(() => {
            setParsePercent(progress);
          });
        });

        if (ready) {
          finishUpload(logId);
          return;
        }

        setErrorText("Upload failed before the log could be saved.");
        resetUploadState();
      };

      xhr.onerror = () => {
        setErrorText("Upload failed due to a network error.");
        resetUploadState();
      };

      xhr.onabort = () => {
        setErrorText("Upload was aborted.");
        setIsSubmitting(false);
      };

      xhr.onload = () => {
        setUploadPercent(100);

        if (xhr.status >= 200 && xhr.status < 300) {
          let logId: string | undefined;
          try {
            const body = JSON.parse(xhr.responseText) as { logId?: string };
            logId = body.logId;
          } catch {
            setErrorText("Upload accepted but response was invalid.");
            resetUploadState();
            return;
          }

          if (!logId) {
            setErrorText("Upload accepted but no logId was returned.");
            resetUploadState();
            return;
          }

          void pollAfterAccept(logId);
          return;
        }

        let message = `Server returned ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) {
            message = body.error;
          }
        } catch {
          // ignore
        }
        setErrorText(message);
        resetUploadState();
      };

      xhr.send(formData);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "An unexpected error occurred.");
      setUploadPercent(null);
      setParsePercent(null);
      setRecovering(false);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
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
          <CloudUploadIcon
            sx={{ fontSize: 32, color: colors.upload.dragActive }}
          />
        </Box>
        <Typography
          variant="h4"
          sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
        >
          Upload a Combat Log
        </Typography>
      </Box>

      <SectionBox
        {...getRootProps()}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderColor: isDragActive
            ? colors.upload.dragActive
            : colors.border.default,
          borderStyle: isDragActive ? "dashed" : "solid",
          transition: "border-color 0.2s ease, background-color 0.2s ease",
          bgcolor: isDragActive
            ? colors.background.surfaceAlt
            : colors.background.surface,
        }}
      >
        <input
          {...getInputProps({
            onDragEnter: (e) => e.stopPropagation(),
            onDragOver: (e) => e.stopPropagation(),
            onDragLeave: (e) => e.stopPropagation(),
          })}
        />

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
              Locate your combat logs stored in{" "}
              <Box
                component="span"
                sx={{ color: "yellow", fontFamily: "monospace" }}
              >
                .runelite/combat_log
              </Box>
              .
              <AppTooltip title="Help" placement="top" disableTouch>
                <Link
                  component={RouterLink}
                  to="/help#find-combat-log"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.25,
                    ml: 0.5,
                    verticalAlign: "middle",
                  }}
                >
                  <HelpOutlineIcon fontSize="inherit" />
                </Link>
              </AppTooltip>
            </Box>
          </Box>

          <Box sx={stepRowSx}>
            <Box component="span" sx={stepBadgeSx}>
              3
            </Box>
            <Box sx={stepTextSx}>Upload and analyze!</Box>
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              py: 3,
              px: 2,
              borderRadius: 1.5,
              border: `2px dashed ${isDragActive ? colors.upload.dragActive : colors.border.default}`,
              bgcolor: colors.background.surfaceAlt,
              transition: "border-color 0.2s ease, background-color 0.2s ease",
            }}
          >
            <DescriptionOutlinedIcon
              sx={{
                fontSize: 40,
                color: colors.text.rune,
              }}
            />
            <Box
              component="label"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.5 : 1,
                pointerEvents: isSubmitting ? "none" : "auto",
                px: 3,
                py: 1.25,
                borderRadius: "5px",
                border: `3px solid ${colors.border.default}`,
                bgcolor: colors.background.page,
                color: selectedFile ? colors.text.gold : colors.text.primary,
                fontFamily: fonts.body,
                fontSize: fontSizes.base,
                fontWeight: 500,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "border-color 0.2s ease, color 0.2s ease",
                "&:hover": {
                  borderColor: colors.text.rune,
                },
              }}
            >
              {selectedFile ? selectedFile.name : "Choose Log File..."}
              <input
                type="file"
                accept=".txt"
                hidden
                onChange={handleFileChange}
              />
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{ mb: 0.75, color: colors.text.primary, fontWeight: 500 }}
            >
              Name{" "}
              <Box
                component="span"
                sx={{ color: "rgba(255, 255, 255, 0.5)", fontWeight: 400 }}
              >
                (Optional)
              </Box>
            </Typography>
            <TextField
              value={logName}
              onChange={(e) => setLogName(e.target.value)}
              disabled={isSubmitting}
              fullWidth
              inputProps={{ maxLength: 100 }}
              sx={{
                "& .MuiInputBase-root": {
                  bgcolor: colors.background.surfaceAlt,
                  color: colors.text.primary,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.border.default,
                },
              }}
            />
          </Box>

          {errorText && <Alert severity="error">{errorText}</Alert>}

          {uploadPercent !== null && (
            <UploadProgressIndicator
              uploadPercent={uploadPercent}
              parsePercent={parsePercent}
              parseStarted={parseStarted}
              recovering={recovering}
            />
          )}

          <Box
            display="flex"
            justifyContent="flex-end"
            sx={{ [media.mobileDown]: { justifyContent: "center" } }}
          >
            <Box
              component="button"
              type="submit"
              disabled={isSubmitting}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
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
                transition:
                  "background-color 0.2s ease, border-color 0.2s ease",
                "&:hover:not(:disabled)": {
                  bgcolor: colors.upload.buttonHover,
                  borderColor: colors.text.rune,
                },
                "&:disabled": {
                  bgcolor: colors.background.progress,
                  color: "rgba(255, 255, 255, 0.5)",
                  borderColor: colors.border.default,
                },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: "inherit" }} />
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 20 }} />
                  Upload
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
              You can start a new combat log with the{" "}
              <Box
                component="span"
                sx={{ color: "yellow", fontFamily: fonts.mono }}
              >
                ::newlog
              </Box>{" "}
              command in-game.
            </Typography>
          </Box>
        </Box>
      </SectionBox>
    </Box>
  );
};

export default Upload;
