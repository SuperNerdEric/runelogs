import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { TableComponents, TableVirtuoso } from "react-virtuoso";
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
  getPlayerNameTextClass,
} from "../utils/actorUtils";
import { itemIdMap } from "../lib/itemIdMap";
import { prayerIdMap } from "../lib/prayerIdMap";
import { prayerImages } from "../lib/prayerImages";
import { HitsplatFilter, matchesHitsplatFilter } from "../utils/hitsplatFilter";
import {
  HitsplatTypeFilter,
  matchesHitsplatTypeFilter,
} from "../utils/hitsplatTypeFilter";
import { matchesEventTimeFilter } from "../utils/eventTimeFilter";
import { matchesAnimationIdFilter } from "../utils/animationIdFilter";
import { buildTobBossHpByLog } from "../utils/tobBossHealth";
import { isTimeRangeSeed } from "../utils/timeRangeFilter";
import EncounterFilterBar from "./filters/EncounterFilterBar";

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

const spellbookNames: Record<number, string> = {
  0: "Standard",
  1: "Ancient",
  2: "Lunar",
  3: "Arceuus",
};

const formatItemQuantity = (quantity: number): string => {
  if (quantity >= 10_000_000) {
    return `${Math.floor(quantity / 1_000_000)}M`;
  }
  if (quantity >= 100_000) {
    return `${Math.floor(quantity / 1000)}K`;
  }
  return `${quantity}`;
};

/** Renders a compact list of item icons (inventory / rune pouch) with stack sizes. */
const renderItemList = (items: { id: number; quantity: number }[]) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
      {items.map((item, i) =>
        item.id > 0 ? (
          <div
            key={i}
            style={{
              position: "relative",
              width: "22px",
              height: "22px",
              overflow: "hidden",
              backgroundColor: "#494945",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={getItemImageUrl(item.id)}
              alt={`Item ${item.id}`}
              style={{ height: "22px" }}
            />
            {item.quantity > 1 && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: 1,
                  fontSize: "9px",
                  lineHeight: "9px",
                  color: "#ffff00",
                  textShadow: "1px 1px 0 #000",
                  pointerEvents: "none",
                }}
              >
                {formatItemQuantity(item.quantity)}
              </span>
            )}
          </div>
        ) : (
          <div
            key={i}
            style={{
              width: "22px",
              height: "22px",
              backgroundColor: "#3a3a37",
            }}
          />
        ),
      )}
    </div>
  );
};

/**
 * Formats the target's logged health for display "as is": the RuneLite health bar
 * (`ratio/scale`).
 */
const formatTargetHealth = (log: {
  targetHealthRatio?: number;
  targetHealthScale?: number;
}): string | null => {
  if (log.targetHealthRatio == null || log.targetHealthScale == null) {
    return null;
  }
  return `${log.targetHealthRatio}/${log.targetHealthScale}`;
};

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

/** Rows are virtualized: a fight can have thousands, and each is costly to render. */
/** The top and bottom border of the container. */
const EVENTS_TABLE_BORDER_HEIGHT = 2;

const EVENTS_TABLE_COMPONENTS: TableComponents<LogLine> = {
  // A TableContainer so the list keeps the theme's border, corners and shadow.
  Scroller: React.forwardRef<HTMLDivElement>(
    function EventsTableScroller(props, ref) {
      return (
        <TableContainer
          {...props}
          ref={ref}
          sx={{ margin: 0, overflowX: "auto" }}
        />
      );
    },
  ),
  Table: (props) => (
    <Table
      {...props}
      style={{ ...props.style, tableLayout: "fixed", minWidth: 640 }}
    />
  ),
  TableHead: React.forwardRef<HTMLTableSectionElement>(
    function EventsTableHead(props, ref) {
      return (
        <TableHead
          {...props}
          ref={ref}
          sx={{ bgcolor: colors.background.surface }}
        />
      );
    },
  ),
  TableBody: React.forwardRef<HTMLTableSectionElement>(
    function EventsTableBody(props, ref) {
      return <TableBody {...props} ref={ref} />;
    },
  ),
  TableRow: ({ item: _item, ...props }) => (
    <TableRow
      {...props}
      className={props["data-index"] % 2 === 0 ? "even-row" : "odd-row"}
      style={{ ...props.style, cursor: "default" }}
      onMouseEnter={(e) => e.currentTarget.classList.add("highlighted-row")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("highlighted-row")}
    />
  ),
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
  const dataSource = allLogs ?? fight.data;
  // Starts unbounded so the list has room to measure itself; the CSS caps it.
  const [listHeight, setListHeight] = useState(100000);

  const equipmentTimelines = useMemo(
    () => buildEquipmentTimelines(dataSource),
    [dataSource],
  );

  const prayerTimelines = useMemo(
    () => buildPrayerTimelines(dataSource),
    [dataSource],
  );

  const tobBossHpByLog = useMemo(
    () => buildTobBossHpByLog(dataSource),
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
        if (isTimeRangeSeed(log)) {
          return false;
        }
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

  const renderEventRow = (_index: number, log: LogLine) => {
    const source = getActorName(log, "source");
    const target = getActorName(log, "target");
    return (
      <>
        <TableCell>{formatHHmmss(log.fightTimeMs!, true)}</TableCell>
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
              {formatTargetHealth(log as DamageLog) != null && (
                <span className="target-health">
                  {" "}
                  ({formatTargetHealth(log as DamageLog)})
                </span>
              )}
            </TableCell>
          </>
        ) : (
          <>
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
              {log.type === LogTypes.PLAYER_REGION ? `${log.playerRegion}` : ""}
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
                  {log.playerEquipment.map((itemId: string, i: number) => {
                    const id = parseInt(itemId);
                    return id > 0 ? (
                      <div
                        key={i}
                        className={onSelectEquipmentFilter ? "link" : undefined}
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
                  })}
                </div>
              ) : (
                ""
              )}
              {log.type === LogTypes.PLAYER_INVENTORY &&
              Array.isArray(log.inventory)
                ? renderItemList(log.inventory)
                : ""}
              {log.type === LogTypes.RUNE_POUCH && Array.isArray(log.runePouch)
                ? renderItemList(log.runePouch)
                : ""}
              {log.type === LogTypes.SPELLBOOK
                ? (spellbookNames[log.spellbook] ??
                  `Spellbook ${log.spellbook}`)
                : ""}
              {log.type === LogTypes.SPECIAL_ATTACK
                ? `${log.specialAttack}%`
                : ""}
              {log.type === LogTypes.DAMAGE ? (
                <>
                  <span className="hitsplat-name">{log.hitsplatName} </span>
                  <span className="damage-amount">{log.damageAmount}</span>
                  {formatTargetHealth(log) != null && (
                    <span className="target-health">
                      {" "}
                      ({formatTargetHealth(log)})
                    </span>
                  )}
                </>
              ) : (
                ""
              )}
              {log.type === LogTypes.HEAL ? (
                <>
                  <span className="hitsplat-name">{log.hitsplatName} </span>
                  <span className="heal-amount">{log.healAmount}</span>
                  {formatTargetHealth(log) != null && (
                    <span className="target-health">
                      {" "}
                      ({formatTargetHealth(log)})
                    </span>
                  )}
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
              {log.type === LogTypes.PATH_START ? `${log.pathName}` : ""}
              {log.type === LogTypes.PATH_COMPLETE ? `${log.pathName}` : ""}
              {log.type === LogTypes.DURATION ? `${log.duration}` : ""}
              {log.type === LogTypes.TOB_SCALE ? `Scale: ${log.scale}` : ""}
              {log.type === LogTypes.RAID_PARTY
                ? `Scale: ${log.scale}  Party: ${log.names.join(", ")}${log.spectateMode === 2 ? "  (spectating)" : ""}`
                : ""}
              {log.type === LogTypes.COX_RAID_COMPLETE
                ? `Scale: ${log.partySize}  Party: ${log.teamPoints.toLocaleString()}  Player: ${log.playerPoints.toLocaleString()}`
                : ""}
              {log.type === LogTypes.COX_RAID_MODE
                ? log.challengeMode
                  ? "Challenge Mode"
                  : "Normal"
                : ""}
              {log.type === LogTypes.TOB_BOSS_HP
                ? (() => {
                    const hp = tobBossHpByLog.get(log);
                    const percent = (log.value / 10).toFixed(1);
                    return hp
                      ? `${hp.current} / ${hp.max} (${percent}%)`
                      : `${percent}%`;
                  })()
                : ""}
            </TableCell>
          </>
        )}
        <TableCell className={getSourceTextClass(source, loggedInPlayer)}>
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
            target === loggedInPlayer ? "logged-in-player-text" : "other-text"
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
      </>
    );
  };

  return (
    <>
      {!isDamageVariant && (
        <EncounterFilterBar
          fight={fight}
          sourceFilter={sourceFilter}
          targetFilter={targetFilter}
          onSelectSourceFilter={onSelectSourceFilter}
          onSelectTargetFilter={onSelectTargetFilter}
          onClearSourceFilter={onClearSourceFilter}
          onClearTargetFilter={onClearTargetFilter}
          equipmentFilter={equipmentFilter}
          onSelectEquipmentFilter={onSelectEquipmentFilter}
          onClearEquipmentFilter={onClearEquipmentFilter}
          prayerFilter={prayerFilter}
          onSelectPrayerFilter={onSelectPrayerFilter}
          onClearPrayerFilter={onClearPrayerFilter}
          hitsplatFilter={hitsplatFilter}
          onSelectHitsplatFilter={onSelectHitsplatFilter}
          onClearHitsplatFilter={onClearHitsplatFilter}
          hitsplatTypeFilter={hitsplatTypeFilter}
          onSelectHitsplatTypeFilter={onSelectHitsplatTypeFilter}
          onClearHitsplatTypeFilter={onClearHitsplatTypeFilter}
          eventTypeFilter={eventTypeFilter}
          onSelectEventTypeFilter={onSelectEventTypeFilter}
          onClearEventTypeFilter={onClearEventTypeFilter}
          eventTimeFilter={eventTimeFilter}
          onClearEventTimeFilter={onClearEventTimeFilter}
          animationIdFilter={animationIdFilter}
          onClearAnimationIdFilter={onClearAnimationIdFilter}
        />
      )}
      <Box
        style={
          { "--events-list-height": `${listHeight}px` } as React.CSSProperties
        }
        sx={{
          width: "100%",
          maxWidth: `${layout.contentMaxWidth}px`,
          mb: "15px",
          height: {
            xs: "min(var(--events-list-height), 70vh)",
            md: `min(var(--events-list-height), ${maxHeight})`,
          },
          "& .MuiTableCell-root": {
            fontSize: "13px",
            overflowWrap: "anywhere",
            "@media (max-width: 768px)": {
              fontSize: "12px",
              padding: "2px 3px",
            },
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : (
          <TableVirtuoso
            data={logs}
            style={{ height: "100%" }}
            components={EVENTS_TABLE_COMPONENTS}
            increaseViewportBy={400}
            totalListHeightChanged={(height) =>
              setListHeight(height + EVENTS_TABLE_BORDER_HEIGHT)
            }
            fixedHeaderContent={() => (
              <TableRow>
                <TableCell
                  sx={{ width: { xs: 80, md: 100 } }}
                  style={{ textAlign: "center" }}
                >
                  Time
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: 110, md: isDamageVariant ? 200 : 120 },
                  }}
                  style={{ textAlign: "right", paddingBottom: "2px" }}
                >
                  Type
                </TableCell>
                {isDamageVariant ? (
                  <TableCell style={{ textAlign: "left" }}>Amount</TableCell>
                ) : (
                  <TableCell style={{ textAlign: "center" }}>Event</TableCell>
                )}
                <TableCell align="left" sx={{ width: { xs: 110, md: 200 } }}>
                  Source
                </TableCell>
                <TableCell align="left" sx={{ width: { xs: 110, md: 200 } }}>
                  Target
                </TableCell>
              </TableRow>
            )}
            itemContent={renderEventRow}
          />
        )}
      </Box>
    </>
  );
};

export default React.memo(EventsTable);
