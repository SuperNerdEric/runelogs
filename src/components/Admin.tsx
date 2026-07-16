import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Link,
  Pagination,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useSnackbar } from "notistack";
import { format } from "date-fns";
import SectionBox from "./SectionBox";
import AdminRecentLogs from "./AdminRecentLogs";
import LogNameDisplay from "./LogNameDisplay";
import ReparseProgressIndicator from "./ReparseProgressIndicator";
import TableColumnHeaderTooltip from "./TableColumnHeaderTooltip";
import { useIsAdmin } from "../hooks/useIsAdmin";
import {
  colors,
  contentColumnSx,
  fontSizes,
  fonts,
  logNameTextSx,
  media,
} from "../theme";
import type { ReparseProgressPayload } from "../utils/reparseProgress";
import {
  createInitialReparseProgress,
  streamLogReparse,
} from "../utils/streamLogReparse";
import { usernameToPathSegment } from "../utils/utils";
import { logTableRowProps, stopRowClick } from "../utils/encounterTableRow";
import { usePageMeta } from "../hooks/usePageMeta";
import { ADMIN_PAGE_META } from "../utils/encounterPageMeta";

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
  jobId?: string;
}

interface TestReparseResultRow {
  logId: string;
  name: string | null;
  uploadedAt: string | null;
  lastParsedAt: string | null;
  uploaderId: string | null;
  status: string;
  encounterChurn: number | null;
  changedLineCount: number | null;
  error: string | null;
}

interface TestReparseJobStatus {
  jobId?: string;
  status: "idle" | "started" | "in_progress" | "completed" | "failed";
  total?: number;
  processed?: number;
  succeeded?: number;
  failed?: number;
  progress?: string;
  startedAt?: string;
  completedAt?: string;
  currentLogId?: string;
  resultS3Key?: string | null;
  error?: string | null;
  resultsPage?: number;
  resultsPageSize?: number;
  resultsTotal?: number;
  results?: TestReparseResultRow[];
}

const TEST_REPARSE_ALL_PAGE_SIZE = 20;

interface LogStatusResponse {
  id: string;
  name: string | null;
  uploaderId: string;
  uploadedAt: string;
  lastParsedAt: string;
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

const bulkReparseInsetSx = {
  px: { xs: 2.25, md: 3 },
} as const;

const bulkReparseSectionHeaderSx = {
  ...bulkReparseInsetSx,
  py: 1.5,
} as const;

const bulkReparseExpandHeaderSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  p: 0,
  m: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: fonts.body,
  color: colors.text.primary,
  "&:hover .admin-bulk-reparse-title": {
    color: colors.text.link,
  },
} as const;

const bulkReparseTitleSx = {
  color: colors.text.primary,
  fontWeight: 600,
  fontSize: fontSizes.lg,
  m: 0,
} as const;

const bulkReparseBodySx = {
  ...bulkReparseInsetSx,
  pb: { xs: 2.25, md: 3 },
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

const subsectionTitleSx = {
  color: colors.text.primary,
  fontWeight: 600,
  fontSize: fontSizes.base,
  mb: 1,
} as const;

const resultsExpandHeaderSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  p: 0,
  m: 0,
  mt: 1.5,
  mb: 1.5,
  border: "none",
  background: "none",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: fonts.body,
  color: colors.text.primary,
  "&:hover": {
    color: colors.text.link,
  },
} as const;

const resultsTableContainerSx = {
  width: "100%",
  maxWidth: "none",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  margin: 0,
  borderTop: `1px solid ${colors.border.default}`,
  "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root": {
    borderBottom: "none",
  },
} as const;

const resultsPaginationWrapSx = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  px: { xs: 2.25, md: 3 },
  py: 1,
} as const;

const resultsNameColumnSx = {
  color: "white",
  width: "100%",
  maxWidth: 0,
  overflow: "hidden",
} as const;

const resultsShrinkColumnSx = {
  color: "white",
  whiteSpace: "nowrap",
} as const;

const resultsTableCellPaddingSx = {
  paddingY: 1,
  [media.mobileDown]: { px: 1 },
} as const;

const resultsPaginationSx = {
  "& .MuiPagination-ul": { margin: 0, padding: 0 },
  "& .MuiPaginationItem-root": { color: "white" },
  "& .MuiPaginationItem-root.Mui-selected": {
    backgroundColor: "white",
    color: "black",
    borderRadius: "4px",
  },
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

function formatJobDateTime(value: string): string {
  return format(new Date(value), "PPp");
}

const Admin: React.FC = () => {
  usePageMeta(ADMIN_PAGE_META);

  const navigate = useNavigate();
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
  const [reparseStarting, setReparseStarting] = useState(false);

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

  const [testReparseAllStatus, setTestReparseAllStatus] =
    useState<TestReparseJobStatus | null>(null);
  const [testReparseAllStarting, setTestReparseAllStarting] = useState(false);
  const [testReparseAllResultsPage, setTestReparseAllResultsPage] = useState(1);
  const [bulkReparseExpanded, setBulkReparseExpanded] = useState(false);
  const [testReparseAllResultsExpanded, setTestReparseAllResultsExpanded] =
    useState(false);
  const [testReparseJob, setTestReparseJob] =
    useState<TestReparseJobStatus | null>(null);
  const [testReparseStarting, setTestReparseStarting] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const token = await getAccessTokenSilently();
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [getAccessTokenSilently]);

  const fetchTestReparseAllStatus = useCallback(
    async (page = testReparseAllResultsPage) => {
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({
          page: String(page),
          limit: String(TEST_REPARSE_ALL_PAGE_SIZE),
        });
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/test-reparse-all/status?${params}`,
          { headers },
        );
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data = (await response.json()) as TestReparseJobStatus;
        setTestReparseAllStatus(data);
        if (data.resultsPage != null) {
          setTestReparseAllResultsPage(data.resultsPage);
        }
      } catch (err) {
        console.error("Failed to fetch test-reparse-all status:", err);
      }
    },
    [getAuthHeaders, testReparseAllResultsPage],
  );

  const startTestReparseAll = async () => {
    if (
      !window.confirm(
        "Run test reparse on all logs? This parses without saving and ranks logs by how much their summaries would change.",
      )
    ) {
      return;
    }

    setTestReparseAllStarting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/test-reparse-all`,
        { method: "POST", headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as { jobId: string };
      enqueueSnackbar("Test reparse-all job started", { variant: "success" });
      setTestReparseAllResultsPage(1);
      if (data.jobId) {
        const params = new URLSearchParams({
          page: "1",
          limit: String(TEST_REPARSE_ALL_PAGE_SIZE),
        });
        const statusResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/test-reparse-all/${data.jobId}?${params}`,
          { headers },
        );
        if (statusResponse.ok) {
          setTestReparseAllStatus(
            (await statusResponse.json()) as TestReparseJobStatus,
          );
        }
      } else {
        await fetchTestReparseAllStatus(1);
      }
    } catch (err) {
      console.error("Failed to start test-reparse-all:", err);
      enqueueSnackbar("Failed to start test-reparse-all job", {
        variant: "error",
      });
    } finally {
      setTestReparseAllStarting(false);
    }
  };

  const startSingleTestReparse = async (logId: string) => {
    setTestReparseStarting(true);
    setTestReparseJob(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/test-reparse`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logId }),
        },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as { jobId: string };
      enqueueSnackbar("Test reparse started", { variant: "info" });

      for (let attempt = 0; attempt < 1800; attempt++) {
        const statusResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/test-reparse/${data.jobId}`,
          { headers },
        );
        if (!statusResponse.ok) {
          throw new Error(`Server returned ${statusResponse.status}`);
        }
        const status = (await statusResponse.json()) as TestReparseJobStatus;
        setTestReparseJob(status);
        if (status.status === "completed" || status.status === "failed") {
          enqueueSnackbar(
            status.status === "completed"
              ? "Test reparse finished"
              : "Test reparse failed",
            { variant: status.status === "completed" ? "success" : "error" },
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error("Failed to run test reparse:", err);
      enqueueSnackbar("Failed to run test reparse", { variant: "error" });
    } finally {
      setTestReparseStarting(false);
    }
  };

  const downloadTestReparseZip = async (jobId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/test-reparse/${jobId}/download`,
        { headers },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `test-reparse-${jobId}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download test reparse zip:", err);
      enqueueSnackbar("Failed to download test reparse zip", {
        variant: "error",
      });
    }
  };

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
    setIsEditingName(false);
    setTestReparseJob(null);

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

  const enqueueFinalReconcile = async () => {
    if (!loadedLog) {
      return;
    }

    const confirmed = window.confirm(
      `Retry stuck live log "${loadedLog.name ?? loadedLog.id}"?\n\n` +
        "Use this when a live log is stuck finalizing. " +
        "The worker will try to finish remaining chunks, compact the raw log, and mark the session complete.",
    );
    if (!confirmed) {
      return;
    }

    setActionLoading("final-reconcile");
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/log/${loadedLog.id}/final-reconcile`,
        {
          method: "POST",
          headers,
        },
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = (await response.json()) as {
        message?: string;
        liveLogState?: string | null;
        lastParsedSeq?: number;
        maxSeq?: number;
      };
      enqueueSnackbar(
        `${data.message ?? "Retry stuck live log started"}` +
          (data.lastParsedSeq != null && data.maxSeq != null
            ? ` (parsed ${data.lastParsedSeq}/${data.maxSeq}, state=${data.liveLogState ?? "?"})`
            : ""),
        { variant: "success" },
      );
    } catch (err) {
      console.error("Failed to retry stuck live log:", err);
      enqueueSnackbar("Failed to retry stuck live log", {
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    void fetchReparseStatus();
    void fetchTestReparseAllStatus();
  }, [fetchReparseStatus, fetchTestReparseAllStatus, isAdmin]);

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
    if (!isAdmin || !testReparseAllStatus) {
      return;
    }
    if (!isReparseJobActive(testReparseAllStatus.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchTestReparseAllStatus(testReparseAllResultsPage);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [
    fetchTestReparseAllStatus,
    isAdmin,
    testReparseAllResultsPage,
    testReparseAllStatus?.status,
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
    return <Navigate to="/login" replace state={{ from: "/admin" }} />;
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
  const testReparseAllPercent =
    testReparseAllStatus &&
    (testReparseAllStatus.total ?? 0) > 0 &&
    testReparseAllStatus.processed != null
      ? (testReparseAllStatus.processed / testReparseAllStatus.total!) * 100
      : 0;
  const testReparseAllResultsTotal = testReparseAllStatus?.resultsTotal ?? 0;
  const testReparseAllPageCount = Math.max(
    1,
    Math.ceil(testReparseAllResultsTotal / TEST_REPARSE_ALL_PAGE_SIZE),
  );
  const manageReparsePercent = reparseProgress?.payload.progress ?? 0;
  const manageTestReparsePercent =
    testReparseJob &&
    (testReparseJob.total ?? 0) > 0 &&
    testReparseJob.processed != null
      ? (testReparseJob.processed / testReparseJob.total!) * 100
      : testReparseJob?.status === "completed"
        ? 100
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

      <SectionBox sx={{ ...adminSectionBoxSx, p: 0, overflow: "hidden" }}>
        <AdminRecentLogs getAuthHeaders={getAuthHeaders} />
      </SectionBox>

      <SectionBox sx={{ ...adminSectionBoxSx, p: 0, overflow: "hidden" }}>
        <Box sx={bulkReparseSectionHeaderSx}>
          <Box
            component="button"
            type="button"
            aria-expanded={bulkReparseExpanded}
            onClick={() => setBulkReparseExpanded((open) => !open)}
            sx={bulkReparseExpandHeaderSx}
          >
            <ExpandMoreIcon
              sx={{
                color: colors.text.muted,
                transform: bulkReparseExpanded
                  ? "rotate(0deg)"
                  : "rotate(-90deg)",
                transition: "transform 0.2s ease",
              }}
            />
            <Typography
              className="admin-bulk-reparse-title"
              sx={bulkReparseTitleSx}
            >
              Bulk Reparse
            </Typography>
          </Box>
        </Box>

        <Collapse
          in={bulkReparseExpanded}
          unmountOnExit={false}
          sx={{ width: "100%" }}
        >
          <Box
            sx={{
              ...bulkReparseBodySx,
              pb: testReparseAllResultsExpanded ? 0 : bulkReparseBodySx.pb,
            }}
          >
            <Typography sx={sectionDescriptionSx}>
              Reparse every stored log, or run a dry-run test reparse that ranks
              logs by encounter churn and changed line count without saving.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={subsectionTitleSx}>Reparse All</Typography>
              <Box
                component="button"
                type="button"
                onClick={() => void startReparseAll()}
                disabled={
                  reparseStarting ||
                  (reparseStatus != null &&
                    isReparseJobActive(reparseStatus.status))
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
                      ` · Started: ${formatJobDateTime(reparseStatus.startedAt)}`}
                    {reparseStatus.completedAt &&
                      ` · Completed: ${formatJobDateTime(reparseStatus.completedAt)}`}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box>
              <Typography sx={subsectionTitleSx}>Test Reparse All</Typography>
              <Box
                component="button"
                type="button"
                onClick={() => void startTestReparseAll()}
                disabled={
                  testReparseAllStarting ||
                  (testReparseAllStatus != null &&
                    isReparseJobActive(testReparseAllStatus.status))
                }
                sx={primaryButtonSx}
              >
                {testReparseAllStarting ? (
                  <CircularProgress size={24} sx={{ color: "inherit" }} />
                ) : (
                  "Start Test Reparse All"
                )}
              </Box>

              {testReparseAllStatus == null ||
              testReparseAllStatus.status === "idle" ? (
                <Typography sx={{ ...mutedDetailTextSx, mt: 2 }}>
                  Last run: Never run
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ ...detailTextSx, mb: 1 }}>
                    Status:{" "}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {testReparseAllStatus.status}
                    </Box>
                    {testReparseAllStatus.progress &&
                      ` · ${testReparseAllStatus.progress}`}
                    {testReparseAllStatus.currentLogId && (
                      <>
                        {" · "}
                        Current:{" "}
                        <Link
                          component={RouterLink}
                          to={`/log/${testReparseAllStatus.currentLogId}`}
                          sx={linkSx}
                        >
                          {testReparseAllStatus.currentLogId}
                        </Link>
                      </>
                    )}
                  </Typography>
                  {(testReparseAllStatus.total ?? 0) > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={testReparseAllPercent}
                      sx={progressBarSx}
                    />
                  )}
                  <Typography sx={mutedDetailTextSx}>
                    Succeeded: {testReparseAllStatus.succeeded ?? 0} · Failed:{" "}
                    {testReparseAllStatus.failed ?? 0}
                    {testReparseAllStatus.startedAt &&
                      ` · Started: ${formatJobDateTime(testReparseAllStatus.startedAt)}`}
                    {testReparseAllStatus.completedAt &&
                      ` · Completed: ${formatJobDateTime(testReparseAllStatus.completedAt)}`}
                    {!testReparseAllStatus.startedAt &&
                      !testReparseAllStatus.completedAt &&
                      " · Last run: Never run"}
                  </Typography>

                  {testReparseAllResultsTotal > 0 && (
                    <Box
                      component="button"
                      type="button"
                      onClick={() =>
                        setTestReparseAllResultsExpanded((open) => !open)
                      }
                      sx={resultsExpandHeaderSx}
                      aria-expanded={testReparseAllResultsExpanded}
                    >
                      <ExpandMoreIcon
                        sx={{
                          color: colors.text.muted,
                          transform: testReparseAllResultsExpanded
                            ? "rotate(0deg)"
                            : "rotate(-90deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                      <Typography
                        sx={{ fontWeight: 600, fontSize: fontSizes.sm }}
                      >
                        Results ({testReparseAllResultsTotal.toLocaleString()})
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {testReparseAllResultsTotal > 0 && (
            <Collapse
              in={testReparseAllResultsExpanded}
              unmountOnExit={false}
              sx={{ width: "100%" }}
            >
              <TableContainer sx={resultsTableContainerSx}>
                <Table sx={{ tableLayout: "auto", width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={resultsNameColumnSx}>
                        <strong>Name</strong>
                      </TableCell>
                      <TableCell sx={resultsShrinkColumnSx}>
                        <strong>Uploader</strong>
                      </TableCell>
                      <TableCell sx={resultsShrinkColumnSx}>
                        <strong>Uploaded</strong>
                      </TableCell>
                      <TableCell sx={resultsShrinkColumnSx}>
                        <strong>Parsed</strong>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...resultsShrinkColumnSx,
                          [media.mobileDown]: { display: "none" },
                        }}
                      >
                        <strong>
                          <TableColumnHeaderTooltip
                            label="Churn"
                            tooltip="How many encounters would be added or removed by a reparse"
                          />
                        </strong>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...resultsShrinkColumnSx,
                          [media.mobileDown]: { display: "none" },
                        }}
                      >
                        <strong>
                          <TableColumnHeaderTooltip
                            label="Lines"
                            tooltip="How many lines differ between the before and after reparse summaries"
                          />
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(testReparseAllStatus?.results ?? []).map((row) => (
                      <TableRow
                        key={row.logId}
                        {...logTableRowProps(navigate, row.logId)}
                      >
                        <TableCell
                          sx={{
                            ...resultsNameColumnSx,
                            ...resultsTableCellPaddingSx,
                          }}
                        >
                          <Link
                            component={RouterLink}
                            to={`/log/${row.logId}`}
                            onClick={stopRowClick}
                            underline="hover"
                            sx={{
                              display: "inline-flex",
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <LogNameDisplay
                              name={row.name}
                              isLive={false}
                              fallback={row.logId}
                              sx={{
                                ...logNameTextSx(!!row.name),
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            />
                          </Link>
                        </TableCell>
                        <TableCell
                          sx={{
                            ...resultsShrinkColumnSx,
                            ...resultsTableCellPaddingSx,
                          }}
                        >
                          {row.uploaderId ? (
                            <Link
                              component={RouterLink}
                              to={`/logs/${encodeURIComponent(usernameToPathSegment(row.uploaderId))}`}
                              onClick={stopRowClick}
                              underline="hover"
                            >
                              {row.uploaderId}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...resultsShrinkColumnSx,
                            ...resultsTableCellPaddingSx,
                          }}
                        >
                          {row.uploadedAt
                            ? format(new Date(row.uploadedAt), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...resultsShrinkColumnSx,
                            ...resultsTableCellPaddingSx,
                          }}
                        >
                          {row.lastParsedAt
                            ? format(new Date(row.lastParsedAt), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            ...resultsShrinkColumnSx,
                            ...resultsTableCellPaddingSx,
                            [media.mobileDown]: { display: "none" },
                          }}
                        >
                          {row.encounterChurn ?? "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            ...resultsShrinkColumnSx,
                            ...resultsTableCellPaddingSx,
                            [media.mobileDown]: { display: "none" },
                          }}
                        >
                          {row.changedLineCount ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {testReparseAllPageCount > 1 && (
                <Box sx={resultsPaginationWrapSx}>
                  <Pagination
                    count={testReparseAllPageCount}
                    page={testReparseAllResultsPage}
                    onChange={(_event, page) => {
                      setTestReparseAllResultsPage(page);
                      void fetchTestReparseAllStatus(page);
                    }}
                    sx={resultsPaginationSx}
                  />
                </Box>
              )}
            </Collapse>
          )}
        </Collapse>
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
          delete it, toggle leaderboard eligibility, or retry a stuck live log.
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
                to={`/logs/${encodeURIComponent(usernameToPathSegment(loadedLog.uploaderId))}`}
                sx={linkSx}
              >
                {loadedLog.uploaderId}
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
                Last parsed:
              </Box>{" "}
              {format(new Date(loadedLog.lastParsedAt), "PPpp")}
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
                onClick={() => void startSingleTestReparse(loadedLog.id)}
                disabled={testReparseStarting}
                sx={secondaryButtonSx}
              >
                {testReparseStarting ? (
                  <CircularProgress size={20} sx={{ color: "inherit" }} />
                ) : (
                  <SyncIcon sx={{ fontSize: 20 }} />
                )}
                Test Reparse
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
                onClick={() => void enqueueFinalReconcile()}
                disabled={actionLoading === "final-reconcile"}
                sx={secondaryButtonSx}
              >
                {actionLoading === "final-reconcile" ? (
                  <CircularProgress size={20} sx={{ color: "inherit" }} />
                ) : (
                  <SyncIcon sx={{ fontSize: 20 }} />
                )}
                Retry Stuck Live Log
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
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ ...detailTextSx, mb: 1 }}>
                  Reparse:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {reparseProgress.payload.phaseLabel ??
                      reparseProgress.payload.phase ??
                      "in progress"}
                  </Box>
                  {reparseProgress.payload.logTotal != null && (
                    <>
                      {" · "}
                      {reparseProgress.payload.logIndex ?? 0}/
                      {reparseProgress.payload.logTotal}
                    </>
                  )}
                  {reparseProgress.payload.logId && (
                    <>
                      {" · "}
                      Current:{" "}
                      <Link
                        component={RouterLink}
                        to={`/log/${reparseProgress.payload.logId}`}
                        sx={linkSx}
                      >
                        {reparseProgress.payload.logId}
                      </Link>
                    </>
                  )}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={manageReparsePercent}
                  sx={progressBarSx}
                />
              </Box>
            )}

            {(testReparseStarting || testReparseJob) && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ ...detailTextSx, mb: 1 }}>
                  Test reparse:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {testReparseJob?.status ?? "started"}
                  </Box>
                  {testReparseJob?.progress && ` · ${testReparseJob.progress}`}
                  {testReparseJob?.results?.[0] &&
                    ` · churn ${testReparseJob.results[0].encounterChurn ?? "—"} · lines ${testReparseJob.results[0].changedLineCount ?? "—"}`}
                </Typography>
                {(testReparseStarting || testReparseJob) && (
                  <LinearProgress
                    variant={
                      (testReparseJob?.total ?? 0) > 0 ||
                      testReparseJob?.status === "completed"
                        ? "determinate"
                        : "indeterminate"
                    }
                    value={manageTestReparsePercent}
                    sx={progressBarSx}
                  />
                )}
                <Typography sx={mutedDetailTextSx}>
                  {testReparseJob?.startedAt
                    ? `Started: ${formatJobDateTime(testReparseJob.startedAt)}`
                    : null}
                  {testReparseJob?.completedAt
                    ? `${testReparseJob.startedAt ? " · " : ""}Completed: ${formatJobDateTime(testReparseJob.completedAt)}`
                    : null}
                  {!testReparseJob?.startedAt &&
                    !testReparseJob?.completedAt &&
                    testReparseStarting &&
                    "Running…"}
                </Typography>
                {testReparseJob?.status === "completed" &&
                  testReparseJob.jobId &&
                  testReparseJob.resultS3Key && (
                    <Box
                      component="button"
                      type="button"
                      onClick={() =>
                        void downloadTestReparseZip(testReparseJob.jobId!)
                      }
                      sx={{ ...secondaryButtonSx, mt: 1.5 }}
                    >
                      <DownloadIcon sx={{ fontSize: 18 }} />
                      Download Reparse Zip
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
