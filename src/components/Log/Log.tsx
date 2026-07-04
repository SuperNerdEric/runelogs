import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import FightSelector from "../sections/FightSelector";
import { FightMetaData } from "../../models/Fight";
import { EncounterMetaData } from "../../models/LogLine";
import LogInfoBox from "./LogInfoBox";
import { centeredPageStateSx, contentColumnSx } from "../../theme";
import {
  getEncounterHref,
  getRunSummaryHref,
} from "../../utils/encounterTableRow";
import { inferLeaderboardFightGroupName } from "../../utils/leaderboardContent";
import {
  isFightGroupRunInProgress,
  resolveLiveFightTileState,
} from "../../utils/fightDisplayStatus";
import LiveLogProgressAlert from "../LiveLogProgressAlert";
import {
  LIVE_PAGE_RETRY_INTERVAL_MS,
  LIVE_PAGE_RETRY_TIMEOUT_MS,
  shouldRetryTransientPageFetch,
  useLiveFetchRetryState,
} from "../../utils/livePageFetchRetry";
import { useLivePageRefreshPulse } from "../../utils/useLivePageRefreshPulse";
import { usePageMeta } from "../../hooks/usePageMeta";
import {
  getLoadingEncounterPageMeta,
  getLogPageMeta,
} from "../../utils/encounterPageMeta";

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
  isLive?: boolean;
  receivingData?: boolean;
  liveActiveEncounterId?: string | null;
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
  const [receivingData, setReceivingData] = useState<boolean>(false);
  const [retryingAfterNotFound, setRetryingAfterNotFound] = useState(false);
  const { receivingDataRef, retryingRef } = useLiveFetchRetryState(
    receivingData,
    retryingAfterNotFound,
  );
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
          setEncounters(body.encounters);
          setReceivingData(Boolean(body.receivingData));

          const { uploaderId: up, name, uploadedAt: ua } = body;
          setUploaderId(up);
          setLogName(name);
          setUploadedAt(ua);

          const out: EncounterMetaData[] = [];

          body.encounters.sort((a, b) => a.order - b.order);

          for (const enc of body.encounters) {
            if (enc.type === "fightGroup") {
              const sortedFights = enc.fights
                .slice()
                .sort((a, b) => a.order - b.order);
              const groupInProgress = isFightGroupRunInProgress(
                Boolean(body.receivingData),
                enc.success,
              );

              const fightStates = sortedFights.map((f) => ({
                id: f.id,
                success: f.success,
                order: f.order,
              }));

              const childFights: FightMetaData[] = sortedFights.map((f) => {
                const tileState = resolveLiveFightTileState(
                  Boolean(body.receivingData),
                  enc.success,
                  fightStates,
                  {
                    id: f.id,
                    success: f.success,
                    order: f.order,
                  },
                  body.liveActiveEncounterId,
                  body.liveActiveFightId,
                );

                return {
                  name: f.name,
                  startTime: f.startTime,
                  fightDurationTicks: f.fightDurationTicks,
                  success: tileState.displaySuccess,
                  inProgress: tileState.inProgress,
                };
              });

              const fgMeta = {
                name: enc.name,
                officialDurationTicks: enc.displayDurationTicks ?? undefined,
                success: enc.success,
                inProgress: groupInProgress,
                fights: childFights,
                id: enc.id,
                leaderboardName:
                  enc.leaderboardName ??
                  inferLeaderboardFightGroupName(enc.name),
              };

              out.push(fgMeta);
            } else {
              const fMeta: FightMetaData = {
                name: enc.mainEnemyName,
                startTime: enc.startTime,
                fightDurationTicks: enc.fightDurationTicks,
                success: enc.success,
              };

              out.push(fMeta);
            }
          }

          setMetadata(out);
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
    if (!logId || !receivingData) {
      return;
    }

    const interval = window.setInterval(() => {
      loadLog(false);
    }, LIVE_PAGE_RETRY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [logId, receivingData, loadLog]);

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

  return (
    <Box p={2} sx={contentColumnSx}>
      {receivingData && (
        <LiveLogProgressAlert refreshing={refreshing} sx={{ mb: 2 }} />
      )}
      <LogInfoBox
        uploaderId={uploaderId}
        logName={logName}
        logId={logId!}
        uploadedAt={uploadedAt}
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
