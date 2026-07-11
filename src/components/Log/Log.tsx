import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import FightSelector from "../sections/FightSelector";
import { EncounterMetaData } from "../../models/LogLine";
import LogInfoBox from "./LogInfoBox";
import { centeredPageStateSx, contentColumnSx } from "../../theme";
import {
  getEncounterHref,
  getRunSummaryHref,
} from "../../utils/encounterTableRow";
import LiveLogProgressAlert from "../LiveLogProgressAlert";
import {
  LIVE_PAGE_RETRY_INTERVAL_MS,
  LIVE_PAGE_RETRY_TIMEOUT_MS,
  shouldPollLiveLogPage,
  shouldRetryTransientPageFetch,
  useLiveFetchRetryState,
} from "../../utils/livePageFetchRetry";
import {
  isLiveLogPending,
  parseLiveLogState,
  type LiveLogState,
} from "../../utils/liveLogState";
import { useLivePageRefreshPulse } from "../../utils/useLivePageRefreshPulse";
import { usePageMeta } from "../../hooks/usePageMeta";
import {
  getLoadingEncounterPageMeta,
  getLogPageMeta,
} from "../../utils/encounterPageMeta";
import { mapLogPageEncountersToMetadata } from "./mapLogPageEncounters";

interface ApiFight {
  id: string;
  name: string;
  mainEnemyName: string;
  startTime: string;
  isNpc: boolean;
  isBoss: boolean;
  isWave: boolean;
  fightDurationTicks: number;
  officialDurationTicks: number | null;
  success: boolean;
  logVersion: string;
  loggedInPlayer: string;
  logId: string;
  groupId: string | null;
  order: number;
}

interface ApiFightGroup {
  type: "fightGroup";
  id: string;
  name: string;
  leaderboardName: string;
  officialDurationTicks: number | null;
  displayDurationTicks?: number | null;
  success: boolean;
  receivingData?: boolean;
  order: number;
  fights: ApiFight[];
}

interface ApiFightOnly {
  type: "fight";
  id: string;
  name: string;
  mainEnemyName: string;
  startTime: string;
  isNpc: boolean;
  isBoss: boolean;
  isWave: boolean;
  fightDurationTicks: number;
  officialDurationTicks: number | null;
  success: boolean;
  logVersion: string;
  loggedInPlayer: string;
  logId: string;
  groupId: null;
  order: number;
}

type ApiEncounter = ApiFightOnly | ApiFightGroup;

interface ApiResponse {
  logId: string;
  name: string | null;
  uploaderId: string;
  uploadedAt: string;
  liveLogState?: LiveLogState;
  receivingData?: boolean;
  liveActiveFightGroupId?: string | null;
  liveActiveFightId?: string | null;
  encounters: ApiEncounter[];
}

const Log: React.FC = () => {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const canonicalPath = `${location.pathname}${location.search}`;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<EncounterMetaData[] | null>(null);
  const [uploaderId, setUploaderId] = useState<string>("");
  const [logName, setLogName] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<string>("");
  const [encounters, setEncounters] = useState<ApiEncounter[]>([]);
  const [liveLogState, setLiveLogState] = useState<LiveLogState>("none");
  const [receivingData, setReceivingData] = useState<boolean>(false);
  const [retryingAfterNotFound, setRetryingAfterNotFound] = useState(false);
  const { liveLogStateRef, receivingDataRef, retryingRef } =
    useLiveFetchRetryState(liveLogState, receivingData, retryingAfterNotFound);
  const { refreshing, runBackgroundRefresh } = useLivePageRefreshPulse();

  const loadLog = useCallback(
    async (showLoading = true) => {
      const execute = async () => {
        if (!logId) {
          setError("No logId provided in URL");
          setLoading(false);
          return;
        }

        if (showLoading) {
          setLoading(true);
        }
        setError(null);
        let keepLoading = false;

        try {
          const token = await (window as any).auth0?.getAccessTokenSilently?.();
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/log/${logId}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            },
          );

          // 404 fast-fail: intermittent 404 during live logging is a backend bug; see livePageFetchRetry.
          if (
            shouldRetryTransientPageFetch(res.status, {
              showLoading,
              liveLogState: liveLogStateRef.current,
              receivingData: receivingDataRef.current,
              retryingAfterNotFound: retryingRef.current,
            })
          ) {
            setRetryingAfterNotFound(true);
            keepLoading = showLoading || retryingRef.current;
            return;
          }

          if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
          }

          setRetryingAfterNotFound(false);
          const body: ApiResponse = await res.json();
          const sortedEncounters = body.encounters
            .slice()
            .sort((a, b) => a.order - b.order);
          setEncounters(sortedEncounters);
          setLiveLogState(parseLiveLogState(body.liveLogState));
          setReceivingData(Boolean(body.receivingData));

          const { uploaderId: up, name, uploadedAt: ua } = body;
          setUploaderId(up);
          setLogName(name);
          setUploadedAt(ua);

          setMetadata(
            mapLogPageEncountersToMetadata(sortedEncounters, {
              receivingData: body.receivingData,
              liveActiveFightGroupId: body.liveActiveFightGroupId,
              liveActiveFightId: body.liveActiveFightId,
            }),
          );
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Unknown error fetching log");
        } finally {
          if (showLoading && !keepLoading) {
            setLoading(false);
          }
        }
      };

      if (showLoading) {
        return execute();
      }
      return runBackgroundRefresh(execute);
    },
    [logId, runBackgroundRefresh],
  );

  useEffect(() => {
    setMetadata(null);
    setEncounters([]);
    setLiveLogState("none");
    setReceivingData(false);
    setRetryingAfterNotFound(false);
    void loadLog(true);
  }, [logId, loadLog]);

  useEffect(() => {
    if (!logId || !retryingAfterNotFound) {
      return;
    }

    const interval = window.setInterval(() => {
      loadLog(false);
    }, LIVE_PAGE_RETRY_INTERVAL_MS);

    const timeout = window.setTimeout(() => {
      setRetryingAfterNotFound(false);
      setError("Log data is not available yet");
      setLoading(false);
    }, LIVE_PAGE_RETRY_TIMEOUT_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [logId, retryingAfterNotFound, loadLog]);

  useEffect(() => {
    if (!logId || !shouldPollLiveLogPage(liveLogState, receivingData)) {
      return;
    }

    const interval = window.setInterval(() => {
      loadLog(false);
    }, LIVE_PAGE_RETRY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [logId, liveLogState, receivingData, loadLog]);

  const pageMeta = useMemo(() => {
    if (loading) {
      return getLoadingEncounterPageMeta(canonicalPath);
    }

    return getLogPageMeta({ logName, canonicalPath });
  }, [loading, logName, canonicalPath]);
  usePageMeta(pageMeta);

  if (loading) {
    return (
      <Box sx={centeredPageStateSx}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...centeredPageStateSx, p: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Error loading log:</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  const hasEncounters = metadata !== null && metadata.length > 0;
  const showLiveProgress = isLiveLogPending(liveLogState);

  return (
    <Box p={2} sx={contentColumnSx}>
      {showLiveProgress && (
        <LiveLogProgressAlert refreshing={refreshing} sx={{ mb: 2 }} />
      )}
      <LogInfoBox
        uploaderId={uploaderId}
        logName={logName}
        logId={logId!}
        uploadedAt={uploadedAt}
        liveLogState={liveLogState}
        receivingData={receivingData}
        onLogNameChange={setLogName}
      />

      {hasEncounters ? (
        <FightSelector
          fights={metadata!}
          getFightHref={(index, fightGroupIndex) => {
            const encounter = encounters[index];
            if (!encounter) {
              return undefined;
            }
            if (fightGroupIndex === undefined) {
              if (encounter.type === "fight") {
                return getEncounterHref(encounter.id);
              }
              return undefined;
            }
            if (encounter.type === "fightGroup") {
              const fightId = encounter.fights[fightGroupIndex]?.id;
              return fightId ? getEncounterHref(fightId) : undefined;
            }
            return undefined;
          }}
          getFightGroupHref={getRunSummaryHref}
          onSelectAggregateFight={async (indices) => {
            const selectedFights: string[] = [];

            for (const i of indices) {
              const encounter = encounters[i];
              if (encounter?.type === "fight") {
                selectedFights.push(encounter.id);
              }
            }

            if (selectedFights.length === 0) return;

            try {
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/fight/aggregate`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ fightIds: selectedFights }),
                },
              );

              if (!res.ok) {
                console.error(
                  `Failed to create aggregate fight: ${res.status}`,
                );
                return;
              }

              const { aggregateId } = await res.json();
              navigate(`/encounter/aggregate/${aggregateId}`);
            } catch (err) {
              console.error("Error aggregating fights:", err);
            }
          }}
        />
      ) : (
        <Typography sx={{ mt: 2, color: "white" }}>
          No encounters found in this log.
        </Typography>
      )}
    </Box>
  );
};

export default Log;
