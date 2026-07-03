import React, { useEffect, useState } from "react";
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
import { LogLine, LogTypes } from "../models/LogLine";
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
  isUnknownPlayer,
} from "../utils/actorUtils";
import { itemIdMap } from "../lib/itemIdMap";
import { prayerIdMap } from "../lib/prayerIdMap";
import { prayerImages } from "../lib/prayerImages";
import FilterSearchBar from "./FilterSearchBar";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface EventsTableProps {
  fight: Fight;
  allLogs?: LogLine[];
  maxHeight: string;
  showSource?: boolean;
  sourceFilter?: ActorFilter | null;
  targetFilter?: ActorFilter | null;
  onSelectSourceFilter?: (filter: ActorFilter) => void;
  onSelectTargetFilter?: (filter: ActorFilter) => void;
  onClearSourceFilter?: () => void;
  onClearTargetFilter?: () => void;
  equipmentFilter?: EquipmentFilter | null;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onClearEquipmentFilter?: () => void;
  prayerFilter?: PrayerFilter | null;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onClearPrayerFilter?: () => void;
  eventTypeFilter?: string | null;
  onSelectEventTypeFilter?: (eventType: string) => void;
  onClearEventTypeFilter?: () => void;
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

const getSourceTextClass = (source: string, loggedInPlayer: string): string => {
  if (source === loggedInPlayer) {
    return "logged-in-player-text";
  }
  if (isUnknownPlayer(source)) {
    return "unknown-text";
  }
  return "other-text";
};

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
  showSource: _showSource = false,
  sourceFilter = null,
  targetFilter = null,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  equipmentFilter = null,
  onSelectEquipmentFilter,
  onClearEquipmentFilter,
  prayerFilter = null,
  onSelectPrayerFilter,
  onClearPrayerFilter,
  eventTypeFilter = null,
  onSelectEventTypeFilter,
  onClearEventTypeFilter,
}) => {
  const loggedInPlayer = fight.loggedInPlayer;
  const [sourceMenuAnchor, setSourceMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [targetMenuAnchor, setTargetMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [logs, setLogs] = useState<LogLine[] | null>(null);
  const [sourceSpecificIds, setSourceSpecificIds] = useState<number[]>([]);
  const [targetSpecificIds, setTargetSpecificIds] = useState<number[]>([]);

  useEffect(() => {
    setLogs(null);

    const timeoutId = window.setTimeout(() => {
      const dataSource = allLogs ?? fight.data;
      const equipmentTimelines = buildEquipmentTimelines(dataSource);
      const prayerTimelines = buildPrayerTimelines(dataSource);
      const filteredLogs = fight.data.filter((log) => {
        if (!matchesLogActorFilters(log, sourceFilter, targetFilter)) {
          return false;
        }
        if (
          !matchesEquipmentFilter(
            log,
            equipmentTimelines,
            equipmentFilter,
            sourceFilter,
            targetFilter,
          )
        ) {
          return false;
        }
        if (
          !matchesPrayerFilter(
            log,
            prayerTimelines,
            prayerFilter,
            sourceFilter,
            targetFilter,
          )
        ) {
          return false;
        }
        if (eventTypeFilter && log.type !== eventTypeFilter) {
          return false;
        }
        return true;
      });

      setLogs(filteredLogs);
      setSourceSpecificIds(
        sourceFilter
          ? getActorSpecificIds(fight.data, "source", sourceFilter.name)
          : [],
      );
      setTargetSpecificIds(
        targetFilter
          ? getActorSpecificIds(fight.data, "target", targetFilter.name)
          : [],
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    allLogs,
    fight.data,
    sourceFilter,
    targetFilter,
    equipmentFilter,
    prayerFilter,
    eventTypeFilter,
  ]);

  const isLoading = logs === null;

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
    onSelectSourceFilter ||
    onSelectTargetFilter ||
    onSelectEquipmentFilter ||
    onSelectPrayerFilter;

  return (
    <>
      {hasFilterControls && (
        <FilterSearchBar
          fight={{ ...fight, data: allLogs ?? fight.data }}
          onSelectSourceFilter={onSelectSourceFilter}
          onSelectTargetFilter={onSelectTargetFilter}
          onSelectEquipmentFilter={onSelectEquipmentFilter}
          onSelectPrayerFilter={onSelectPrayerFilter}
        />
      )}
      {(sourceFilter ||
        targetFilter ||
        equipmentFilter ||
        prayerFilter ||
        eventTypeFilter) && (
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
                PaperProps={{
                  sx: {
                    maxHeight: "200px",
                    minWidth: "100px",
                    "& .MuiMenu-list": {
                      paddingRight: "12px",
                    },
                  },
                }}
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
                label={`Target: ${targetFilter.name}${targetFilter.index !== undefined ? ` - ${targetFilter.index}` : ""}`}
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
                PaperProps={{
                  sx: {
                    maxHeight: "200px",
                    width: "100px",
                    "& .MuiMenu-list": {
                      paddingRight: "12px",
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    if (onSelectTargetFilter) {
                      onSelectTargetFilter({ name: targetFilter.name });
                    }
                    setTargetMenuAnchor(null);
                  }}
                >
                  All IDs
                </MenuItem>
                {targetSpecificIds.map((specificId) => (
                  <MenuItem
                    key={`target-id-${specificId}`}
                    onClick={() => {
                      if (onSelectTargetFilter) {
                        onSelectTargetFilter({
                          name: targetFilter.name,
                          index: specificId,
                        });
                      }
                      setTargetMenuAnchor(null);
                    }}
                  >
                    {specificId}
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
                <TableCell style={{ width: "50px", textAlign: "center" }}>
                  Time
                </TableCell>
                <TableCell
                  style={{
                    width: "120px",
                    textAlign: "right",
                    paddingBottom: "2px",
                  }}
                >
                  Type
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>Event</TableCell>
                <TableCell style={{ width: "100px", textAlign: "center" }}>
                  Source
                </TableCell>
                <TableCell style={{ width: "100px", textAlign: "center" }}>
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
                      <TableCell style={{ width: "120px", textAlign: "right" }}>
                        {onSelectEventTypeFilter ? (
                          <span
                            className="link"
                            onClick={() => onSelectEventTypeFilter(log.type)}
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
                                          name: itemIdMap[id] || `Item ${id}`,
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
                              {log.animationId}{" "}
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
