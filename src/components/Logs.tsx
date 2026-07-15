import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Box,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { format } from "date-fns";
import { useAuth0 } from "@auth0/auth0-react";
import { closeSnackbar, SnackbarKey, useSnackbar } from "notistack";
import { colors, contentColumnSx, logNameTextSx, media } from "../theme";
import LogNameDisplay from "./LogNameDisplay";
import LiveLogIndicator from "./LiveLogIndicator";
import { formatDisplayUsername, usernamesEqual } from "../utils/utils";
import { buildProfileHref } from "../utils/profile";
import { logTableRowProps, stopRowClick } from "../utils/encounterTableRow";
import {
  pageHeaderContainerSx,
  pageHeaderIconBoxSx,
  pageHeaderSubtitleSx,
  pageHeaderTitleTypographySx,
  pageHeaderTitleWrapperSx,
} from "./pageHeaderStyles";
import UploaderNameLink from "./UploaderNameLink";
import FilterSelect from "./filters/FilterSelect";
import FilterToolbar from "./filters/FilterToolbar";
import { filterFieldCompactSx } from "./filters/filterStyles";
import { mapContentFilterOptions } from "../utils/contentFilterOptions";
import { usePageMeta } from "../hooks/usePageMeta";
import { getUploaderLogsPageMeta } from "../utils/encounterPageMeta";
import {
  isLiveLogPending,
  isLiveLogSessionOpen,
  type LiveLogState,
} from "../utils/liveLogState";
import {
  BROWSE_ANY_PLAYER_COUNT,
  BrowsePlayerCount,
  buildBrowsePlayerCountOptions,
  buildUploaderLogsHref,
  browsePlayerCountToApiParam,
  isRecentEncountersAllContent,
  RECENT_ENCOUNTERS_CONTENT_OPTIONS,
  RecentEncountersContentOption,
  resolveBrowsePlayerCount,
  resolveRecentEncountersContent,
} from "../utils/leaderboardContent";

interface LogItem {
  id: string;
  name: string | null;
  uploadedAt: string;
  eligible: boolean;
  liveLogState?: LiveLogState;
  receivingData?: boolean;
  saveStatus?: "saving" | "complete" | "failed";
  processingProgress?: number;
  _count: {
    fights: number;
    fightGroups: number;
  };
}

function isParsingLog(log: LogItem): boolean {
  return log.saveStatus === "saving";
}

interface LogStatusResponse {
  id: string;
  name: string | null;
  eligible: boolean;
  liveLogState: LiveLogState;
  receivingData: boolean;
  saveStatus: "saving" | "complete" | "failed";
  processingProgress: number;
  _count: {
    fights: number;
    fightGroups: number;
  };
}

interface LogsResponse {
  logs: LogItem[];
  uploaderId?: string;
}

async function fetchLogStatus(
  logId: string,
): Promise<LogStatusResponse | null> {
  const resp = await fetch(
    `${import.meta.env.VITE_API_URL}/log/${logId}/status`,
  );
  if (resp.status === 404) {
    return null;
  }
  if (!resp.ok) {
    throw new Error(`Server returned ${resp.status}`);
  }
  return resp.json() as Promise<LogStatusResponse>;
}

// Define the possible columns to sort by
type SortKey = "name" | "uploadedAt" | "fights" | "fightGroups";

// Direction type
type Order = "asc" | "desc";

const nameColumnSx = {
  color: "white",
  width: "100%",
  maxWidth: 0,
  overflow: "hidden",
} as const;

const shrinkColumnSx = {
  color: "white",
  whiteSpace: "nowrap",
} as const;

const tableCellPaddingSx = {
  paddingY: 1,
  [media.mobileDown]: { px: 1 },
} as const;

const tableStatusCellSx = {
  py: 4,
  color: "white",
  borderBottom: "none",
} as const;

const logsTableColumnCount = (canEdit: boolean) => (canEdit ? 5 : 4);

const pageContainerSx = {
  ...contentColumnSx,
  mt: 2,
  px: 2,
  pb: 4,
  [media.mobileDown]: { px: 1 },
} as const;

function toSearchParams(
  uploaderId: string,
  content: RecentEncountersContentOption,
  playerCount: BrowsePlayerCount,
): Record<string, string> {
  return Object.fromEntries(
    new URLSearchParams(
      buildUploaderLogsHref(uploaderId, {
        content: content.value,
        playerCount: isRecentEncountersAllContent(content.value)
          ? undefined
          : browsePlayerCountToApiParam(playerCount),
      }).split("?")[1] ?? "",
    ),
  );
}

const getComparator = (order: Order, orderBy: SortKey) => {
  return (a: LogItem, b: LogItem) => {
    let valA: number | string = "";
    let valB: number | string = "";

    switch (orderBy) {
      case "name":
        valA = a.name ?? "";
        valB = b.name ?? "";
        break;
      case "uploadedAt":
        valA = new Date(a.uploadedAt).getTime();
        valB = new Date(b.uploadedAt).getTime();
        break;
      case "fights":
        valA = a._count.fights;
        valB = b._count.fights;
        break;
      case "fightGroups":
        valA = a._count.fightGroups;
        valB = b._count.fightGroups;
        break;
    }

    if (valA < valB) {
      return order === "asc" ? -1 : 1;
    }
    if (valA > valB) {
      return order === "asc" ? 1 : -1;
    }
    return 0;
  };
};

interface LogNameCellProps {
  log: LogItem;
  canEdit: boolean;
  onRename: (logId: string, name: string) => Promise<void>;
}

const LogNameCell: React.FC<LogNameCellProps> = ({
  log,
  canEdit,
  onRename,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(log.name ?? "");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraft(log.name ?? "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(log.name ?? "");
    setEditing(false);
  };

  const saveEditing = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onRename(log.id, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        width="100%"
        onClick={stopRowClick}
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
    );
  }

  return (
    <Box display="flex" alignItems="center" width="100%" gap={1}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Link
          component={RouterLink}
          to={`/log/${log.id}`}
          onClick={stopRowClick}
          underline="hover"
          sx={{
            display: "inline-flex",
            alignItems: "baseline",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <LogNameDisplay
            name={log.name}
            isLive={isLiveLogSessionOpen(log.liveLogState)}
            sx={{
              ...logNameTextSx(!!log.name),
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          />
        </Link>
        <LiveLogIndicator liveLogState={log.liveLogState} />
      </Box>
      {canEdit && (
        <IconButton
          aria-label="edit log name"
          size="small"
          onClick={(e) => {
            stopRowClick(e);
            startEditing();
          }}
          sx={{ flexShrink: 0, ml: "auto" }}
        >
          <EditIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />
        </IconButton>
      )}
    </Box>
  );
};

interface LogsPageHeaderProps {
  uploaderId?: string;
}

const LogsPageHeader: React.FC<LogsPageHeaderProps> = ({ uploaderId }) => (
  <Box sx={pageHeaderContainerSx}>
    <Box sx={pageHeaderIconBoxSx}>
      <FolderOpenOutlinedIcon
        sx={{ fontSize: 32, color: colors.upload.dragActive }}
      />
    </Box>
    <Box>
      {uploaderId ? (
        <UploaderNameLink
          uploaderId={uploaderId}
          to={buildProfileHref(uploaderId)}
          variant="h4"
          sx={pageHeaderTitleWrapperSx}
          typographySx={pageHeaderTitleTypographySx}
        />
      ) : (
        <Typography
          component="span"
          variant="h4"
          sx={{ ...pageHeaderTitleWrapperSx, ...pageHeaderTitleTypographySx }}
        >
          Unknown User
        </Typography>
      )}
      <Typography sx={pageHeaderSubtitleSx}>Uploaded logs</Typography>
    </Box>
  </Box>
);

const Logs: React.FC = () => {
  const { uploaderId } = useParams<{ uploaderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, getAccessTokenSilently } = useAuth0();
  const { enqueueSnackbar } = useSnackbar();

  const contentParam = searchParams.get("content");
  const playerCountParam = searchParams.get("playerCount");
  const initialContent = resolveRecentEncountersContent(contentParam);
  const initialPlayerCount = resolveBrowsePlayerCount(
    initialContent,
    playerCountParam,
  );

  const [content, setContent] = useState(initialContent);
  const [playerCount, setPlayerCount] = useState(initialPlayerCount);
  const [logs, setLogs] = useState<LogItem[] | null>(null);
  const [apiUploaderId, setApiUploaderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting state
  const [orderBy, setOrderBy] = useState<SortKey>("uploadedAt");
  const [order, setOrder] = useState<Order>("desc");
  const canEditLogs = usernamesEqual(user?.username, uploaderId);
  const isAllContent = isRecentEncountersAllContent(content.value);

  useEffect(() => {
    const newContent = resolveRecentEncountersContent(
      searchParams.get("content"),
    );
    const newPlayerCount = resolveBrowsePlayerCount(
      newContent,
      searchParams.get("playerCount"),
    );

    setContent(newContent);
    setPlayerCount(newPlayerCount);
  }, [searchParams]);

  const updateSearchParams = (updates: {
    content?: RecentEncountersContentOption;
    playerCount?: BrowsePlayerCount;
  }) => {
    if (!uploaderId) {
      return;
    }

    const nextContent = updates.content ?? content;
    const nextPlayerCount = updates.playerCount ?? playerCount;
    setSearchParams(toSearchParams(uploaderId, nextContent, nextPlayerCount));
  };

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

  const fetchLogs = useCallback(async () => {
    if (!uploaderId) {
      setError("No uploader ID provided in URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!isRecentEncountersAllContent(content.value)) {
        params.set("content", content.value);
        const apiPlayerCount = browsePlayerCountToApiParam(playerCount);
        if (apiPlayerCount != null) {
          params.set("playerCount", String(apiPlayerCount));
        }
      }

      const query = params.toString();
      const url = `${import.meta.env.VITE_API_URL}/logs/${uploaderId}${query ? `?${query}` : ""}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }
      const data: LogsResponse = await resp.json();
      setLogs(data.logs);
      if (data.uploaderId) {
        setApiUploaderId(data.uploaderId);
      }
    } catch (err: any) {
      console.error("Failed to fetch logs:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [content.value, playerCount, uploaderId]);

  const parsingLogIds = useMemo(
    () => logs?.filter(isParsingLog).map((log) => log.id) ?? [],
    [logs],
  );

  const liveLogIds = useMemo(
    () =>
      logs
        ?.filter((log) => isLiveLogPending(log.liveLogState))
        .map((log) => log.id) ?? [],
    [logs],
  );

  const statusPollingLogIds = useMemo(
    () => [...new Set([...parsingLogIds, ...liveLogIds])],
    [parsingLogIds, liveLogIds],
  );

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (statusPollingLogIds.length === 0) {
      return;
    }

    const refreshPollingLogs = async () => {
      try {
        const results = await Promise.all(
          statusPollingLogIds.map((logId) => fetchLogStatus(logId)),
        );

        setLogs((prev) => {
          if (!prev) {
            return prev;
          }

          const updates = new Map(
            results
              .filter((result): result is LogStatusResponse => result != null)
              .map((result) => [result.id, result]),
          );

          if (updates.size === 0) {
            return prev;
          }

          return prev
            .map((log) => {
              const update = updates.get(log.id);
              if (!update) {
                return log;
              }

              return {
                ...log,
                name: update.name,
                eligible: update.eligible,
                liveLogState: update.liveLogState,
                receivingData: update.receivingData,
                saveStatus: update.saveStatus,
                processingProgress: update.processingProgress,
                _count: update._count,
              };
            })
            .filter((log) => log.saveStatus !== "failed");
        });
      } catch (err) {
        console.error("Failed to refresh parsing logs:", err);
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshPollingLogs();
    }, 5000);

    void refreshPollingLogs();

    return () => window.clearInterval(intervalId);
  }, [statusPollingLogIds]);

  const handleRename = async (logId: string, name: string) => {
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/log/${logId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(
          body.error || `Rename failed with status ${resp.status}`,
        );
      }

      const data: { name: string | null } = await resp.json();
      setLogs(
        (prev) =>
          prev?.map((log) =>
            log.id === logId ? { ...log, name: data.name } : log,
          ) ?? null,
      );
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
      throw err;
    }
  };

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
      // Remove deleted log from state
      enqueueSnackbar("Log Deleted", {
        variant: "success",
        autoHideDuration: 1000,
        action,
      });
      setLogs((prev) => prev?.filter((log) => log.id !== logId) ?? null);
    } catch (err: any) {
      console.error("Failed to delete log:", err);
      alert(err.message || "Failed to delete");
    }
  };

  const handleRequestSort = (property: SortKey) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const renderFilters = () => (
    <FilterToolbar sx={{ mb: 2 }}>
      <FilterSelect
        field="content"
        value={content.value}
        options={mapContentFilterOptions(RECENT_ENCOUNTERS_CONTENT_OPTIONS)}
        sx={{ minWidth: { xs: 100, sm: 140 } }}
        onChange={(nextContentValue) => {
          const selectedContent = RECENT_ENCOUNTERS_CONTENT_OPTIONS.find(
            (option) => option.value === nextContentValue,
          )!;
          const newPlayerCount = BROWSE_ANY_PLAYER_COUNT;
          setContent(selectedContent);
          setPlayerCount(newPlayerCount);
          updateSearchParams({
            content: selectedContent,
            playerCount: newPlayerCount,
          });
        }}
      />

      {!isAllContent && content.defaultPlayerCount != null && (
        <FilterSelect<BrowsePlayerCount>
          field="team"
          value={playerCount}
          compact
          sx={filterFieldCompactSx}
          options={buildBrowsePlayerCountOptions(content.playerCounts)}
          onChange={(count) => {
            setPlayerCount(count);
            updateSearchParams({ playerCount: count });
          }}
        />
      )}
    </FilterToolbar>
  );

  const hasActiveFilter = !isAllContent;
  const emptyMessage = hasActiveFilter
    ? "No logs found matching this filter."
    : "No logs found for this uploader.";

  const sortedLogs = logs?.slice().sort(getComparator(order, orderBy)) ?? [];
  const tableColumnCount = logsTableColumnCount(canEditLogs);

  const renderTableStatusRow = (content: React.ReactNode) => (
    <TableRow>
      <TableCell
        colSpan={tableColumnCount}
        align="center"
        sx={tableStatusCellSx}
      >
        {content}
      </TableCell>
    </TableRow>
  );

  const canonicalPath = `${location.pathname}${location.search}`;
  const displayUploaderName = useMemo(() => {
    if (apiUploaderId) return apiUploaderId;
    return uploaderId ? formatDisplayUsername(uploaderId) : undefined;
  }, [apiUploaderId, uploaderId]);
  const pageMeta = useMemo(
    () =>
      getUploaderLogsPageMeta({
        uploaderName: displayUploaderName || "Unknown User",
        canonicalPath,
      }),
    [displayUploaderName, canonicalPath],
  );
  usePageMeta(pageMeta);

  return (
    <Box sx={pageContainerSx}>
      <LogsPageHeader uploaderId={displayUploaderName} />
      {renderFilters()}

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table sx={{ tableLayout: "auto", width: "100%" }}>
          <TableHead>
            <TableRow>
              {/* Log Name Column */}
              <TableCell sx={nameColumnSx}>
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                  sx={{
                    color: "white",
                    "& .MuiTableSortLabel-icon": { color: "white !important" },
                  }}
                >
                  <strong>Name</strong>
                </TableSortLabel>
              </TableCell>

              {/* Uploaded Column */}
              <TableCell sx={shrinkColumnSx}>
                <TableSortLabel
                  active={orderBy === "uploadedAt"}
                  direction={orderBy === "uploadedAt" ? order : "asc"}
                  onClick={() => handleRequestSort("uploadedAt")}
                  sx={{
                    color: "white",
                    "& .MuiTableSortLabel-icon": { color: "white !important" },
                  }}
                >
                  <strong>Uploaded</strong>
                </TableSortLabel>
              </TableCell>

              {/* # Fights Column */}
              <TableCell
                align="right"
                sx={{
                  ...shrinkColumnSx,
                  [media.mobileDown]: { display: "none" },
                }}
              >
                <TableSortLabel
                  active={orderBy === "fights"}
                  direction={orderBy === "fights" ? order : "asc"}
                  onClick={() => handleRequestSort("fights")}
                  sx={{
                    color: "white",
                    "& .MuiTableSortLabel-icon": { color: "white !important" },
                  }}
                >
                  <strong># Fights</strong>
                </TableSortLabel>
              </TableCell>

              {/* # Fight Groups Column */}
              <TableCell
                align="right"
                sx={{
                  ...shrinkColumnSx,
                  [media.mobileDown]: { display: "none" },
                }}
              >
                <TableSortLabel
                  active={orderBy === "fightGroups"}
                  direction={orderBy === "fightGroups" ? order : "asc"}
                  onClick={() => handleRequestSort("fightGroups")}
                  sx={{
                    color: "white",
                    "& .MuiTableSortLabel-icon": { color: "white !important" },
                  }}
                >
                  <strong># Fight Groups</strong>
                </TableSortLabel>
              </TableCell>

              {/* Delete Column */}
              {canEditLogs && (
                <TableCell align="center" sx={shrinkColumnSx}></TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading &&
              renderTableStatusRow(
                <CircularProgress color="inherit" size={28} />,
              )}
            {!loading &&
              error &&
              renderTableStatusRow(
                <Typography color="error">{error}</Typography>,
              )}
            {!loading &&
              !error &&
              sortedLogs.length === 0 &&
              renderTableStatusRow(
                <Typography color="white">{emptyMessage}</Typography>,
              )}
            {!loading &&
              !error &&
              sortedLogs.map((log) => {
                const parsing = isParsingLog(log);

                return (
                  <TableRow
                    key={log.id}
                    {...(parsing ? {} : logTableRowProps(navigate, log.id))}
                    sx={
                      parsing
                        ? {
                            cursor: "default",
                            "&:hover": { backgroundColor: "transparent" },
                          }
                        : undefined
                    }
                  >
                    <TableCell sx={{ ...nameColumnSx, ...tableCellPaddingSx }}>
                      {parsing ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: colors.text.muted,
                          }}
                        >
                          <CircularProgress
                            size={14}
                            sx={{ color: colors.upload.dragActive }}
                          />
                          <Typography
                            sx={{ ...logNameTextSx, color: colors.text.muted }}
                          >
                            Parsing {log.processingProgress ?? 0}%
                          </Typography>
                          <LiveLogIndicator liveLogState={log.liveLogState} />
                        </Box>
                      ) : (
                        <LogNameCell
                          log={log}
                          canEdit={canEditLogs}
                          onRename={handleRename}
                        />
                      )}
                    </TableCell>

                    <TableCell
                      sx={{ ...shrinkColumnSx, ...tableCellPaddingSx }}
                    >
                      <Box
                        component="span"
                        sx={{ [media.desktopUp]: { display: "none" } }}
                      >
                        {format(new Date(log.uploadedAt), "MMM d, yyyy")}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          display: "none",
                          [media.desktopUp]: { display: "inline" },
                        }}
                      >
                        {format(new Date(log.uploadedAt), "PPp")}
                      </Box>
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        ...shrinkColumnSx,
                        ...tableCellPaddingSx,
                        [media.mobileDown]: { display: "none" },
                      }}
                    >
                      {parsing ? "—" : log._count.fights}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        ...shrinkColumnSx,
                        ...tableCellPaddingSx,
                        [media.mobileDown]: { display: "none" },
                      }}
                    >
                      {parsing ? "—" : log._count.fightGroups}
                    </TableCell>

                    {canEditLogs && (
                      <TableCell
                        align="center"
                        sx={{ ...shrinkColumnSx, ...tableCellPaddingSx }}
                      >
                        {!parsing && (
                          <IconButton
                            aria-label="delete"
                            onClick={(e) => {
                              stopRowClick(e);
                              void handleDelete(log.id);
                            }}
                            size="small"
                          >
                            <DeleteIcon
                              fontSize="small"
                              sx={{ color: "white" }}
                            />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Logs;
