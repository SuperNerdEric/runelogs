import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Collapse,
  Link,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { format } from "date-fns";
import LogNameDisplay from "./LogNameDisplay";
import LiveLogIndicator from "./LiveLogIndicator";
import { colors, fontSizes, fonts, logNameTextSx, media } from "../theme";
import { usernameToPathSegment } from "../utils/utils";
import { logTableRowProps, stopRowClick } from "../utils/encounterTableRow";
import { isLiveLogSessionOpen, type LiveLogState } from "../utils/liveLogState";

const PAGE_SIZE = 20;

interface RecentUploadedLog {
  id: string;
  name: string | null;
  uploaderId: string;
  uploadedAt: string;
  liveLogState?: LiveLogState;
  saveStatus?: "saving" | "complete" | "failed";
  processingProgress?: number;
  _count: {
    fights: number;
    fightGroups: number;
  };
}

interface RecentUploadedLogsResponse {
  logs: RecentUploadedLog[];
  total: number;
  page: number;
  pageSize: number;
}

const sectionTitleSx = {
  color: colors.text.primary,
  fontWeight: 600,
  fontSize: fontSizes.lg,
} as const;

const sectionDescriptionSx = {
  color: colors.text.muted,
  fontSize: fontSizes.base,
} as const;

const sectionInsetSx = {
  px: { xs: 2.25, md: 3 },
} as const;

const sectionHeaderSx = {
  ...sectionInsetSx,
  pt: { xs: 2.25, md: 3 },
  pb: 2,
} as const;

const expandHeaderSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  p: 0,
  m: 0,
  mb: 1.5,
  border: "none",
  background: "none",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: fonts.body,
  color: colors.text.primary,
  "&:hover .admin-recent-logs-title": {
    color: colors.text.link,
  },
} as const;

const tableContainerSx = {
  width: "100%",
  maxWidth: "none",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  borderTop: `1px solid ${colors.border.default}`,
} as const;

const paginationWrapSx = {
  display: "flex",
  justifyContent: "center",
  ...sectionInsetSx,
  pt: 2,
  pb: { xs: 2.25, md: 3 },
} as const;

const paginationSx = {
  "& .MuiPaginationItem-root": { color: "white" },
  "& .MuiPaginationItem-root.Mui-selected": {
    backgroundColor: "white",
    color: "black",
    borderRadius: "4px",
  },
} as const;

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

function isParsingLog(log: RecentUploadedLog): boolean {
  return log.saveStatus === "saving";
}

interface AdminRecentLogsProps {
  getAuthHeaders: () => Promise<{ Authorization: string }>;
}

const AdminRecentLogs: React.FC<AdminRecentLogsProps> = ({
  getAuthHeaders,
}) => {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<RecentUploadedLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchLogs = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_SIZE),
        });
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/logs?${params}`,
          { headers },
        );
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data = (await response.json()) as RecentUploadedLogsResponse;
        setLogs(data.logs);
        setTotal(data.total);
        setPage(data.page);
        setHasLoaded(true);
      } catch (err) {
        console.error("Failed to fetch recent uploaded logs:", err);
        setError("Failed to load recent logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders],
  );

  useEffect(() => {
    if (!expanded) {
      return;
    }
    void fetchLogs(page);
  }, [expanded, fetchLogs, page]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const colSpan = 5;
  const showLoading = loading || (expanded && logs === null && !error);

  const renderTableStatusRow = (content: React.ReactNode) => (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={tableStatusCellSx}>
        {content}
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Box sx={sectionHeaderSx}>
        <Box
          component="button"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          sx={expandHeaderSx}
        >
          <ExpandMoreIcon
            sx={{
              color: colors.text.muted,
              transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <Typography className="admin-recent-logs-title" sx={sectionTitleSx}>
            Recently Uploaded Logs
            {hasLoaded && ` (${total.toLocaleString()})`}
          </Typography>
        </Box>
        <Typography sx={sectionDescriptionSx}>
          Browse every log on the site, newest uploads first. Includes live
          logs.
        </Typography>
      </Box>

      <Collapse in={expanded} unmountOnExit={false} sx={{ width: "100%" }}>
        <TableContainer sx={tableContainerSx}>
          <Table sx={{ tableLayout: "auto", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={nameColumnSx}>
                  <strong>Name</strong>
                </TableCell>
                <TableCell sx={shrinkColumnSx}>
                  <strong>Uploader</strong>
                </TableCell>
                <TableCell sx={shrinkColumnSx}>
                  <strong>Uploaded</strong>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    ...shrinkColumnSx,
                    [media.mobileDown]: { display: "none" },
                  }}
                >
                  <strong># Fights</strong>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    ...shrinkColumnSx,
                    [media.mobileDown]: { display: "none" },
                  }}
                >
                  <strong># Fight Groups</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {showLoading &&
                renderTableStatusRow(
                  <CircularProgress color="inherit" size={28} />,
                )}
              {!showLoading &&
                error &&
                renderTableStatusRow(
                  <Typography color="error">{error}</Typography>,
                )}
              {!showLoading &&
                !error &&
                (logs?.length ?? 0) === 0 &&
                renderTableStatusRow(
                  <Typography color="white">No logs found</Typography>,
                )}
              {!showLoading &&
                !error &&
                logs?.map((log) => {
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
                      <TableCell
                        sx={{ ...nameColumnSx, ...tableCellPaddingSx }}
                      >
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
                              sx={{
                                ...logNameTextSx(false),
                                color: colors.text.muted,
                              }}
                            >
                              Parsing…
                            </Typography>
                            <LiveLogIndicator liveLogState={log.liveLogState} />
                          </Box>
                        ) : (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            minWidth={0}
                          >
                            <Link
                              component={RouterLink}
                              to={`/log/${log.id}`}
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
                        )}
                      </TableCell>
                      <TableCell
                        sx={{ ...shrinkColumnSx, ...tableCellPaddingSx }}
                      >
                        <Link
                          component={RouterLink}
                          to={`/logs/${encodeURIComponent(usernameToPathSegment(log.uploaderId))}`}
                          onClick={stopRowClick}
                          underline="hover"
                        >
                          {log.uploaderId}
                        </Link>
                      </TableCell>
                      <TableCell
                        sx={{ ...shrinkColumnSx, ...tableCellPaddingSx }}
                      >
                        {format(new Date(log.uploadedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...shrinkColumnSx,
                          ...tableCellPaddingSx,
                          [media.mobileDown]: { display: "none" },
                        }}
                      >
                        {log._count.fights}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...shrinkColumnSx,
                          ...tableCellPaddingSx,
                          [media.mobileDown]: { display: "none" },
                        }}
                      >
                        {log._count.fightGroups}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {!showLoading && pageCount > 1 && (
          <Box sx={paginationWrapSx}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              sx={paginationSx}
            />
          </Box>
        )}
      </Collapse>
    </>
  );
};

export default AdminRecentLogs;
