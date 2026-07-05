import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  Link,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestorePageIcon from "@mui/icons-material/RestorePage";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useSnackbar } from "notistack";
import { format } from "date-fns";
import SectionBox from "./SectionBox";
import ReparseProgressIndicator from "./ReparseProgressIndicator";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { colors, contentColumnSx, fontSizes, fonts, media } from "../theme";
import type { ReparseProgressPayload } from "../utils/reparseProgress";
import {
  createInitialReparseProgress,
  streamLogReparse,
} from "../utils/streamLogReparse";
import { displayUsername } from "../utils/utils";
import { usePageMeta } from "../hooks/usePageMeta";
import { ADMIN_PAGE_META } from "../utils/encounterPageMeta";
import {
  downloadIndividualParsedLogExports,
  downloadParsedLogsWithoutRaw,
  downloadSingleParsedLogExport,
} from "../utils/downloadParsedLogsWithoutRaw";
import {
  fetchLogIdsWithoutRaw,
  fetchRestoreAllRawLogsStatus,
  previewRestoreRawLog,
  restoreRawLog,
  startRestoreAllRawLogs,
  type RestoreAllRawLogsStatus,
  type RestoreParityReport,
  type RestoreRawLogResult,
} from "../utils/restoreRawLog";

interface ReparseAllStatus {
  status: "idle" | "started" | "in_progress" | "completed" | "failed";
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  progress: string;
  startedAt?: string;
  completedAt?: string;
  currentLogId?: string;
}

interface LogStatusResponse {
  id: string;
  name: string | null;
  uploaderId: string;
  uploadedAt: string;
  eligible: boolean;
  saveStatus: "saving" | "complete" | "failed";
  processingProgress: number;
  _count: {
    fights: number;
    fightGroups: number;
  };
}

const sectionTitleSx = {
  color: colors.text.primary,
  fontWeight: 600,
  fontSize: fontSizes.lg,
  mb: 1.5,
} as const;

const sectionDescriptionSx = {
  color: colors.text.muted,
  fontSize: fontSizes.base,
  mb: 2,
} as const;

const adminSectionBoxSx = {
  p: { xs: 2.25, md: 3 },
} as const;

const actionRowSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  alignItems: "center",
} as const;

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    "& fieldset": {
      borderColor: colors.border.default,
    },
    "&:hover fieldset": {
      borderColor: colors.background.hover,
    },
    "&.Mui-focused fieldset": {
      borderColor: colors.upload.dragActive,
    },
  },
  "& .MuiInputLabel-root": {
    color: colors.text.muted,
  },
  "& .MuiFormHelperText-root": {
    color: colors.text.muted,
  },
} as const;

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
} as const;

const secondaryButtonSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  cursor: "pointer",
  minWidth: 120,
  px: 2.5,
  py: 1,
  borderRadius: "5px",
  border: `1px solid ${colors.border.default}`,
  bgcolor: colors.background.surfaceAlt,
  color: colors.text.primary,
  fontFamily: fonts.body,
  fontSize: fontSizes.base,
  fontWeight: 600,
  transition: "background-color 0.2s ease, border-color 0.2s ease",
  "&:hover:not(:disabled)": {
    bgcolor: colors.background.hover,
    borderColor: colors.background.hover,
  },
  "&:disabled": {
    color: colors.text.muted,
    cursor: "not-allowed",
  },
} as const;

const WARNING_COLOR = "#d29922";

const warningButtonSx = {
  ...secondaryButtonSx,
  minWidth: 140,
  px: 3,
  py: 1.25,
  border: `3px solid ${WARNING_COLOR}`,
  bgcolor: alpha(WARNING_COLOR, 0.1),
  color: WARNING_COLOR,
  "&:hover:not(:disabled)": {
    bgcolor: alpha(WARNING_COLOR, 0.2),
    borderColor: WARNING_COLOR,
  },
  "&:disabled": {
    bgcolor: colors.background.progress,
    color: "rgba(255, 255, 255, 0.5)",
    borderColor: colors.border.default,
    cursor: "not-allowed",
  },
} as const;

const deleteButtonSx = {
  ...secondaryButtonSx,
  borderColor: colors.fight.failure,
  color: colors.fight.failure,
  "&:hover:not(:disabled)": {
    bgcolor: alpha(colors.fight.failure, 0.12),
    borderColor: colors.fight.failure,
  },
} as const;

const progressBarSx = {
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.background.progress,
  "& .MuiLinearProgress-bar": {
    backgroundColor: colors.upload.dragActive,
    borderRadius: 6,
  },
} as const;

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: colors.upload.dragActive,
    "&:hover": {
      backgroundColor: alpha(colors.upload.dragActive, 0.08),
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: colors.upload.dragActive,
  },
  "& .MuiSwitch-track": {
    backgroundColor: colors.background.progress,
  },
} as const;

const linkSx = {
  color: colors.text.link,
  "&:hover": {
    color: colors.text.link,
  },
} as const;

const detailTextSx = {
  color: colors.text.primary,
  fontSize: fontSizes.base,
  mb: 1,
} as const;

const mutedDetailTextSx = {
  color: colors.text.muted,
  fontSize: fontSizes.sm,
  mt: 1,
} as const;

function parseLogIdInput(input: string): string[] {
  return input
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

function isReparseJobActive(status: ReparseAllStatus["status"]): boolean {
  return status === "started" || status === "in_progress";
}

function isRestoreJobActive(
  status: RestoreAllRawLogsStatus["status"],
): boolean {
  return status === "started" || status === "in_progress";
}

function formatParitySummary(report: RestoreParityReport): string {
  if (report.passed) {
    return "Parity check passed";
  }
  const unexpected = report.diffs.filter((diff) => !diff.documented).length;
  return `${unexpected} unexpected parity difference${unexpected === 1 ? "" : "s"}`;
}

const Admin: React.FC = () => {
  usePageMeta(ADMIN_PAGE_META);

  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
  } = useAuth0();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { enqueueSnackbar } = useSnackbar();

  const [reparseStatus, setReparseStatus] = useState<ReparseAllStatus | null>(
    null,
  );
  const [totalLogCount, setTotalLogCount] = useState<number | null>(null);
  const [logsWithoutRawCount, setLogsWithoutRawCount] = useState<number | null>(
    null,
  );
  const [reparseStarting, setReparseStarting] = useState(false);
  const [parsedExportLoading, setParsedExportLoading] = useState(false);
  const [parsedExportMode, setParsedExportMode] = useState<
    "combined" | "individual" | null
  >(null);
  const [parsedExportProgress, setParsedExportProgress] = useState<{
    current: number;
    total: number;
    logId: string;
  } | null>(null);
  const [restoreStatus, setRestoreStatus] =
    useState<RestoreAllRawLogsStatus | null>(null);
  const [restoreStarting, setRestoreStarting] = useState(false);
  const [restorePreview, setRestorePreview] =
    useState<RestoreRawLogResult | null>(null);
  const [copyingLogIds, setCopyingLogIds] = useState(false);

  const [bulkReparseInput, setBulkReparseInput] = useState("");
  const [reparseProgress, setReparseProgress] = useState<{
    source: "bulk" | "manage";
    payload: ReparseProgressPayload;
  } | null>(null);

  const [logIdInput, setLogIdInput] = useState("");
  const [loadedLog, setLoadedLog] = useState<LogStatusResponse | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [getAccessTokenSilently]);

  const fetchReparseStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/log/reparse-all/status`,
        { headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as ReparseAllStatus;
      setReparseStatus(data);
    } catch (err) {
      console.error("Failed to fetch reparse-all status:", err);
    }
  }, [getAuthHeaders]);

  const fetchTotalLogCount = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/logs/count`,
        { headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as { total: number };
      setTotalLogCount(data.total);
    } catch (err) {
      console.error("Failed to fetch log count:", err);
    }
  }, [getAuthHeaders]);

  const fetchLogsWithoutRawCount = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/logs/without-raw/count`,
        { headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as { total: number };
      setLogsWithoutRawCount(data.total);
    } catch (err) {
      console.error("Failed to fetch logs-without-raw count:", err);
    }
  }, [getAuthHeaders]);

  const fetchRestoreStatus = useCallback(async () => {
    try {
      const data = await fetchRestoreAllRawLogsStatus({
        apiUrl: import.meta.env.VITE_API_URL,
        getAuthHeaders,
      });
      setRestoreStatus(data);
    } catch (err) {
      console.error("Failed to fetch restore-all status:", err);
    }
  }, [getAuthHeaders]);

  const startReparseAll = async () => {
    if (
      !window.confirm(
        "Reparse all logs? This will reprocess every stored log from its raw upload and may take a long time.",
      )
    ) {
      return;
    }

    setReparseStarting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/log/reparse-all`,
        { method: "POST", headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as ReparseAllStatus;
      setReparseStatus(data);
      enqueueSnackbar("Reparse-all job started", { variant: "success" });
    } catch (err) {
      console.error("Failed to start reparse-all:", err);
      enqueueSnackbar("Failed to start reparse-all job", { variant: "error" });
    } finally {
      setReparseStarting(false);
    }
  };

  const loadLog = async () => {
    const logId = logIdInput.trim();
    if (!logId) {
      return;
    }

    setLogLoading(true);
    setLogError(null);
    setLoadedLog(null);
    setRestorePreview(null);
    setIsEditingName(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/log/${logId}/status`,
      );
      if (response.status === 404) {
        setLogError("Log not found");
        return;
      }
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as LogStatusResponse;
      setLoadedLog(data);
      setEditedName(data.name ?? "");
    } catch (err) {
      console.error("Failed to load log:", err);
      setLogError("Failed to load log");
    } finally {
      setLogLoading(false);
    }
  };

  const reparseActive = reparseProgress !== null;

  const reparseLogs = async (
    logIds: string[],
    source: "bulk" | "manage",
    options?: { refreshLoaded?: boolean },
  ) => {
    if (logIds.length === 0 || reparseActive) {
      return;
    }

    const logLabel =
      logIds.length === 1
        ? `"${options?.refreshLoaded ? (loadedLog?.name ?? logIds[0]) : logIds[0]}"`
        : `${logIds.length} logs`;

    if (
      !window.confirm(
        `Reparse ${logLabel}? This will reprocess the log${logIds.length === 1 ? "" : "s"} from the original raw upload${logIds.length === 1 ? "" : "s"}.`,
      )
    ) {
      return;
    }

    setReparseProgress({
      source,
      payload: createInitialReparseProgress(logIds),
    });

    if (source === "manage") {
      setActionLoading("reparse");
    }

    const failedLogs: string[] = [];

    try {
      const token = await getAccessTokenSilently();
      await streamLogReparse(
        import.meta.env.VITE_API_URL,
        logIds,
        token,
        (payload) => {
          if (payload.error && payload.logId) {
            failedLogs.push(payload.logId);
          }

          setReparseProgress((current) =>
            current
              ? {
                  ...current,
                  payload: {
                    ...current.payload,
                    ...payload,
                    logTotal: payload.logTotal ?? current.payload.logTotal,
                    logIndex: payload.logIndex ?? current.payload.logIndex,
                  },
                }
              : current,
          );
        },
      );

      if (failedLogs.length > 0) {
        enqueueSnackbar(
          failedLogs.length === logIds.length
            ? "All reparses failed"
            : `Reparse finished with ${failedLogs.length} failure${failedLogs.length === 1 ? "" : "s"}`,
          {
            variant: failedLogs.length === logIds.length ? "error" : "warning",
          },
        );
      } else {
        enqueueSnackbar(
          logIds.length === 1
            ? "Log reparsed"
            : `${logIds.length} logs reparsed`,
          { variant: "success" },
        );
      }

      if (
        options?.refreshLoaded &&
        loadedLog &&
        logIds.includes(loadedLog.id)
      ) {
        await refreshLoadedLog(loadedLog.id);
      }
    } catch (err) {
      console.error("Failed to reparse log(s):", err);
      enqueueSnackbar(
        err instanceof Error ? err.message : "Failed to reparse log(s)",
        { variant: "error" },
      );
    } finally {
      setReparseProgress(null);
      if (source === "manage") {
        setActionLoading(null);
      }
    }
  };

  const reparseBulkLogs = async () => {
    const logIds = parseLogIdInput(bulkReparseInput);
    await reparseLogs(logIds, "bulk");
  };

  const reparseLoadedLog = async () => {
    if (!loadedLog) {
      return;
    }

    await reparseLogs([loadedLog.id], "manage", { refreshLoaded: true });
  };

  const refreshLoadedLog = async (logId: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/log/${logId}/status`,
    );
    if (response.ok) {
      const data = (await response.json()) as LogStatusResponse;
      setLoadedLog(data);
      setEditedName(data.name ?? "");
    }
  };

  const downloadAllParsedExports = async () => {
    if (
      !window.confirm(
        "Combine all parsed exports into a single file? This can be very large and may fail in the browser. Prefer Download Individual Exports for backups.",
      )
    ) {
      return;
    }

    setParsedExportLoading(true);
    setParsedExportMode("combined");
    setParsedExportProgress(null);
    try {
      const { blob, summary } = await downloadParsedLogsWithoutRaw({
        apiUrl: import.meta.env.VITE_API_URL,
        getAuthHeaders,
        onProgress: (current, total, logId) => {
          setParsedExportProgress({ current, total, logId });
        },
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "parsed-logs-without-raw.txt";
      anchor.click();
      URL.revokeObjectURL(url);

      if (summary.failedLogIds.length > 0) {
        enqueueSnackbar(
          `Export finished with ${summary.failedLogIds.length} failed log${summary.failedLogIds.length === 1 ? "" : "s"}`,
          { variant: "warning" },
        );
      } else {
        enqueueSnackbar("Combined parsed export downloaded", {
          variant: "success",
        });
      }
    } catch (err) {
      console.error("Failed to download parsed export:", err);
      enqueueSnackbar("Failed to download combined parsed export", {
        variant: "error",
      });
    } finally {
      setParsedExportLoading(false);
      setParsedExportMode(null);
      setParsedExportProgress(null);
    }
  };

  const downloadIndividualParsedExportsHandler = async () => {
    if (
      !window.confirm(
        "Download one parsed-export file per log? Your browser may ask to allow multiple downloads. Each log is fetched separately with a 10-minute timeout.",
      )
    ) {
      return;
    }

    setParsedExportLoading(true);
    setParsedExportMode("individual");
    setParsedExportProgress(null);
    try {
      const { succeeded, failedLogIds } =
        await downloadIndividualParsedLogExports({
          apiUrl: import.meta.env.VITE_API_URL,
          getAuthHeaders,
          onProgress: (current, total, logId) => {
            setParsedExportProgress({ current, total, logId });
          },
        });

      if (failedLogIds.length > 0) {
        enqueueSnackbar(
          `Downloaded ${succeeded} export${succeeded === 1 ? "" : "s"}; ${failedLogIds.length} failed`,
          { variant: "warning" },
        );
      } else {
        enqueueSnackbar(
          `Downloaded ${succeeded} individual export${succeeded === 1 ? "" : "s"}`,
          { variant: "success" },
        );
      }
    } catch (err) {
      console.error("Failed to download individual parsed exports:", err);
      enqueueSnackbar("Failed to download individual parsed exports", {
        variant: "error",
      });
    } finally {
      setParsedExportLoading(false);
      setParsedExportMode(null);
      setParsedExportProgress(null);
    }
  };

  const downloadParsedExport = async () => {
    if (!loadedLog) {
      return;
    }

    setActionLoading("parsed-export");
    try {
      await downloadSingleParsedLogExport({
        apiUrl: import.meta.env.VITE_API_URL,
        logId: loadedLog.id,
        getAuthHeaders,
      });
      enqueueSnackbar("Parsed export downloaded", { variant: "success" });
    } catch (err) {
      console.error("Failed to download parsed export:", err);
      enqueueSnackbar("Failed to download parsed export", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const downloadRawLog = async () => {
    if (!loadedLog) {
      return;
    }

    setActionLoading("download");
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/log/${loadedLog.id}/raw`,
        { headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${loadedLog.id}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar("Raw log downloaded", { variant: "success" });
    } catch (err) {
      console.error("Failed to download raw log:", err);
      enqueueSnackbar("Failed to download raw log", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const previewLoadedLogRestore = async () => {
    if (!loadedLog) {
      return;
    }

    setActionLoading("restore-preview");
    setRestorePreview(null);
    try {
      const result = await previewRestoreRawLog({
        apiUrl: import.meta.env.VITE_API_URL,
        logId: loadedLog.id,
        getAuthHeaders,
      });
      if (!result.success) {
        enqueueSnackbar(result.error, { variant: "error" });
        return;
      }
      setRestorePreview(result);
      enqueueSnackbar(
        `${formatParitySummary(result.parityReport)} · ${result.lineCount.toLocaleString()} lines`,
        {
          variant: result.parityReport.passed ? "success" : "warning",
        },
      );
    } catch (err) {
      console.error("Failed to preview raw restore:", err);
      enqueueSnackbar("Failed to preview raw restore", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const restoreLoadedLog = async () => {
    if (!loadedLog) {
      return;
    }

    if (
      !window.confirm(
        restorePreview?.parityReport.passed
          ? "Upload reconstructed raw log to storage?"
          : "Parity check reported differences. Upload reconstructed raw log anyway?",
      )
    ) {
      return;
    }

    setActionLoading("restore");
    try {
      const result = await restoreRawLog({
        apiUrl: import.meta.env.VITE_API_URL,
        logId: loadedLog.id,
        getAuthHeaders,
      });
      if (!result.success) {
        enqueueSnackbar(result.error, { variant: "error" });
        return;
      }
      setRestorePreview(result);
      enqueueSnackbar(
        result.parityReport.passed
          ? "Raw log restored"
          : "Raw log restored with parity warnings",
        {
          variant: result.parityReport.passed ? "success" : "warning",
        },
      );
      await fetchLogsWithoutRawCount();
    } catch (err) {
      console.error("Failed to restore raw log:", err);
      enqueueSnackbar("Failed to restore raw log", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const startRestoreAll = async () => {
    if (
      !window.confirm(
        "Restore raw logs for all logs missing a raw upload? Reconstructed files are uploaded even when parity differs.",
      )
    ) {
      return;
    }

    setRestoreStarting(true);
    try {
      const data = await startRestoreAllRawLogs({
        apiUrl: import.meta.env.VITE_API_URL,
        getAuthHeaders,
      });
      setRestoreStatus(data);
      enqueueSnackbar("Restore-all job started", { variant: "success" });
    } catch (err) {
      console.error("Failed to start restore-all:", err);
      enqueueSnackbar("Failed to start restore-all job", { variant: "error" });
    } finally {
      setRestoreStarting(false);
    }
  };

  const copyLogsWithoutRawIds = async () => {
    setCopyingLogIds(true);
    try {
      const logIds = await fetchLogIdsWithoutRaw({
        apiUrl: import.meta.env.VITE_API_URL,
        getAuthHeaders,
      });
      if (logIds.length === 0) {
        enqueueSnackbar("No logs without raw upload", { variant: "info" });
        return;
      }
      await navigator.clipboard.writeText(logIds.join(", "));
      enqueueSnackbar(
        `Copied ${logIds.length} log ID${logIds.length === 1 ? "" : "s"} to clipboard`,
        { variant: "success" },
      );
    } catch (err) {
      console.error("Failed to copy log IDs:", err);
      enqueueSnackbar("Failed to copy log IDs", { variant: "error" });
    } finally {
      setCopyingLogIds(false);
    }
  };

  const downloadLogsWithoutRawIds = async () => {
    setCopyingLogIds(true);
    try {
      const logIds = await fetchLogIdsWithoutRaw({
        apiUrl: import.meta.env.VITE_API_URL,
        getAuthHeaders,
      });
      if (logIds.length === 0) {
        enqueueSnackbar("No logs without raw upload", { variant: "info" });
        return;
      }
      const blob = new Blob([logIds.join("\n")], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "logs-without-raw-ids.txt";
      anchor.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar(
        `Downloaded ${logIds.length} log ID${logIds.length === 1 ? "" : "s"}`,
        { variant: "success" },
      );
    } catch (err) {
      console.error("Failed to download log IDs:", err);
      enqueueSnackbar("Failed to download log IDs", { variant: "error" });
    } finally {
      setCopyingLogIds(false);
    }
  };

  const saveLogName = async () => {
    if (!loadedLog) {
      return;
    }

    setActionLoading("rename");
    try {
      const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      };
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/log/${loadedLog.id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ name: editedName.trim() || null }),
        },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      await refreshLoadedLog(loadedLog.id);
      setIsEditingName(false);
      enqueueSnackbar("Log renamed", { variant: "success" });
    } catch (err) {
      console.error("Failed to rename log:", err);
      enqueueSnackbar("Failed to rename log", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteLog = async () => {
    if (!loadedLog) {
      return;
    }

    if (
      !window.confirm(
        `Delete log "${loadedLog.name ?? loadedLog.id}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setActionLoading("delete");
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/log/${loadedLog.id}`,
        { method: "DELETE", headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      setLoadedLog(null);
      setLogIdInput("");
      enqueueSnackbar("Log deleted", { variant: "success" });
    } catch (err) {
      console.error("Failed to delete log:", err);
      enqueueSnackbar("Failed to delete log", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleEligible = async (eligible: boolean) => {
    if (!loadedLog) {
      return;
    }

    setActionLoading("eligible");
    try {
      const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      };
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/log/${loadedLog.id}/eligible`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ eligible }),
        },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      await refreshLoadedLog(loadedLog.id);
      enqueueSnackbar(
        eligible
          ? "Log marked leaderboard eligible"
          : "Log marked leaderboard ineligible",
        { variant: "success" },
      );
    } catch (err) {
      console.error("Failed to update eligibility:", err);
      enqueueSnackbar("Failed to update eligibility", { variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    void fetchReparseStatus();
    void fetchRestoreStatus();
    void fetchTotalLogCount();
    void fetchLogsWithoutRawCount();
  }, [
    fetchReparseStatus,
    fetchRestoreStatus,
    fetchTotalLogCount,
    fetchLogsWithoutRawCount,
    isAdmin,
  ]);

  useEffect(() => {
    if (!isAdmin || !reparseStatus) {
      return;
    }

    if (!isReparseJobActive(reparseStatus.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchReparseStatus();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [fetchReparseStatus, isAdmin, reparseStatus?.status]);

  useEffect(() => {
    if (!isAdmin || !restoreStatus) {
      return;
    }

    if (!isRestoreJobActive(restoreStatus.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchRestoreStatus();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [fetchRestoreStatus, isAdmin, restoreStatus?.status]);

  useEffect(() => {
    if (restoreStatus?.status === "completed" && restoreStatus.processed > 0) {
      void fetchLogsWithoutRawCount();
    }
  }, [
    fetchLogsWithoutRawCount,
    restoreStatus?.processed,
    restoreStatus?.status,
  ]);

  if (authLoading || adminLoading) {
    return (
      <Box
        sx={{
          ...contentColumnSx,
          display: "flex",
          justifyContent: "center",
          py: 6,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <Box sx={contentColumnSx}>
        <Alert severity="error">
          You do not have permission to view this page.
        </Alert>
      </Box>
    );
  }

  const reparsePercent =
    reparseStatus && reparseStatus.total > 0
      ? (reparseStatus.processed / reparseStatus.total) * 100
      : 0;

  const restorePercent =
    restoreStatus && restoreStatus.total > 0
      ? (restoreStatus.processed / restoreStatus.total) * 100
      : 0;

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
          <AdminPanelSettingsIcon
            sx={{ fontSize: 32, color: colors.upload.dragActive }}
          />
        </Box>
        <Typography
          variant="h4"
          sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
        >
          Admin
        </Typography>
      </Box>

      <SectionBox sx={adminSectionBoxSx}>
        <Typography sx={sectionTitleSx}>
          Reparse All Logs
          {totalLogCount != null && ` (${totalLogCount.toLocaleString()})`}
        </Typography>
        <Typography sx={sectionDescriptionSx}>
          Reprocess every stored log from its original raw upload. Progress
          updates automatically while a job is running.
        </Typography>

        <Box
          component="button"
          type="button"
          onClick={() => void startReparseAll()}
          disabled={
            reparseStarting ||
            (reparseStatus != null && isReparseJobActive(reparseStatus.status))
          }
          sx={warningButtonSx}
        >
          {reparseStarting ? (
            <CircularProgress size={24} sx={{ color: "inherit" }} />
          ) : (
            <>
              <WarningAmberIcon sx={{ fontSize: 20 }} />
              Start Reparse All
            </>
          )}
        </Box>

        {reparseStatus && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ ...detailTextSx, mb: 1 }}>
              Status:{" "}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {reparseStatus.status}
              </Box>
              {" · "}
              {reparseStatus.progress}
              {reparseStatus.currentLogId && (
                <>
                  {" · "}
                  Current:{" "}
                  <Link
                    component={RouterLink}
                    to={`/log/${reparseStatus.currentLogId}`}
                    sx={linkSx}
                  >
                    {reparseStatus.currentLogId}
                  </Link>
                </>
              )}
            </Typography>
            {reparseStatus.total > 0 && (
              <LinearProgress
                variant="determinate"
                value={reparsePercent}
                sx={progressBarSx}
              />
            )}
            <Typography sx={mutedDetailTextSx}>
              Succeeded: {reparseStatus.succeeded} · Failed:{" "}
              {reparseStatus.failed}
              {reparseStatus.startedAt &&
                ` · Started: ${new Date(reparseStatus.startedAt).toLocaleString()}`}
              {reparseStatus.completedAt &&
                ` · Completed: ${new Date(reparseStatus.completedAt).toLocaleString()}`}
            </Typography>
          </Box>
        )}
      </SectionBox>

      <SectionBox sx={adminSectionBoxSx}>
        <Typography sx={sectionTitleSx}>
          Export Parsed Data (No Raw Log)
          {logsWithoutRawCount != null &&
            ` (${logsWithoutRawCount.toLocaleString()})`}
        </Typography>
        <Typography sx={sectionDescriptionSx}>
          Back up parsed database and fight JSON before restoring raw logs.
          Individual downloads fetch one log at a time (10-minute timeout per
          log) and save separate files — recommended for large logs. The
          combined export merges everything into one JSON file and may fail in
          the browser.
        </Typography>

        <Box sx={actionRowSx}>
          <Box
            component="button"
            type="button"
            onClick={() => void downloadIndividualParsedExportsHandler()}
            disabled={
              parsedExportLoading ||
              logsWithoutRawCount === 0 ||
              logsWithoutRawCount == null
            }
            sx={primaryButtonSx}
          >
            {parsedExportLoading && parsedExportMode === "individual" ? (
              <CircularProgress size={24} sx={{ color: "inherit" }} />
            ) : (
              <>
                <DownloadIcon sx={{ fontSize: 20 }} />
                Download Individual Exports
              </>
            )}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => void downloadAllParsedExports()}
            disabled={
              parsedExportLoading ||
              logsWithoutRawCount === 0 ||
              logsWithoutRawCount == null
            }
            sx={secondaryButtonSx}
          >
            {parsedExportLoading && parsedExportMode === "combined" ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : (
              <>
                <DownloadIcon sx={{ fontSize: 20 }} />
                Download Combined Export
              </>
            )}
          </Box>
        </Box>

        {parsedExportProgress && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={detailTextSx}>
              Exporting log {parsedExportProgress.current} of{" "}
              {parsedExportProgress.total}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                (parsedExportProgress.current / parsedExportProgress.total) *
                100
              }
              sx={progressBarSx}
            />
            <Typography sx={mutedDetailTextSx}>
              Current: {parsedExportProgress.logId}
            </Typography>
          </Box>
        )}
      </SectionBox>

      <SectionBox sx={adminSectionBoxSx}>
        <Typography sx={sectionTitleSx}>
          Restore Raw Logs (No Raw Upload)
          {logsWithoutRawCount != null &&
            ` (${logsWithoutRawCount.toLocaleString()})`}
        </Typography>
        <Typography sx={sectionDescriptionSx}>
          Reconstruct raw combat logs from stored fight JSON and upload them to
          storage. Bulk restore processes logs one at a time (like reparse-all)
          and skips parity re-parsing for speed — use Preview Restore Raw on
          individual logs to check parity first.
        </Typography>

        <Box sx={actionRowSx}>
          <Box
            component="button"
            type="button"
            onClick={() => void startRestoreAll()}
            disabled={
              restoreStarting ||
              logsWithoutRawCount === 0 ||
              logsWithoutRawCount == null ||
              (restoreStatus != null &&
                isRestoreJobActive(restoreStatus.status))
            }
            sx={primaryButtonSx}
          >
            {restoreStarting ? (
              <CircularProgress size={24} sx={{ color: "inherit" }} />
            ) : (
              <>
                <RestorePageIcon sx={{ fontSize: 20 }} />
                Restore All Missing Raw Logs
              </>
            )}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => void copyLogsWithoutRawIds()}
            disabled={
              copyingLogIds ||
              logsWithoutRawCount === 0 ||
              logsWithoutRawCount == null
            }
            sx={secondaryButtonSx}
          >
            {copyingLogIds ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : (
              "Copy Log IDs"
            )}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => void downloadLogsWithoutRawIds()}
            disabled={
              copyingLogIds ||
              logsWithoutRawCount === 0 ||
              logsWithoutRawCount == null
            }
            sx={secondaryButtonSx}
          >
            <DownloadIcon sx={{ fontSize: 20 }} />
            Download ID List
          </Box>
        </Box>

        {restoreStatus && restoreStatus.status !== "idle" && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ ...detailTextSx, mb: 1 }}>
              Status:{" "}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {restoreStatus.status}
              </Box>
              {" · "}
              {restoreStatus.progress}
              {restoreStatus.currentLogId && (
                <>
                  {" · "}
                  Current:{" "}
                  <Link
                    component={RouterLink}
                    to={`/log/${restoreStatus.currentLogId}`}
                    sx={linkSx}
                  >
                    {restoreStatus.currentLogId}
                  </Link>
                </>
              )}
            </Typography>
            {restoreStatus.total > 0 && (
              <LinearProgress
                variant="determinate"
                value={restorePercent}
                sx={progressBarSx}
              />
            )}
            <Typography sx={mutedDetailTextSx}>
              Restored: {restoreStatus.restored} · Failed:{" "}
              {restoreStatus.failed}
              {" · "}
              Parity warnings: {restoreStatus.parityWarnings}
              {restoreStatus.startedAt &&
                ` · Started: ${new Date(restoreStatus.startedAt).toLocaleString()}`}
              {restoreStatus.completedAt &&
                ` · Completed: ${new Date(restoreStatus.completedAt).toLocaleString()}`}
            </Typography>
          </Box>
        )}
      </SectionBox>

      <SectionBox sx={adminSectionBoxSx}>
        <Typography sx={sectionTitleSx}>Reparse Logs</Typography>
        <Typography sx={sectionDescriptionSx}>
          Reprocess specific logs from their original raw uploads. Enter one or
          more log IDs separated by commas.
        </Typography>

        <Box sx={{ ...actionRowSx, mb: 0 }}>
          <TextField
            label="Log IDs"
            helperText="Comma-separated list of log UUIDs"
            value={bulkReparseInput}
            onChange={(event) => setBulkReparseInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void reparseBulkLogs();
              }
            }}
            size="small"
            fullWidth
            sx={textFieldSx}
          />
          <Box
            component="button"
            type="button"
            onClick={() => void reparseBulkLogs()}
            disabled={reparseActive || bulkReparseInput.trim().length === 0}
            sx={{ ...primaryButtonSx, minWidth: 120, flexShrink: 0 }}
          >
            {reparseProgress?.source === "bulk" ? (
              <CircularProgress size={24} sx={{ color: "inherit" }} />
            ) : (
              <>
                <RefreshIcon sx={{ fontSize: 20 }} />
                Reparse
              </>
            )}
          </Box>
        </Box>

        {reparseProgress?.source === "bulk" && (
          <ReparseProgressIndicator progress={reparseProgress.payload} />
        )}
      </SectionBox>

      <SectionBox sx={adminSectionBoxSx}>
        <Typography sx={sectionTitleSx}>Manage Log</Typography>
        <Typography sx={sectionDescriptionSx}>
          Look up a log by ID to download the raw upload, rename it, reparse it,
          delete it, or toggle leaderboard eligibility.
        </Typography>

        <Box sx={{ ...actionRowSx, mb: 2 }}>
          <TextField
            label="Log ID"
            value={logIdInput}
            onChange={(event) => setLogIdInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadLog();
              }
            }}
            size="small"
            sx={{ ...textFieldSx, minWidth: 320, flex: 1 }}
          />
          <Box
            component="button"
            type="button"
            onClick={() => void loadLog()}
            disabled={logLoading}
            sx={{ ...primaryButtonSx, minWidth: 120 }}
          >
            {logLoading ? (
              <CircularProgress size={24} sx={{ color: "inherit" }} />
            ) : (
              "Load Log"
            )}
          </Box>
        </Box>

        {logError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {logError}
          </Alert>
        )}

        {loadedLog && (
          <Box>
            <Typography sx={detailTextSx}>
              <Box component="span" sx={{ color: colors.text.muted }}>
                Name:
              </Box>{" "}
              {isEditingName ? (
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <TextField
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                    size="small"
                    sx={textFieldSx}
                  />
                  <IconButton
                    size="small"
                    onClick={() => void saveLogName()}
                    disabled={actionLoading === "rename"}
                    sx={{ color: colors.upload.dragActive }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(loadedLog.name ?? "");
                    }}
                    sx={{ color: colors.text.muted }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <>
                  {loadedLog.name ?? "(unnamed)"}
                  <IconButton
                    size="small"
                    onClick={() => setIsEditingName(true)}
                    sx={{ ml: 0.5, color: colors.text.muted }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Typography>

            <Typography sx={detailTextSx}>
              <Box component="span" sx={{ color: colors.text.muted }}>
                ID:
              </Box>{" "}
              <Link
                component={RouterLink}
                to={`/log/${loadedLog.id}`}
                sx={linkSx}
              >
                {loadedLog.id}
              </Link>
            </Typography>

            <Typography sx={detailTextSx}>
              <Box component="span" sx={{ color: colors.text.muted }}>
                Uploader:
              </Box>{" "}
              <Link
                component={RouterLink}
                to={`/logs/${loadedLog.uploaderId}`}
                sx={linkSx}
              >
                {displayUsername(loadedLog.uploaderId)}
              </Link>
            </Typography>

            <Typography sx={detailTextSx}>
              <Box component="span" sx={{ color: colors.text.muted }}>
                Uploaded:
              </Box>{" "}
              {format(new Date(loadedLog.uploadedAt), "PPpp")}
            </Typography>

            <Typography sx={detailTextSx}>
              <Box component="span" sx={{ color: colors.text.muted }}>
                Status:
              </Box>{" "}
              {loadedLog.saveStatus}
              {loadedLog.saveStatus === "saving" &&
                ` (${loadedLog.processingProgress}%)`}
            </Typography>

            <Typography sx={detailTextSx}>
              <Box component="span" sx={{ color: colors.text.muted }}>
                Encounters:
              </Box>{" "}
              {loadedLog._count.fights} fights, {loadedLog._count.fightGroups}{" "}
              groups
            </Typography>

            <Box sx={{ ...actionRowSx, mb: 2 }}>
              <Typography
                component="span"
                sx={{ color: colors.text.primary, fontWeight: 600 }}
              >
                Leaderboard eligible
              </Typography>
              <Switch
                checked={loadedLog.eligible}
                onChange={(event) => void toggleEligible(event.target.checked)}
                disabled={actionLoading === "eligible"}
                sx={switchSx}
              />
            </Box>

            <Box sx={actionRowSx}>
              <Box
                component="button"
                type="button"
                onClick={() => void reparseLoadedLog()}
                disabled={reparseActive || actionLoading === "reparse"}
                sx={secondaryButtonSx}
              >
                {reparseProgress?.source === "manage" ||
                actionLoading === "reparse" ? (
                  <CircularProgress size={20} sx={{ color: "inherit" }} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 20 }} />
                )}
                Reparse Log
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => void downloadParsedExport()}
                disabled={actionLoading === "parsed-export"}
                sx={secondaryButtonSx}
              >
                <DownloadIcon sx={{ fontSize: 20 }} />
                Download Parsed Export
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => void downloadRawLog()}
                disabled={actionLoading === "download"}
                sx={secondaryButtonSx}
              >
                <DownloadIcon sx={{ fontSize: 20 }} />
                Download Raw Log
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => void previewLoadedLogRestore()}
                disabled={actionLoading === "restore-preview"}
                sx={secondaryButtonSx}
              >
                {actionLoading === "restore-preview" ? (
                  <CircularProgress size={20} sx={{ color: "inherit" }} />
                ) : (
                  <RestorePageIcon sx={{ fontSize: 20 }} />
                )}
                Preview Restore Raw
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => void restoreLoadedLog()}
                disabled={actionLoading === "restore" || restorePreview == null}
                sx={secondaryButtonSx}
              >
                {actionLoading === "restore" ? (
                  <CircularProgress size={20} sx={{ color: "inherit" }} />
                ) : (
                  <RestorePageIcon sx={{ fontSize: 20 }} />
                )}
                Restore Raw Log
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => void deleteLog()}
                disabled={actionLoading === "delete"}
                sx={deleteButtonSx}
              >
                <DeleteIcon sx={{ fontSize: 20 }} />
                Delete Log
              </Box>
            </Box>

            {reparseProgress?.source === "manage" && (
              <ReparseProgressIndicator progress={reparseProgress.payload} />
            )}

            {restorePreview && restorePreview.logId === loadedLog.id && (
              <Box sx={{ mt: 2 }}>
                <Alert
                  severity={
                    restorePreview.parityReport.passed ? "success" : "warning"
                  }
                  sx={{ mb: 1 }}
                >
                  {formatParitySummary(restorePreview.parityReport)} ·{" "}
                  {restorePreview.lineCount.toLocaleString()} lines ·{" "}
                  {(restorePreview.byteSize / 1024).toFixed(1)} KB
                  {restorePreview.uploaded ? " · uploaded" : " · preview only"}
                </Alert>
                {restorePreview.parityReport.diffs.length > 0 && (
                  <Box
                    component="pre"
                    sx={{
                      ...mutedDetailTextSx,
                      maxHeight: 240,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      backgroundColor: colors.background.surface,
                      borderRadius: 1,
                      p: 1.5,
                      border: `1px solid ${colors.border.default}`,
                    }}
                  >
                    {restorePreview.parityReport.diffs
                      .map(
                        (diff) =>
                          `[${diff.category}${diff.documented ? ", documented" : ""}] ${diff.message}`,
                      )
                      .join("\n")}
                  </Box>
                )}
                {restorePreview.sampleLines.length > 0 && (
                  <Box
                    component="pre"
                    sx={{
                      ...mutedDetailTextSx,
                      mt: 1,
                      maxHeight: 160,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      backgroundColor: colors.background.surface,
                      borderRadius: 1,
                      p: 1.5,
                      border: `1px solid ${colors.border.default}`,
                    }}
                  >
                    {restorePreview.sampleLines.join("\n")}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </SectionBox>
    </Box>
  );
};

export default Admin;
