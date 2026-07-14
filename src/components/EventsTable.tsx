import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AppTooltip from "./AppTooltip";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Fight } from "../models/Fight";
import { DamageLog, LogLine, LogTypes } from "../models/LogLine";
import { Levels } from "../models/Levels";
import attackImage from "../assets/Attack.webp";
import strengthImage from "../assets/Strength.webp";
import defenceImage from "../assets/Defence.webp";
import hitpointsImage from "../assets/Hitpoints.webp";
import magicImage from "../assets/Magic.webp";
import rangedImage from "../assets/Ranged.webp";
import prayerImage from "../assets/Prayer.webp";
import sailingImage from "../assets/Sailing.webp";
import { formatHHmmss } from "../utils/utils";
import { formatAttackAnimationEventDetail } from "../utils/npcAttackAnimationNames";
import { colors, layout } from "../theme";
import { ActorFilter, matchesLogActorFilters } from "../utils/actorFilter";
import {
  EquipmentFilter,
  buildEquipmentTimelines,
  matchesEquipmentFilter,
} from "../utils/equipmentFilter";
import {
  PrayerFilter,
  buildPrayerTimelines,
  matchesPrayerFilter,
} from "../utils/prayerFilter";
import {
  getActorFromLog,
  getActorName,
  getActorSpecificIds,
  getPlayerNameTextClass,
  isUnknownPlayer,
} from "../utils/actorUtils";
import { itemIdMap } from "../lib/itemIdMap";
import { prayerIdMap } from "../lib/prayerIdMap";
import { prayerImages } from "../lib/prayerImages";
import FilterSearchBar from "./FilterSearchBar";
import {
  formatTargetFilterLabel,
  getDistinctTargetIndexes,
  getDistinctTargetNpcIds,
} from "../utils/targetDrillDown";
import {
  formatHitsplatFilterLabel,
  HitsplatFilter,
  matchesHitsplatFilter,
} from "../utils/hitsplatFilter";
import {
  formatHitsplatTypeFilterLabel,
  HitsplatTypeFilter,
  matchesHitsplatTypeFilter,
} from "../utils/hitsplatTypeFilter";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { matchesEventTimeFilter } from "../utils/eventTimeFilter";
import { matchesAnimationIdFilter } from "../utils/animationIdFilter";

interface EventsTableProps {
  fight: Fight;
  allLogs?: LogLine[];
  maxHeight: string;
  variant?: "default" | "damage";
  showSource?: boolean;
  sourceFilter?: ActorFilter | null;
  targetFilter?: ActorFilter | null;
  dataSourceFilter?: ActorFilter | null;
  dataTargetFilter?: ActorFilter | null;
  onSelectSourceFilter?: (filter: ActorFilter) => void;
  onSelectTargetFilter?: (filter: ActorFilter) => void;
  onClearSourceFilter?: () => void;
  onClearTargetFilter?: () => void;
  equipmentFilter?: EquipmentFilter | null;
  dataEquipmentFilter?: EquipmentFilter | null;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onClearEquipmentFilter?: () => void;
  prayerFilter?: PrayerFilter | null;
  dataPrayerFilter?: PrayerFilter | null;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onClearPrayerFilter?: () => void;
  hitsplatFilter?: HitsplatFilter | null;
  dataHitsplatFilter?: HitsplatFilter | null;
  onSelectHitsplatFilter?: (filter: HitsplatFilter) => void;
  onClearHitsplatFilter?: () => void;
  hitsplatTypeFilter?: HitsplatTypeFilter | null;
  dataHitsplatTypeFilter?: HitsplatTypeFilter | null;
  onSelectHitsplatTypeFilter?: (filter: HitsplatTypeFilter) => void;
  onClearHitsplatTypeFilter?: () => void;
  eventTypeFilter?: string | null;
  dataEventTypeFilter?: string | null;
  onSelectEventTypeFilter?: (eventType: string) => void;
  onClearEventTypeFilter?: () => void;
  eventTimeFilter?: number | null;
  dataEventTimeFilter?: number | null;
  onClearEventTimeFilter?: () => void;
  animationIdFilter?: number | null;
  dataAnimationIdFilter?: number | null;
  onClearAnimationIdFilter?: () => void;
}

export const statImages: Record<keyof Levels, string> = {
  attack: attackImage,
  strength: strengthImage,
  defence: defenceImage,
  ranged: rangedImage,
  magic: magicImage,
  hitpoints: hitpointsImage,
  prayer: prayerImage,
  sailing: sailingImage,
};

const getItemImageUrl = (itemId: number): string => {
  return `https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemId}.png`;
};

const getFilterTextColor = (
  filter: ActorFilter,
  loggedInPlayer: string,
): string => {
  if (filter.name === loggedInPlayer) {
    return colors.text.player;
  }
  if (isUnknownPlayer(filter.name)) {
    return colors.text.unknown;
  }
  return colors.text.other;
};

const getFilterMenuPaperProps = (anchorEl: HTMLElement | null) => ({
  sx: {
    maxHeight: "200px",
    minWidth: Math.max(anchorEl?.offsetWidth ?? 0, 160),
    bgcolor: colors.background.surface,
    "& .MuiMenuItem-root": {
      whiteSpace: "nowrap",
    },
  },
});

const getSourceTextClass = getPlayerNameTextClass;

export const renderStatImages = (levels: Levels) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {Object.entries(levels).map(([stat, value], index) => (
        <div
          key={index}
          style={{ display: "inline-block", marginRight: "10px" }}
        >
          <img
            src={statImages[stat as keyof Levels]}
            alt={stat}
            style={{
              marginRight: "5px",
              height: "18px",
              verticalAlign: "middle",
            }}
          />
          <span style={{ verticalAlign: "middle" }}>{value}</span>
        </div>
      ))}
    </div>
  );
};

const EventsTable: React.FC<EventsTableProps> = ({
  fight,
  allLogs,
  maxHeight,
  variant = "default",
  showSource: _showSource = false,
  sourceFilter = null,
  targetFilter = null,
  dataSourceFilter = sourceFilter,
  dataTargetFilter = targetFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  equipmentFilter = null,
  dataEquipmentFilter = equipmentFilter,
  onSelectEquipmentFilter,
  onClearEquipmentFilter,
  prayerFilter = null,
  dataPrayerFilter = prayerFilter,
  onSelectPrayerFilter,
  onClearPrayerFilter,
  hitsplatFilter = null,
  dataHitsplatFilter = hitsplatFilter,
  onSelectHitsplatFilter,
  onClearHitsplatFilter,
  hitsplatTypeFilter = null,
  dataHitsplatTypeFilter = hitsplatTypeFilter,
  onSelectHitsplatTypeFilter,
  onClearHitsplatTypeFilter,
  eventTypeFilter = null,
  dataEventTypeFilter = eventTypeFilter,
  onSelectEventTypeFilter,
  onClearEventTypeFilter,
  eventTimeFilter = null,
  dataEventTimeFilter = eventTimeFilter,
  onClearEventTimeFilter,
  animationIdFilter = null,
  dataAnimationIdFilter = animationIdFilter,
  onClearAnimationIdFilter,
}) => {
  const loggedInPlayer = fight.loggedInPlayer;
  const isDamageVariant = variant === "damage";
  const [sourceMenuAnchor, setSourceMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [targetMenuAnchor, setTargetMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  const dataSource = allLogs ?? fight.data;

  const equipmentTimelines = useMemo(
    () => buildEquipmentTimelines(dataSource),
    [dataSource],
  );

  const prayerTimelines = useMemo(
    () => buildPrayerTimelines(dataSource),
    [dataSource],
  );

  const [asyncLogs, setAsyncLogs] = useState<LogLine[] | null>(
    isDamageVariant ? [] : null,
  );

  useEffect(() => {
    if (isDamageVariant) {
      return;
    }

    setAsyncLogs(null);

    const timeoutId = window.setTimeout(() => {
      const filteredLogs = fight.data.filter((log) => {
        if (!matchesLogActorFilters(log, dataSourceFilter, dataTargetFilter)) {
          return false;
        }
        if (
          !matchesEquipmentFilter(
            log,
            equipmentTimelines,
            dataEquipmentFilter,
            dataSourceFilter,
            dataTargetFilter,
          )
        ) {
          return false;
        }
        if (
          !matchesPrayerFilter(
            log,
            prayerTimelines,
            dataPrayerFilter,
            dataSourceFilter,
            dataTargetFilter,
          )
        ) {
          return false;
        }
        if (!matchesHitsplatFilter(log, dataHitsplatFilter)) {
          return false;
        }
        if (!matchesHitsplatTypeFilter(log, dataHitsplatTypeFilter)) {
          return false;
        }
        if (dataEventTypeFilter && log.type !== dataEventTypeFilter) {
          return false;
        }
        if (!matchesEventTimeFilter(log, dataEventTimeFilter)) {
          return false;
        }
        if (!matchesAnimationIdFilter(log, dataAnimationIdFilter)) {
          return false;
        }
        return true;
      });

      setAsyncLogs(filteredLogs);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    isDamageVariant,
    fight.data,
    dataSourceFilter,
    dataTargetFilter,
    dataEquipmentFilter,
    dataPrayerFilter,
    dataHitsplatFilter,
    dataHitsplatTypeFilter,
    dataEventTypeFilter,
    dataEventTimeFilter,
    dataAnimationIdFilter,
    equipmentTimelines,
    prayerTimelines,
  ]);

  const logs = isDamageVariant ? fight.data : (asyncLogs ?? []);
  const filtersPending =
    dataSourceFilter !== sourceFilter ||
    dataTargetFilter !== targetFilter ||
    dataEquipmentFilter !== equipmentFilter ||
    dataPrayerFilter !== prayerFilter ||
    dataHitsplatFilter !== hitsplatFilter ||
    dataHitsplatTypeFilter !== hitsplatTypeFilter ||
    dataEventTypeFilter !== eventTypeFilter ||
    dataEventTimeFilter !== eventTimeFilter ||
    dataAnimationIdFilter !== animationIdFilter;
  const isLoading = !isDamageVariant && (asyncLogs === null || filtersPending);

  const sourceSpecificIds = useMemo(
    () =>
      sourceFilter
        ? getActorSpecificIds(dataSource, "source", sourceFilter.name)
        : [],
    [dataSource, sourceFilter],
  );

  const targetMenuNpcIds = useMemo(() => {
    if (!targetFilter) {
      return [];
    }

    const damageLogs = dataSource.filter(
      (log) => log.type === LogTypes.DAMAGE,
    ) as DamageLog[];
    return getDistinctTargetNpcIds(damageLogs, targetFilter);
  }, [dataSource, targetFilter]);

  const targetMenuIndexes = useMemo(() => {
    if (!targetFilter || targetFilter.id === undefined) {
      return [];
    }

    const damageLogs = dataSource.filter(
      (log) => log.type === LogTypes.DAMAGE,
    ) as DamageLog[];
    return getDistinctTargetIndexes(damageLogs, targetFilter);
  }, [dataSource, targetFilter]);

  const renderPrayerImages = (prayers: string[]) => {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {prayers.map((prayerIdStr, index) => {
          const prayerId = parseInt(prayerIdStr, 10);
          if (prayerId <= 0) {
            return null;
          }

          const prayerImage = prayerImages[prayerId];
          if (prayerImage) {
            return (
              <div
                key={index}
                className={onSelectPrayerFilter ? "link" : undefined}
                style={{
                  display: "inline-block",
                  marginLeft: "0px",
                  cursor: onSelectPrayerFilter ? "pointer" : "default",
                }}
                onClick={() => {
                  if (onSelectPrayerFilter) {
                    onSelectPrayerFilter({
                      id: prayerId,
                      name: prayerIdMap[prayerId] || `Prayer ${prayerId}`,
                    });
                  }
                }}
              >
                <img
                  src={prayerImage}
                  alt={`Prayer ${prayerId}`}
                  style={{
                    scale: "0.75",
                    verticalAlign: "middle",
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const hasFilterControls =
    onSelectEventTypeFilter ||
    onSelectSourceFilter ||
    onSelectTargetFilter ||
    onSelectEquipmentFilter ||
    onSelectPrayerFilter ||
    onSelectHitsplatTypeFilter ||
    onSelectHitsplatFilter;

  return (
    <>
      {hasFilterControls && (
        <FilterSearchBar
          fight={{ ...fight, data: allLogs ?? fight.data }}
          variant={variant}
          onSelectEventTypeFilter={onSelectEventTypeFilter}
          onSelectSourceFilter={onSelectSourceFilter}
          onSelectTargetFilter={onSelectTargetFilter}
          onSelectEquipmentFilter={onSelectEquipmentFilter}
          onSelectPrayerFilter={onSelectPrayerFilter}
          onSelectHitsplatTypeFilter={onSelectHitsplatTypeFilter}
          onSelectHitsplatFilter={onSelectHitsplatFilter}
        />
      )}
      {(sourceFilter ||
        targetFilter ||
        equipmentFilter ||
        prayerFilter ||
        hitsplatTypeFilter ||
        hitsplatFilter ||
        eventTypeFilter ||
        eventTimeFilter != null ||
        animationIdFilter != null) && (
        <Box
          sx={{
            width: "100%",
            maxWidth: `${layout.contentMaxWidth}px`,
            mb: 1,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {sourceFilter && (
            <>
              <Chip
                label={`Source: ${sourceFilter.name}${sourceFilter.index !== undefined ? ` - ${sourceFilter.index}` : ""}`}
                onDelete={onClearSourceFilter}
                onClick={(e) => setSourceMenuAnchor(e.currentTarget)}
                icon={
                  <ArrowDropDownIcon
                    sx={{
                      color: getFilterTextColor(sourceFilter, loggedInPlayer),
                    }}
                  />
                }
                size="small"
                sx={{
                  bgcolor: colors.background.surface,
                  color: getFilterTextColor(sourceFilter, loggedInPlayer),
                  border: "1px solid grey",
                  borderRadius: "5px",
                  "& .MuiChip-label": {
                    fontSize: "0.9rem",
                    paddingLeft: "10px",
                    paddingRight: "10px",
                  },
                  "& .MuiChip-deleteIcon": {
                    color: getFilterTextColor(sourceFilter, loggedInPlayer),
                    fontSize: "1.05rem",
                    marginRight: "6px",
                  },
                  "& .MuiChip-deleteIcon:hover": {
                    color: getFilterTextColor(sourceFilter, loggedInPlayer),
                  },
                }}
              />
              <Menu
                anchorEl={sourceMenuAnchor}
                open={Boolean(sourceMenuAnchor)}
                onClose={() => setSourceMenuAnchor(null)}
                PaperProps={getFilterMenuPaperProps(sourceMenuAnchor)}
              >
                <MenuItem
                  onClick={() => {
                    if (onSelectSourceFilter) {
                      onSelectSourceFilter({ name: sourceFilter.name });
                    }
                    setSourceMenuAnchor(null);
                  }}
                >
                  All IDs
                </MenuItem>
                {sourceSpecificIds.map((specificId) => (
                  <MenuItem
                    key={`source-id-${specificId}`}
                    onClick={() => {
                      if (onSelectSourceFilter) {
                        onSelectSourceFilter({
                          name: sourceFilter.name,
                          index: specificId,
                        });
                      }
                      setSourceMenuAnchor(null);
                    }}
                  >
                    {specificId}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          {targetFilter && (
            <>
              <Chip
                label={formatTargetFilterLabel(targetFilter)}
                onDelete={onClearTargetFilter}
                onClick={(e) => setTargetMenuAnchor(e.currentTarget)}
                icon={
                  <ArrowDropDownIcon
                    sx={{
                      color: getFilterTextColor(targetFilter, loggedInPlayer),
                    }}
                  />
                }
                size="small"
                sx={{
                  bgcolor: colors.background.surface,
                  color: getFilterTextColor(targetFilter, loggedInPlayer),
                  border: "1px solid grey",
                  borderRadius: "5px",
                  "& .MuiChip-label": {
                    fontSize: "0.9rem",
                    paddingLeft: "10px",
                    paddingRight: "10px",
                  },
                  "& .MuiChip-deleteIcon": {
                    color: getFilterTextColor(targetFilter, loggedInPlayer),
                    fontSize: "1.05rem",
                    marginRight: "6px",
                  },
                  "& .MuiChip-deleteIcon:hover": {
                    color: getFilterTextColor(targetFilter, loggedInPlayer),
                  },
                }}
              />
              <Menu
                anchorEl={targetMenuAnchor}
                open={Boolean(targetMenuAnchor)}
                onClose={() => setTargetMenuAnchor(null)}
                PaperProps={getFilterMenuPaperProps(targetMenuAnchor)}
              >
                <MenuItem
                  onClick={() => {
                    if (onSelectTargetFilter) {
                      if (targetFilter.index !== undefined) {
                        onSelectTargetFilter({
                          name: targetFilter.name,
                          ...(targetFilter.id !== undefined
                            ? { id: targetFilter.id }
                            : {}),
                        });
                      } else if (targetFilter.id !== undefined) {
                        onSelectTargetFilter({ name: targetFilter.name });
                      }
                    }
                    setTargetMenuAnchor(null);
                  }}
                  disabled={
                    targetFilter.id === undefined &&
                    targetFilter.index === undefined
                  }
                >
                  {targetFilter.index !== undefined ? "All indexes" : "All IDs"}
                </MenuItem>
                {targetFilter.id === undefined &&
                  targetFilter.index === undefined &&
                  targetMenuNpcIds.map((npcId) => (
                    <MenuItem
                      key={`target-npc-id-${npcId}`}
                      onClick={() => {
                        if (onSelectTargetFilter) {
                          onSelectTargetFilter({
                            name: targetFilter.name,
                            id: npcId,
                          });
                        }
                        setTargetMenuAnchor(null);
                      }}
                    >
                      ID {npcId}
                    </MenuItem>
                  ))}
                {targetFilter.id !== undefined &&
                  targetFilter.index === undefined &&
                  targetMenuIndexes.map((index) => (
                    <MenuItem
                      key={`target-index-${index}`}
                      onClick={() => {
                        if (onSelectTargetFilter) {
                          onSelectTargetFilter({
                            name: targetFilter.name,
                            id: targetFilter.id,
                            index,
                          });
                        }
                        setTargetMenuAnchor(null);
                      }}
                    >
                      Index {index}
                    </MenuItem>
                  ))}
                {targetFilter.index !== undefined &&
                  targetMenuIndexes
                    .filter((index) => index !== targetFilter.index)
                    .map((index) => (
                      <MenuItem
                        key={`target-index-${index}`}
                        onClick={() => {
                          if (onSelectTargetFilter) {
                            onSelectTargetFilter({
                              name: targetFilter.name,
                              ...(targetFilter.id !== undefined
                                ? { id: targetFilter.id }
                                : {}),
                              index,
                            });
                          }
                          setTargetMenuAnchor(null);
                        }}
                      >
                        Index {index}
                      </MenuItem>
                    ))}
              </Menu>
            </>
          )}
          {equipmentFilter && (
            <Chip
              label={`Equipment: ${equipmentFilter.name || itemIdMap[equipmentFilter.id] || equipmentFilter.id}`}
              onDelete={onClearEquipmentFilter}
              icon={
                <AppTooltip
                  title="Equipment filter is based on when an event was recorded. However, some actions, such as projectile damage, may have been initiated while different equipment was equipped."
                  arrow
                >
                  <ErrorOutlineIcon
                    sx={{
                      color: "#f44336 !important",
                      fontSize: "1.05rem",
                    }}
                  />
                </AppTooltip>
              }
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-icon": {
                  marginLeft: "8px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {prayerFilter && (
            <Chip
              label={`Prayer: ${prayerFilter.name || prayerIdMap[prayerFilter.id] || prayerFilter.id}`}
              onDelete={onClearPrayerFilter}
              icon={
                <AppTooltip
                  title="Prayer filter is based on when an event was recorded. Active prayers and overhead prayers are tracked separately in the log."
                  arrow
                >
                  <ErrorOutlineIcon
                    sx={{
                      color: "#f44336 !important",
                      fontSize: "1.05rem",
                    }}
                  />
                </AppTooltip>
              }
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-icon": {
                  marginLeft: "8px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {hitsplatTypeFilter && (
            <Chip
              label={formatHitsplatTypeFilterLabel(hitsplatTypeFilter)}
              onDelete={onClearHitsplatTypeFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {hitsplatFilter && (
            <Chip
              label={formatHitsplatFilterLabel(hitsplatFilter)}
              onDelete={onClearHitsplatFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {eventTypeFilter && (
            <Chip
              label={`Type: ${eventTypeFilter}`}
              onDelete={onClearEventTypeFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {eventTimeFilter != null && (
            <Chip
              label={`Time: ${formatHHmmss(eventTimeFilter, true)}`}
              onDelete={onClearEventTimeFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
          {animationIdFilter != null && (
            <Chip
              label={`Animation: ${animationIdFilter}`}
              onDelete={onClearAnimationIdFilter}
              size="small"
              sx={{
                bgcolor: colors.background.surface,
                color: "white",
                border: "1px solid grey",
                borderRadius: "5px",
                "& .MuiChip-label": {
                  fontSize: "0.9rem",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                },
                "& .MuiChip-deleteIcon": {
                  color: "white",
                  fontSize: "1.05rem",
                  marginRight: "6px",
                },
                "& .MuiChip-deleteIcon:hover": {
                  color: "white",
                },
              }}
            />
          )}
        </Box>
      )}
      <Box
        sx={{
          width: "100%",
          maxWidth: `${layout.contentMaxWidth}px`,
          maxHeight: {
            xs: "70vh",
            sm: "70vh",
            md: maxHeight,
          },
          overflowY: "auto",
        }}
      >
        <TableContainer
          sx={{
            "& .MuiTableCell-root": {
              fontSize: "13px",
              "@media (max-width: 768px)": {
                fontSize: "12px",
                padding: "2px 3px",
              },
            },
          }}
        >
          <Table style={{ tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "100px", textAlign: "center" }}>
                  Time
                </TableCell>
                <TableCell
                  style={{
                    width: isDamageVariant ? "200px" : "120px",
                    textAlign: "right",
                    paddingBottom: "2px",
                  }}
                >
                  Type
                </TableCell>
                {isDamageVariant ? (
                  <TableCell style={{ textAlign: "left" }}>Amount</TableCell>
                ) : (
                  <TableCell style={{ textAlign: "center" }}>Event</TableCell>
                )}
                <TableCell align="left" style={{ width: "200px" }}>
                  Source
                </TableCell>
                <TableCell align="left" style={{ width: "200px" }}>
                  Target
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 8, borderBottom: "none" }}
                  >
                    <CircularProgress color="inherit" />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => {
                  const source = getActorName(log, "source");
                  const target = getActorName(log, "target");
                  return (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                      style={{ cursor: "default" }}
                      onMouseEnter={(e) =>
                        e.currentTarget.classList.add("highlighted-row")
                      }
                      onMouseLeave={(e) =>
                        e.currentTarget.classList.remove("highlighted-row")
                      }
                    >
                      <TableCell>
                        {formatHHmmss(log.fightTimeMs!, true)}
                      </TableCell>
                      {isDamageVariant ? (
                        <>
                          <TableCell style={{ textAlign: "right" }}>
                            {onSelectHitsplatTypeFilter ? (
                              <span
                                className="link hitsplat-name"
                                onClick={() =>
                                  onSelectHitsplatTypeFilter({
                                    type: (log as DamageLog).hitsplatName,
                                  })
                                }
                              >
                                {(log as DamageLog).hitsplatName}
                              </span>
                            ) : (
                              <span className="hitsplat-name">
                                {(log as DamageLog).hitsplatName}
                              </span>
                            )}
                          </TableCell>
                          <TableCell style={{ textAlign: "left" }}>
                            {onSelectHitsplatFilter ? (
                              <span
                                className="link damage-amount"
                                onClick={() =>
                                  onSelectHitsplatFilter({
                                    amount: (log as DamageLog).damageAmount,
                                  })
                                }
                              >
                                {(log as DamageLog).damageAmount}
                              </span>
                            ) : (
                              <span className="damage-amount">
                                {(log as DamageLog).damageAmount}
                              </span>
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell
                            style={{ width: "120px", textAlign: "right" }}
                          >
                            {onSelectEventTypeFilter ? (
                              <span
                                className="link"
                                onClick={() =>
                                  onSelectEventTypeFilter(log.type)
                                }
                              >
                                {log.type}
                              </span>
                            ) : (
                              log.type
                            )}
                          </TableCell>
                          <TableCell>
                            {log.type === LogTypes.LOG_VERSION
                              ? `Log version ${log.logVersion}`
                              : ""}
                            {log.type === LogTypes.LOGGED_IN_PLAYER
                              ? `Logged in player ${log.loggedInPlayer}`
                              : ""}
                            {log.type === LogTypes.PLAYER_REGION
                              ? `${log.playerRegion}`
                              : ""}
                            {log.type === LogTypes.BASE_LEVELS
                              ? renderStatImages(log.baseLevels)
                              : ""}
                            {log.type === LogTypes.BOOSTED_LEVELS
                              ? renderStatImages(log.boostedLevels)
                              : ""}
                            {log.type === LogTypes.PRAYER
                              ? renderPrayerImages(log.prayers)
                              : ""}
                            {log.type === LogTypes.OVERHEAD
                              ? renderPrayerImages([log.overhead])
                              : ""}
                            {log.type === LogTypes.PLAYER_EQUIPMENT &&
                            Array.isArray(log.playerEquipment) ? (
                              <div style={{ display: "flex" }}>
                                {log.playerEquipment.map(
                                  (itemId: string, i: number) => {
                                    const id = parseInt(itemId);
                                    return id > 0 ? (
                                      <div
                                        key={i}
                                        className={
                                          onSelectEquipmentFilter
                                            ? "link"
                                            : undefined
                                        }
                                        style={{
                                          width: "22px",
                                          overflow: "hidden",
                                          marginRight: "5px",
                                          backgroundColor: "#494945",
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                          cursor: onSelectEquipmentFilter
                                            ? "pointer"
                                            : "default",
                                        }}
                                        onClick={() => {
                                          if (onSelectEquipmentFilter) {
                                            onSelectEquipmentFilter({
                                              id,
                                              name:
                                                itemIdMap[id] || `Item ${id}`,
                                            });
                                          }
                                        }}
                                      >
                                        <img
                                          src={getItemImageUrl(id)}
                                          alt={`Item ${itemId}`}
                                          style={{ height: "22px" }}
                                        />
                                      </div>
                                    ) : null;
                                  },
                                )}
                              </div>
                            ) : (
                              ""
                            )}
                            {log.type === LogTypes.DAMAGE ? (
                              <>
                                <span className="hitsplat-name">
                                  {log.hitsplatName}{" "}
                                </span>
                                <span className="damage-amount">
                                  {log.damageAmount}
                                </span>
                              </>
                            ) : (
                              ""
                            )}
                            {log.type === LogTypes.HEAL ? (
                              <>
                                <span className="hitsplat-name">
                                  {log.hitsplatName}{" "}
                                </span>
                                <span className="heal-amount">
                                  {log.healAmount}
                                </span>
                              </>
                            ) : (
                              ""
                            )}
                            {log.type === LogTypes.PLAYER_ATTACK_ANIMATION ? (
                              <>
                                <span className="attack-animation-text">
                                  {formatAttackAnimationEventDetail(log)}{" "}
                                </span>
                              </>
                            ) : (
                              ""
                            )}
                            {log.type === LogTypes.POSITION
                              ? `(${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.GRAPHICS_OBJECT_SPAWNED
                              ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.GRAPHICS_OBJECT_DESPAWNED
                              ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.GAME_OBJECT_SPAWNED
                              ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.GAME_OBJECT_DESPAWNED
                              ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.GROUND_OBJECT_SPAWNED
                              ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.GROUND_OBJECT_DESPAWNED
                              ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})`
                              : ""}
                            {log.type === LogTypes.NPC_CHANGED
                              ? `Changed ID: ${log.oldNpc.id} -> ${log.newNpc.id}`
                              : ""}
                            {log.type === LogTypes.WAVE_START}
                            {log.type === LogTypes.WAVE_END}
                            {log.type === LogTypes.PATH_START
                              ? `${log.pathName}`
                              : ""}
                            {log.type === LogTypes.PATH_COMPLETE
                              ? `${log.pathName}`
                              : ""}
                            {log.type === LogTypes.DURATION
                              ? `${log.duration}`
                              : ""}
                          </TableCell>
                        </>
                      )}
                      <TableCell
                        className={getSourceTextClass(source, loggedInPlayer)}
                      >
                        {(() => {
                          const sourceActor = getActorFromLog(log, "source");
                          return sourceActor && onSelectSourceFilter ? (
                            <span
                              className="link"
                              onClick={() =>
                                onSelectSourceFilter({
                                  name: sourceActor.name,
                                })
                              }
                            >
                              {source}
                            </span>
                          ) : (
                            source
                          );
                        })()}
                      </TableCell>
                      <TableCell
                        className={
                          target === loggedInPlayer
                            ? "logged-in-player-text"
                            : "other-text"
                        }
                      >
                        {(() => {
                          const targetActor = getActorFromLog(log, "target");
                          return targetActor && onSelectTargetFilter ? (
                            <span
                              className="link"
                              onClick={() =>
                                onSelectTargetFilter({
                                  name: targetActor.name,
                                })
                              }
                            >
                              {target}
                            </span>
                          ) : (
                            target
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default EventsTable;
