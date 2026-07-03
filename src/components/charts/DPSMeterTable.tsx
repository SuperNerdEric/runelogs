import { Fight } from "../../models/Fight";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import TableColumnHeaderTooltip from "../TableColumnHeaderTooltip";
import { COLUMN_TOOLTIPS } from "../../utils/columnTooltips";
import { DamageLog, LogTypes } from "../../models/LogLine";
import {
  getFightPerformanceByPlayer,
  getPercentColor,
  getTargetGroupActivityPercent,
} from "../../utils/TickActivity";
import { isUnknownPlayer } from "../../utils/actorUtils";
import { getPlayerDpsDisplayColor } from "../../utils/percentile";
import { BOAT_IDS, BOAT_ID_TO_NAME } from "../../utils/constants";
import {
  calculatePlayerDps,
  getFightDurationSeconds,
} from "../../utils/dpsCalculation";
import { ActorFilter } from "../../utils/actorFilter";
import { Actor } from "../../models/Actor";
import { colors } from "../../theme";
import {
  canDrillDownTargetRow,
  getNextTargetFilter,
  getTargetDrillDownDisplayName,
  getTargetDrillDownGroupKey,
  getTargetDrillDownRowActor,
  isTargetDrillDownActive,
  resolveTargetDrillDownGrouping,
  TargetDrillDownGrouping,
} from "../../utils/targetDrillDown";

interface DPSMeterBarChartProps {
  fight: Fight;
  filteredFight: Fight;
  drillDownLogs: DamageLog[];
  type: "damage-done" | "damage-taken";
  sourceFilter?: ActorFilter | null;
  targetFilter?: ActorFilter | null;
  dpsPercentiles?: Record<string, number>;
  onSelectSourceFilter: (filter: ActorFilter) => void;
  onSelectTargetFilter: (filter: ActorFilter) => void;
}

interface DPSData {
  actor: Actor;
  displayName: string;
  totalDamage: number;
  totalHits: number;
  successfulHits: number;
  activity: number;
  accuracy: number;
  dps: number;
}

const getDPSData = (
  fight: Fight,
  filteredFight: Fight,
  drillDownLogs: DamageLog[],
  type: "damage-done" | "damage-taken",
  sourceFilter: ActorFilter | null = null,
  targetFilter: ActorFilter | null = null,
): {
  dpsData: Record<string, DPSData>;
  targetDrillDownGrouping: TargetDrillDownGrouping | null;
} => {
  const dpsData: Record<string, DPSData> = {};
  const targetDrillDownActive = isTargetDrillDownActive(type, sourceFilter);
  const targetDrillDownGrouping = targetDrillDownActive
    ? resolveTargetDrillDownGrouping(targetFilter ?? null)
    : null;

  for (const logLine of filteredFight.data) {
    if (logLine.type === LogTypes.DAMAGE) {
      const damageLog = logLine as DamageLog;
      let actorName: string;
      let actor: Actor;
      let displayName: string;
      let groupKey: string;

      if (targetDrillDownGrouping) {
        actor = getTargetDrillDownRowActor(
          damageLog.target,
          targetDrillDownGrouping,
        );
        displayName = getTargetDrillDownDisplayName(
          damageLog.target,
          targetDrillDownGrouping,
        );
        groupKey = getTargetDrillDownGroupKey(
          damageLog.target,
          targetDrillDownGrouping,
        );
        actorName = displayName;
      } else if (type === "damage-done") {
        actorName = damageLog.source.name;
        actor = damageLog.source;
        displayName = actorName;
        groupKey = actorName;
      } else {
        if (damageLog.target.id && BOAT_IDS.includes(damageLog.target.id)) {
          const boatName = BOAT_ID_TO_NAME[damageLog.target.id] || "Boat";
          actorName =
            damageLog.target.index !== undefined
              ? `${boatName}-${damageLog.target.index}`
              : boatName;
          actor = {
            ...damageLog.target,
            name: actorName,
          };
        } else {
          actorName = damageLog.target.name;
          actor = damageLog.target;
        }
        displayName = actorName;
        groupKey = actorName;
      }

      if (!dpsData[groupKey]) {
        dpsData[groupKey] = {
          actor,
          displayName,
          accuracy: 0,
          dps: 0,
          totalDamage: 0,
          totalHits: 0,
          successfulHits: 0,
          activity: 0,
        };
      }

      dpsData[groupKey].totalDamage += damageLog.damageAmount;
      dpsData[groupKey].totalHits += 1;
      if (damageLog.damageAmount > 0) {
        dpsData[groupKey].successfulHits += 1;
      }
    }
  }

  if (type === "damage-done" && !targetDrillDownGrouping) {
    const performanceMap = getFightPerformanceByPlayer(fight);

    for (const [player, playerPerformance] of performanceMap.entries()) {
      const percentage =
        playerPerformance.activeTicks / fight.metaData.fightDurationTicks;

      if (dpsData[player]) {
        dpsData[player].activity = Number((percentage * 100).toFixed(2));
      }
    }

    const playerDpsByName = new Map(
      calculatePlayerDps(fight, filteredFight.data).map((entry) => [
        entry.playerName,
        entry.dps,
      ]),
    );
    for (const [playerName, dps] of playerDpsByName) {
      if (dpsData[playerName]) {
        dpsData[playerName].dps = Number(dps.toFixed(3));
      }
    }
  } else if (
    type === "damage-done" &&
    targetDrillDownGrouping &&
    sourceFilter
  ) {
    const activityByGroup = getTargetGroupActivityPercent(
      fight,
      sourceFilter.name,
      (target) => getTargetDrillDownGroupKey(target, targetDrillDownGrouping),
    );

    for (const [groupKey, activity] of activityByGroup) {
      if (dpsData[groupKey]) {
        dpsData[groupKey].activity = activity;
      }
    }
  }

  const fightDurationSeconds = getFightDurationSeconds(fight);

  const dpsArray = Object.entries(dpsData).map(
    ([groupKey, data]: [string, DPSData]) => {
      const accuracy = (data.successfulHits / data.totalHits) * 100;
      const dps = targetDrillDownGrouping
        ? data.totalDamage / fightDurationSeconds
        : type === "damage-done" && fight.players.includes(data.actor.name)
          ? data.dps
          : data.totalDamage / fightDurationSeconds;
      return { groupKey, damage: data.totalDamage, accuracy, dps };
    },
  );

  for (const dpsDataKey in dpsData) {
    const dpsDataValue = dpsData[dpsDataKey];
    const dpsDataEntry = dpsArray.find(
      (entry) => entry.groupKey === dpsDataKey,
    );
    if (dpsDataEntry) {
      dpsDataValue.accuracy = Number(dpsDataEntry.accuracy.toFixed(2));
      dpsDataValue.dps = Number(dpsDataEntry.dps.toFixed(3));
    }
  }

  return { dpsData, targetDrillDownGrouping };
};

const DPSMeterTable: React.FC<DPSMeterBarChartProps> = ({
  fight,
  filteredFight,
  drillDownLogs,
  type,
  sourceFilter = null,
  targetFilter = null,
  dpsPercentiles,
  onSelectSourceFilter,
  onSelectTargetFilter,
}) => {
  const loggedInPlayer = fight.loggedInPlayer;

  const { dpsData, targetDrillDownGrouping } = getDPSData(
    fight,
    filteredFight,
    drillDownLogs,
    type,
    sourceFilter ?? null,
    targetFilter ?? null,
  );
  const isTargetDrillDown = targetDrillDownGrouping !== null;

  const totalDamage = Object.values(dpsData).reduce(
    (acc, cur) => acc + cur.totalDamage,
    0,
  );

  const [maxWidth, setMaxWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      let vwWidth = window.innerWidth * 0.7 - 300;
      if (vwWidth > 540) {
        vwWidth = 540;
      }
      setMaxWidth(vwWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const calculateBarWidth = (damage: number) => {
    const highestDamage = Math.max(
      ...Object.values(dpsData).map((data) => data.totalDamage),
    );
    return `${(damage / highestDamage) * maxWidth}px`;
  };

  const sortedDPSData = Object.entries(dpsData).sort(
    (a, b) => b[1].totalDamage - a[1].totalDamage,
  );

  const nameColumnHeader =
    targetDrillDownGrouping === "monster-id" ? (
      <TableColumnHeaderTooltip label="ID" tooltip={COLUMN_TOOLTIPS.npcId} />
    ) : targetDrillDownGrouping === "monster-index" ||
      targetDrillDownGrouping === "leaf" ? (
      <TableColumnHeaderTooltip
        label="Index"
        tooltip={COLUMN_TOOLTIPS.npcIndex}
      />
    ) : (
      "Name"
    );

  return (
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
      <Table style={{ tableLayout: "auto", width: "100%" }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: "100px", textAlign: "center" }}>
              {nameColumnHeader}
            </TableCell>
            <TableCell style={{ textAlign: "center", paddingBottom: "2px" }}>
              Amount
            </TableCell>
            {type === "damage-done" && (
              <TableCell style={{ width: "100px", textAlign: "center" }}>
                <TableColumnHeaderTooltip
                  label="Activity"
                  tooltip={COLUMN_TOOLTIPS.activity}
                />
              </TableCell>
            )}
            <TableCell style={{ width: "100px", textAlign: "center" }}>
              <TableColumnHeaderTooltip
                label="Accuracy"
                tooltip={COLUMN_TOOLTIPS.accuracy}
              />
            </TableCell>
            <TableCell style={{ width: "70px", textAlign: "center" }}>
              <TableColumnHeaderTooltip
                label="DPS"
                tooltip={COLUMN_TOOLTIPS.dps}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedDPSData.map(
            ([groupKey, data]: [string, DPSData], index: number) => {
              const displayName = data.displayName;
              const damagePercentage = Number(
                ((data.totalDamage / totalDamage) * 100).toFixed(2),
              );
              const unknown =
                !isTargetDrillDown && isUnknownPlayer(displayName);
              const dpsDisplay = getPlayerDpsDisplayColor(
                displayName,
                type === "damage-done" && !isTargetDrillDown
                  ? dpsPercentiles?.[displayName]
                  : undefined,
              );
              const canDrillDown =
                isTargetDrillDown &&
                targetDrillDownGrouping !== null &&
                canDrillDownTargetRow(
                  drillDownLogs,
                  targetFilter ?? null,
                  data.actor,
                  targetDrillDownGrouping,
                );

              return (
                <TableRow
                  key={groupKey}
                  className={index % 2 === 0 ? "even-row" : "odd-row"}
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) =>
                    e.currentTarget.classList.add("highlighted-row")
                  }
                  onMouseLeave={(e) =>
                    e.currentTarget.classList.remove("highlighted-row")
                  }
                >
                  <TableCell
                    style={{ width: "100px", textAlign: "left" }}
                    className={
                      unknown
                        ? "unknown-text"
                        : displayName === loggedInPlayer
                          ? "logged-in-player-text"
                          : "other-text"
                    }
                  >
                    {canDrillDown ? (
                      <span
                        className="link"
                        onClick={() => {
                          if (
                            !isTargetDrillDown ||
                            targetDrillDownGrouping === null
                          ) {
                            return;
                          }

                          onSelectTargetFilter(
                            getNextTargetFilter(
                              data.actor,
                              targetDrillDownGrouping,
                            ),
                          );
                        }}
                      >
                        {displayName}
                      </span>
                    ) : isTargetDrillDown ? (
                      displayName
                    ) : (
                      <span
                        className="link"
                        onClick={() => {
                          const filter = { name: data.actor.name };
                          if (type === "damage-done") {
                            onSelectSourceFilter(filter);
                          } else {
                            onSelectTargetFilter(filter);
                          }
                        }}
                      >
                        {displayName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          textAlign: "left",
                          minWidth: "50px",
                          marginRight: "5px",
                        }}
                      >
                        {damagePercentage ? `${damagePercentage}%` : ``}
                      </span>
                      <div
                        style={{
                          backgroundColor: unknown
                            ? colors.text.unknown
                            : displayName === loggedInPlayer
                              ? colors.text.player
                              : colors.dpsMeter.playerHighlight,
                          height: "14px",
                          marginRight: "10px",
                          marginTop: "3px",
                          marginBottom: "3px",
                          width: calculateBarWidth(data.totalDamage),
                        }}
                      />
                      {data.totalDamage}
                    </div>
                  </TableCell>
                  {type === "damage-done" && (
                    <TableCell
                      style={{
                        width: "60px",
                        textAlign: "right",
                        color: unknown
                          ? colors.text.unknown
                          : getPercentColor(data.activity),
                      }}
                    >
                      {unknown ? "-" : `${data.activity}%`}
                    </TableCell>
                  )}
                  <TableCell style={{ width: "70px", textAlign: "right" }}>
                    {data.accuracy}%
                  </TableCell>
                  <TableCell
                    style={{
                      width: "70px",
                      textAlign: "right",
                      color:
                        type === "damage-done" && !isTargetDrillDown
                          ? dpsDisplay.color
                          : undefined,
                    }}
                    className={
                      type === "damage-done" &&
                      !isTargetDrillDown &&
                      dpsDisplay.useDpsTextClass
                        ? "dps-text"
                        : undefined
                    }
                  >
                    {data.dps}
                  </TableCell>
                </TableRow>
              );
            },
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DPSMeterTable;
