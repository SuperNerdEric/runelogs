import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Alert, Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { centeredPageStateSx } from "../theme";
import { TabsEnum } from "./Tabs";
import EncounterTabContent from "./EncounterTabContent";
import { Fight, FightMetaData, isFight } from "../models/Fight";
import * as semver from "semver";
import "../App.css";
import EncounterFightTitle from "./EncounterFightTitle";
import PageBreadcrumbs, { BreadcrumbSegment } from "./PageBreadcrumbs";
import {
  inferLeaderboardFightGroupName,
  inferStandaloneLeaderboardContent,
} from "../utils/leaderboardContent";
import { resolveLeaderboardSpriteKey } from "../lib/hiscoreSprites";
import { getRunSummaryHref } from "../utils/encounterTableRow";
import {
  ActorFilter,
  deserializeActorFilter,
  serializeActorFilter,
} from "../utils/actorFilter";
import {
  deserializeEquipmentFilter,
  EquipmentFilter,
  serializeEquipmentFilter,
} from "../utils/equipmentFilter";
import {
  deserializePrayerFilter,
  PrayerFilter,
  serializePrayerFilter,
} from "../utils/prayerFilter";
import {
  deserializeHitsplatFilter,
  HitsplatFilter,
  serializeHitsplatFilter,
} from "../utils/hitsplatFilter";
import {
  deserializeHitsplatTypeFilter,
  HitsplatTypeFilter,
  serializeHitsplatTypeFilter,
} from "../utils/hitsplatTypeFilter";
import LiveLogProgressAlert from "./LiveLogProgressAlert";
import LogNameDisplay from "./LogNameDisplay";
import {
  LIVE_PAGE_RETRY_INTERVAL_MS,
  LIVE_PAGE_RETRY_TIMEOUT_MS,
  shouldRetryTransientPageFetch,
  useLiveFetchRetryState,
} from "../utils/livePageFetchRetry";
import { useLivePageRefreshPulse } from "../utils/useLivePageRefreshPulse";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  getEncounterFightPageMeta,
  getLoadingEncounterPageMeta,
} from "../utils/encounterPageMeta";
import { deserializeEventTimeFilter } from "../utils/eventTimeFilter";
import { deserializeAnimationIdFilter } from "../utils/animationIdFilter";

type EncounterApiFG = {
  type: "fightGroup";
  id: string;
  name: string;
  leaderboardName?: string | null;
  receivingData?: boolean;
  rank?: number;
  fights: { id: string; name: string; order: number }[];
};

type EncounterApiFight = {
  type: "fight";
  fightGroup?: string;
  fight: Fight;
  receivingData?: boolean;
  meta: {
    fightGroup?: { id: string; name: string; leaderboardName?: string | null };
    log: { id: string; name?: string | null };
    receivingData?: boolean;
    rank?: number;
    dpsPercentiles?: Record<string, number>;
    dpsRanks?: Record<string, number>;
    dpsLeaderboardKey?: string | null;
    players?: string[];
    mainEnemyName?: string | null;
  };
};

type EncounterApi = EncounterApiFG | EncounterApiFight;

interface SelectorItem extends FightMetaData {
  id: string;
}

const Encounter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [fight, setFight] = useState<Fight | null>(null);
  const [group, setGroup] = useState<EncounterApiFG | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [logName, setLogName] = useState<string | null>(null);
  const [fightGroupMeta, setFightGroupMeta] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receivingData, setReceivingData] = useState(false);
  const [retryingAfter404, setRetryingAfter404] = useState(false);
  const fightRef = useRef<Fight | null>(null);
  const { receivingDataRef, retryingRef } = useLiveFetchRetryState(
    receivingData,
    retryingAfter404,
  );
  const { refreshing, runBackgroundRefresh } = useLivePageRefreshPulse();
  const [dpsPercentiles, setDpsPercentiles] = useState<Record<string, number>>(
    {},
  );
  const [dpsRanks, setDpsRanks] = useState<Record<string, number>>({});
  const [dpsLeaderboardKey, setDpsLeaderboardKey] = useState<string | null>(
    null,
  );
  const [playerCount, setPlayerCount] = useState(0);
  const [leaderboardName, setLeaderboardName] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const canonicalPath = `${location.pathname}${location.search}`;

  const isAggregate = window.location.pathname.startsWith(
    "/encounter/aggregate/",
  );

  const tabParam = searchParams.get("tab") as TabsEnum | null;
  const sourceFilter = useMemo(
    () => deserializeActorFilter(searchParams.get("source")),
    [searchParams],
  );
  const targetFilter = useMemo(
    () => deserializeActorFilter(searchParams.get("target")),
    [searchParams],
  );
  const equipmentFilter = useMemo(
    () => deserializeEquipmentFilter(searchParams.get("equipment")),
    [searchParams],
  );
  const prayerFilter = useMemo(
    () => deserializePrayerFilter(searchParams.get("prayer")),
    [searchParams],
  );
  const hitsplatFilter = useMemo(
    () => deserializeHitsplatFilter(searchParams.get("hitsplat")),
    [searchParams],
  );
  const hitsplatTypeFilter = useMemo(
    () => deserializeHitsplatTypeFilter(searchParams.get("hitsplatType")),
    [searchParams],
  );
  const eventTypeFilter = searchParams.get("eventType");
  const eventTimeFilter = useMemo(
    () => deserializeEventTimeFilter(searchParams.get("eventTime")),
    [searchParams],
  );
  const animationIdFilter = useMemo(
    () => deserializeAnimationIdFilter(searchParams.get("animationId")),
    [searchParams],
  );

  const deferredSourceFilter = useDeferredValue(sourceFilter);
  const deferredTargetFilter = useDeferredValue(targetFilter);
  const deferredEquipmentFilter = useDeferredValue(equipmentFilter);
  const deferredPrayerFilter = useDeferredValue(prayerFilter);
  const deferredHitsplatFilter = useDeferredValue(hitsplatFilter);
  const deferredHitsplatTypeFilter = useDeferredValue(hitsplatTypeFilter);
  const deferredEventTypeFilter = useDeferredValue(eventTypeFilter);
  const deferredEventTimeFilter = useDeferredValue(eventTimeFilter);
  const deferredAnimationIdFilter = useDeferredValue(animationIdFilter);

  const filtersPending =
    deferredSourceFilter !== sourceFilter ||
    deferredTargetFilter !== targetFilter ||
    deferredEquipmentFilter !== equipmentFilter ||
    deferredPrayerFilter !== prayerFilter ||
    deferredHitsplatFilter !== hitsplatFilter ||
    deferredHitsplatTypeFilter !== hitsplatTypeFilter ||
    deferredEventTypeFilter !== eventTypeFilter ||
    deferredEventTimeFilter !== eventTimeFilter ||
    deferredAnimationIdFilter !== animationIdFilter;

  const isValidTab = Object.values(TabsEnum).includes(tabParam as TabsEnum);
  const tabFromUrl: TabsEnum = isValidTab
    ? (tabParam as TabsEnum)
    : TabsEnum.SUMMARY;
  const [optimisticTab, setOptimisticTab] = useState<TabsEnum | null>(null);
  const displayTab = optimisticTab ?? tabFromUrl;
  const [renderedTab, setRenderedTab] = useState<TabsEnum>(tabFromUrl);
  const [showTabContent, setShowTabContent] = useState(true);
  const isTabLoading = displayTab !== renderedTab || !showTabContent;

  useEffect(() => {
    if (optimisticTab !== null && tabFromUrl === optimisticTab) {
      setOptimisticTab(null);
    }
  }, [tabFromUrl, optimisticTab]);

  // Defer mounting tab content so the spinner can paint before heavy renders.
  useEffect(() => {
    if (displayTab === renderedTab && showTabContent) {
      return;
    }

    setShowTabContent(false);

    const timeoutId = window.setTimeout(() => {
      if (displayTab !== renderedTab) {
        setRenderedTab(displayTab);
      } else {
        setShowTabContent(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [displayTab, renderedTab, showTabContent]);

  // Ensure ?tab= is always present; redirect legacy Boosts tab to Summary
  useEffect(() => {
    const rawTab = searchParams.get("tab");

    if (rawTab === "Boosts") {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", TabsEnum.SUMMARY);
      navigate(`${window.location.pathname}?${newParams.toString()}`, {
        replace: true,
      });
      return;
    }

    if (!tabParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", TabsEnum.SUMMARY);
      navigate(`${window.location.pathname}?${newParams.toString()}`, {
        replace: true,
      });
    }
  }, [tabParam, navigate, searchParams]);

  const selectorMeta: SelectorItem[] = useMemo(() => {
    if (!group) return [];
    return group.fights
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        id: f.id,
        name: f.name,
        startTime: "",
        fightDurationTicks: 0,
        success: true,
      }));
  }, [group]);

  const fetchEncounter = useCallback(
    async (encounterId: string, asInitial = false, showLoading = true) => {
      const execute = async () => {
        if (showLoading) {
          setLoading(true);
          setError(null);
        }
        let keepLoading = false;
        try {
          const res = await fetch(
            isAggregate
              ? `${import.meta.env.VITE_API_URL}/fight/aggregate/${encounterId}`
              : `${import.meta.env.VITE_API_URL}/encounter/${encounterId}`,
          );
          if (res.status === 410) {
            const body = await res.json();
            if (body.redirectTo) {
              navigate(body.redirectTo);
              return;
            }
          }
          // 404 fast-fail: see shouldRetryTransientPageFetch — do not retry missing encounters.
          if (
            shouldRetryTransientPageFetch(res.status, {
              showLoading,
              receivingData: receivingDataRef.current,
              retryingAfterNotFound: retryingRef.current,
            })
          ) {
            setRetryingAfter404(true);
            keepLoading = showLoading || retryingRef.current;
            return;
          }
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          setRetryingAfter404(false);
          const data: EncounterApi = await res.json();

          if (data.type === "fight") {
            if (!isFight(data.fight))
              throw new Error("Malformed fight payload");
            setFight(data.fight);
            fightRef.current = data.fight;
            setLogId(data.meta.log.id);
            setLogName(data.meta.log.name ?? null);
            setFightGroupMeta(data.meta.fightGroup ?? null);
            setReceivingData(
              Boolean(data.meta.receivingData ?? data.receivingData),
            );
            setDpsPercentiles(data.meta.dpsPercentiles ?? {});
            setDpsRanks(data.meta.dpsRanks ?? {});
            setDpsLeaderboardKey(data.meta.dpsLeaderboardKey ?? null);
            setPlayerCount(data.meta.players?.length ?? 0);
            setLeaderboardName(
              data.meta.fightGroup?.leaderboardName ??
                (data.meta.fightGroup?.name
                  ? inferLeaderboardFightGroupName(data.meta.fightGroup.name)
                  : null) ??
                inferStandaloneLeaderboardContent(
                  data.meta.mainEnemyName ?? undefined,
                ),
            );
            if (showLoading) {
              setError(null);
            }

            if (asInitial && data.meta.fightGroup?.id) {
              await fetchEncounter(data.meta.fightGroup.id, false, false);
            }
          } else {
            setGroup(data);
            setReceivingData(Boolean(data.receivingData));
            setLeaderboardName(
              data.leaderboardName ?? inferLeaderboardFightGroupName(data.name),
            );
            if (showLoading) {
              setError(null);
            }
            if (asInitial && data.fights.length) {
              await fetchEncounter(data.fights[0].id, false, showLoading);
            }
          }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Unknown error";
          if (showLoading || !fightRef.current) {
            setError(message);
          } else {
            console.error("Background encounter refresh failed:", e);
          }
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
    [isAggregate, navigate, runBackgroundRefresh],
  );

  useEffect(() => {
    if (!id || !retryingAfter404) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchEncounter(id, false, false);
    }, LIVE_PAGE_RETRY_INTERVAL_MS);

    const timeout = window.setTimeout(() => {
      setRetryingAfter404(false);
      setError("Encounter data is not available yet");
      setLoading(false);
    }, LIVE_PAGE_RETRY_TIMEOUT_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [id, retryingAfter404, fetchEncounter]);

  const handleSelectFight = useCallback(
    (index: number) => {
      if (!group) return;
      const f = group.fights[index];
      if (!f) return;

      const newParams = new URLSearchParams(searchParams);
      const tabValue = newParams.get("tab") ?? TabsEnum.SUMMARY;

      // Push new fight ID and preserve tab query
      const basePath = isAggregate ? "/encounter/aggregate" : "/encounter";
      navigate(`${basePath}/${f.id}?tab=${encodeURIComponent(tabValue)}`);
    },
    [group, navigate, searchParams, isAggregate],
  );

  const updateActorFilter = useCallback(
    (key: "source" | "target", filter: ActorFilter | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (filter) {
        newParams.set(key, serializeActorFilter(filter));
      } else {
        newParams.delete(key);
      }
      navigate(`${window.location.pathname}?${newParams.toString()}`);
    },
    [navigate, searchParams],
  );

  const updateEquipmentFilter = useCallback(
    (filter: EquipmentFilter | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (filter) {
        newParams.set("equipment", serializeEquipmentFilter(filter));
      } else {
        newParams.delete("equipment");
      }
      navigate(`${window.location.pathname}?${newParams.toString()}`);
    },
    [navigate, searchParams],
  );

  const updatePrayerFilter = useCallback(
    (filter: PrayerFilter | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (filter) {
        newParams.set("prayer", serializePrayerFilter(filter));
      } else {
        newParams.delete("prayer");
      }
      navigate(`${window.location.pathname}?${newParams.toString()}`);
    },
    [navigate, searchParams],
  );

  const updateHitsplatFilter = useCallback(
    (filter: HitsplatFilter | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (filter) {
        newParams.set("hitsplat", serializeHitsplatFilter(filter));
      } else {
        newParams.delete("hitsplat");
      }
      navigate(`${window.location.pathname}?${newParams.toString()}`);
    },
    [navigate, searchParams],
  );

  const updateHitsplatTypeFilter = useCallback(
    (filter: HitsplatTypeFilter | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (filter) {
        newParams.set("hitsplatType", serializeHitsplatTypeFilter(filter));
      } else {
        newParams.delete("hitsplatType");
      }
      navigate(`${window.location.pathname}?${newParams.toString()}`);
    },
    [navigate, searchParams],
  );

  const onSelectSourceFilter = useCallback(
    (filter: ActorFilter) => updateActorFilter("source", filter),
    [updateActorFilter],
  );
  const onSelectTargetFilter = useCallback(
    (filter: ActorFilter) => updateActorFilter("target", filter),
    [updateActorFilter],
  );
  const onClearSourceFilter = useCallback(
    () => updateActorFilter("source", null),
    [updateActorFilter],
  );
  const onClearTargetFilter = useCallback(
    () => updateActorFilter("target", null),
    [updateActorFilter],
  );
  const onSelectEventTypeFilter = useCallback(
    (eventType: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("eventType", eventType);
      navigate(`${window.location.pathname}?${newParams.toString()}`);
    },
    [navigate, searchParams],
  );
  const onClearEventTypeFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("eventType");
    navigate(`${window.location.pathname}?${newParams.toString()}`);
  }, [navigate, searchParams]);
  const onClearEventTimeFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("eventTime");
    navigate(`${window.location.pathname}?${newParams.toString()}`);
  }, [navigate, searchParams]);
  const onClearAnimationIdFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("animationId");
    navigate(`${window.location.pathname}?${newParams.toString()}`);
  }, [navigate, searchParams]);
  const onClearEquipmentFilter = useCallback(
    () => updateEquipmentFilter(null),
    [updateEquipmentFilter],
  );
  const onClearPrayerFilter = useCallback(
    () => updatePrayerFilter(null),
    [updatePrayerFilter],
  );
  const onClearHitsplatFilter = useCallback(
    () => updateHitsplatFilter(null),
    [updateHitsplatFilter],
  );
  const onClearHitsplatTypeFilter = useCallback(
    () => updateHitsplatTypeFilter(null),
    [updateHitsplatTypeFilter],
  );

  useEffect(() => {
    if (id) {
      setGroup(null);
      setFight(null);
      fightRef.current = null;
      setLogName(null);
      setFightGroupMeta(null);
      setDpsRanks({});
      setDpsLeaderboardKey(null);
      setPlayerCount(0);
      setLeaderboardName(null);
      setOptimisticTab(null);
      setShowTabContent(true);
      setRetryingAfter404(false);
      fetchEncounter(id, true, true);
    }
  }, [id, fetchEncounter]);

  useEffect(() => {
    setOptimisticTab(null);
    setRenderedTab(tabFromUrl);
    setShowTabContent(true);
  }, [id]);

  useEffect(() => {
    if (!id || !receivingData || isAggregate) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchEncounter(id, false, false);
    }, LIVE_PAGE_RETRY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [id, receivingData, isAggregate, fetchEncounter]);

  const availableTabs = useMemo(() => {
    if (!fight) return [];
    return Object.values(TabsEnum).filter((t) =>
      t === TabsEnum.REPLAY
        ? fight.logVersion && semver.gte(fight.logVersion, "1.2.0")
        : true,
    );
  }, [fight]);

  const buildTabUrl = useCallback(
    (tab: TabsEnum) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", tab);
      return `${location.pathname}?${newParams.toString()}`;
    },
    [location.pathname, searchParams],
  );

  const runMeta = group ?? fightGroupMeta;

  // Dynamically calculate font size based on the number of tabs
  // So that for smaller screens all tabs together equal 95% of the width
  const TAB_COUNT = availableTabs.length;
  const widthPerTab = 95 / TAB_COUNT;
  const fontSize = `${widthPerTab * 0.14}vw`;

  const showTabShell =
    displayTab === TabsEnum.EVENTS ||
    (showTabContent && displayTab === renderedTab);
  const showParentSpinner = isTabLoading && displayTab !== TabsEnum.EVENTS;
  const showFilterOverlaySpinner =
    filtersPending && displayTab !== TabsEnum.EVENTS;

  const pageMeta = useMemo(() => {
    if (!fight) {
      return getLoadingEncounterPageMeta(canonicalPath);
    }

    const runMeta = group ?? fightGroupMeta;
    return getEncounterFightPageMeta({
      fightName: fight.name,
      runName: runMeta?.name,
      canonicalPath,
      isAggregate,
    });
  }, [fight, group, fightGroupMeta, canonicalPath, isAggregate]);
  usePageMeta(pageMeta);

  if (loading)
    return (
      <Box sx={centeredPageStateSx}>
        <CircularProgress color="inherit" />
      </Box>
    );

  if (error || !fight)
    return (
      <Box sx={{ ...centeredPageStateSx, p: 4 }}>
        <Alert severity="error">{error ?? "Encounter not found"}</Alert>
      </Box>
    );

  const selectedFightIndex = group
    ? Math.max(
        0,
        selectorMeta.findIndex((m) => m.id === fight.id),
      )
    : undefined;

  const breadcrumbSegments: BreadcrumbSegment[] = [
    {
      label: <LogNameDisplay name={logName} isLive={receivingData} />,
      title: logName ?? "Unnamed",
      href: `/log/${logId}`,
    },
  ];

  if (runMeta) {
    breadcrumbSegments.push({
      label: runMeta.name,
      href: getRunSummaryHref(runMeta.id),
      spriteKey: resolveLeaderboardSpriteKey(leaderboardName),
    });

    if (group && selectorMeta.length > 1) {
      breadcrumbSegments.push({
        label: fight.name,
        select: {
          options: selectorMeta.map((entry, index) => ({
            value: index,
            label: entry.name,
          })),
          value: selectedFightIndex ?? 0,
          onChange: handleSelectFight,
        },
      });
    } else {
      breadcrumbSegments.push({ label: fight.name });
    }
  } else {
    breadcrumbSegments.push({ label: fight.name });
  }

  return (
    <div className="App">
      <div className="App-main">
        {breadcrumbSegments.length > 0 && (
          <PageBreadcrumbs
            segments={breadcrumbSegments}
            sx={{ alignSelf: "flex-start" }}
          />
        )}
        <EncounterFightTitle
          fightName={fight.name}
          isNpc={fight.isNpc}
          mainEnemyName={fight.mainEnemyName}
          fightSelect={
            group && selectorMeta.length > 1
              ? {
                  options: selectorMeta.map((entry, index) => ({
                    value: index,
                    label: entry.name,
                  })),
                  value: selectedFightIndex ?? 0,
                  onChange: handleSelectFight,
                }
              : undefined
          }
        />
        {receivingData && (
          <LiveLogProgressAlert
            refreshing={refreshing}
            sx={{ alignSelf: "stretch", mb: 1 }}
          />
        )}
        <Tabs
          value={displayTab}
          onChange={(_, newTab: TabsEnum) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("tab", newTab);
            flushSync(() => {
              setOptimisticTab(newTab);
            });
            navigate(`${window.location.pathname}?${newParams.toString()}`);
          }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          style={{ marginBottom: "20px" }}
          TabIndicatorProps={{ style: { transition: "none" } }}
          sx={{ contain: "layout" }}
        >
          {availableTabs.map((tab) => (
            <Tab
              key={tab}
              component={Link}
              to={buildTabUrl(tab)}
              label={tab}
              value={tab}
              sx={{
                color: displayTab === tab ? "lightblue" : "white",
                minWidth: 0, // prevent MUI from enforcing a default min width
                "@media (max-width:500px)": {
                  padding: "6px 6px",
                  fontSize: fontSize,
                },
              }}
            />
          ))}
        </Tabs>

        <Box sx={{ minHeight: "40vh", position: "relative" }}>
          {showParentSpinner && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={8}
              sx={
                showTabContent
                  ? undefined
                  : { position: "absolute", inset: 0, zIndex: 1 }
              }
            >
              <CircularProgress color="inherit" />
            </Box>
          )}
          {showFilterOverlaySpinner && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={8}
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                pointerEvents: "none",
              }}
            >
              <CircularProgress color="inherit" />
            </Box>
          )}
          {showTabShell && (
            <EncounterTabContent
              renderedTab={displayTab}
              fight={fight}
              receivingData={receivingData}
              dpsPercentiles={dpsPercentiles}
              dpsRanks={dpsRanks}
              leaderboardName={leaderboardName}
              playerCount={playerCount}
              dpsLeaderboardKey={dpsLeaderboardKey}
              sourceFilter={sourceFilter}
              targetFilter={targetFilter}
              equipmentFilter={equipmentFilter}
              prayerFilter={prayerFilter}
              hitsplatFilter={hitsplatFilter}
              hitsplatTypeFilter={hitsplatTypeFilter}
              eventTypeFilter={eventTypeFilter}
              eventTimeFilter={eventTimeFilter}
              animationIdFilter={animationIdFilter}
              dataSourceFilter={deferredSourceFilter}
              dataTargetFilter={deferredTargetFilter}
              dataEquipmentFilter={deferredEquipmentFilter}
              dataPrayerFilter={deferredPrayerFilter}
              dataHitsplatFilter={deferredHitsplatFilter}
              dataHitsplatTypeFilter={deferredHitsplatTypeFilter}
              dataEventTypeFilter={deferredEventTypeFilter}
              dataEventTimeFilter={deferredEventTimeFilter}
              dataAnimationIdFilter={deferredAnimationIdFilter}
              onSelectSourceFilter={onSelectSourceFilter}
              onSelectTargetFilter={onSelectTargetFilter}
              onSelectEquipmentFilter={updateEquipmentFilter}
              onSelectPrayerFilter={updatePrayerFilter}
              onSelectHitsplatFilter={updateHitsplatFilter}
              onSelectHitsplatTypeFilter={updateHitsplatTypeFilter}
              onClearSourceFilter={onClearSourceFilter}
              onClearTargetFilter={onClearTargetFilter}
              onClearEquipmentFilter={onClearEquipmentFilter}
              onClearPrayerFilter={onClearPrayerFilter}
              onClearHitsplatFilter={onClearHitsplatFilter}
              onClearHitsplatTypeFilter={onClearHitsplatTypeFilter}
              onSelectEventTypeFilter={onSelectEventTypeFilter}
              onClearEventTypeFilter={onClearEventTypeFilter}
              onClearEventTimeFilter={onClearEventTimeFilter}
              onClearAnimationIdFilter={onClearAnimationIdFilter}
            />
          )}
        </Box>
      </div>
    </div>
  );
};

export default Encounter;
