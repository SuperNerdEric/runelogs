import React, { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pairs as d3Pairs } from "d3-array";
import { Fight } from "../../models/Fight";
import { Levels } from "../../models/Levels";
import {
  BoostedLevelsLog,
  filterByType,
  LogLine,
  LogTypes,
} from "../../models/LogLine";
import { formatHHmmss } from "../../utils/utils";
import { getPlayerNameTextClass } from "../../utils/actorUtils";
import {
  MAGE_ANIMATION,
  MELEE_ANIMATIONS,
  RANGED_ANIMATIONS,
} from "../../models/Constants";
import {
  alpha,
  Box,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ActivityTable from "./ActivityTable";
import SummarySection from "../summary/SummarySection";
import BoostPotionsDisplay from "../summary/BoostPotionsDisplay";
import { COLUMN_TOOLTIPS } from "../../utils/columnTooltips";
import AppTooltip from "../AppTooltip";
import { getItemImageUrl } from "../replay/PlayerEquipment";
import { getWeaponFromEquipment } from "../../utils/attackAnimationBreakdown";
import { colors } from "../../theme";
import ScrollableBoostCharts from "./ScrollableBoostCharts";
import {
  BOOST_ATTACK_ICON_SIZE,
  getBoostChartScrollWidth,
} from "../../utils/boostChartScroll";
import {
  capitalizeChartLabel,
  ChartTooltip,
  ChartTooltipAttackRow,
  ChartTooltipDivider,
  ChartTooltipStatGrid,
  ChartTooltipStatRow,
  ChartTooltipTime,
} from "./ChartTooltip";

interface DPSChartProps {
  fight: Fight;
}

interface AttackAnimationMarker {
  timestamp: number;
  formattedTimestamp: string;
  animationId: number;
  color?: string;
  weaponItemId?: number;
  weaponName?: string;
}

interface BoostChartPoint {
  timestamp: number;
  formattedTimestamp: string;
  attack: number;
  strength: number;
  defence: number;
  ranged: number;
  magic: number;
  hitpoints: number;
  prayer: number;
  animationId?: number;
  weaponItemId?: number;
  weaponName?: string;
}

interface AttackReferenceLabelProps {
  viewBox?: { x: number; y: number; height: number };
  attack: AttackAnimationMarker;
}

const ATTACK_ICON_SIZE = BOOST_ATTACK_ICON_SIZE;

const AttackReferenceLabel: React.FC<AttackReferenceLabelProps> = ({
  viewBox,
  attack,
}) => {
  if (!viewBox || viewBox.x == null) {
    return null;
  }

  const tooltipContent = attack.weaponItemId ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <img
        src={getItemImageUrl(attack.weaponItemId)}
        alt=""
        className="osrs-item-icon osrs-item-icon--20"
      />
      <span>{attack.weaponName}</span>
    </Box>
  ) : (
    <span>{attack.weaponName ?? `Animation ${attack.animationId}`}</span>
  );

  const icon = attack.weaponItemId ? (
    <img
      src={getItemImageUrl(attack.weaponItemId)}
      alt=""
      className="osrs-item-icon boosts-chart-attack-icon"
    />
  ) : (
    <span
      className="boosts-chart-attack-icon boosts-chart-attack-icon--fallback"
      style={{ backgroundColor: attack.color }}
    />
  );

  const hitSize = ATTACK_ICON_SIZE + 10;

  return (
    <foreignObject
      x={viewBox.x - hitSize / 2}
      y={(viewBox.y ?? 0) - hitSize - 2}
      width={hitSize}
      height={hitSize}
      style={{ overflow: "visible", pointerEvents: "all" }}
    >
      <div
        {...({
          xmlns: "http://www.w3.org/1999/xhtml",
        } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <AppTooltip
          title={tooltipContent}
          placement="top"
          arrow
          slotProps={{ popper: { sx: { zIndex: 1500 } } }}
        >
          <span className="boosts-chart-attack-icon-wrap">{icon}</span>
        </AppTooltip>
      </div>
    </foreignObject>
  );
};

const findAttackAtHover = (
  attacks: AttackAnimationMarker[] | undefined,
  hoverTime: number,
): AttackAnimationMarker | undefined => {
  if (!attacks?.length || !Number.isFinite(hoverTime)) {
    return undefined;
  }

  const exact = attacks.find((attack) => attack.timestamp === hoverTime);
  if (exact) {
    return exact;
  }

  return attacks.find(
    (attack) => Math.abs(attack.timestamp - hoverTime) <= 300,
  );
};

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload: BoostChartPoint;
  }>;
  label?: number;
  attackAnimations?: AttackAnimationMarker[];
}> = ({ active, payload, label, attackAnimations }) => {
  if (!active || !payload?.length || label == null) {
    return null;
  }

  const point = payload[0].payload as BoostChartPoint;
  const hoverTime = Number(label);
  const attackAtHover =
    point.animationId != null
      ? {
          animationId: point.animationId,
          weaponItemId: point.weaponItemId,
          weaponName: point.weaponName,
        }
      : findAttackAtHover(attackAnimations, hoverTime);

  const animationId = point.animationId ?? attackAtHover?.animationId;
  const weaponItemId = point.weaponItemId ?? attackAtHover?.weaponItemId;
  const weaponName = point.weaponName ?? attackAtHover?.weaponName;

  return (
    <ChartTooltip className="chart-tooltip--boosts">
      <ChartTooltipTime>{formatHHmmss(label, true)}</ChartTooltipTime>
      {animationId && (
        <>
          <ChartTooltipDivider />
          <ChartTooltipAttackRow
            weaponItemId={weaponItemId}
            weaponName={weaponName}
            animationId={animationId}
          />
        </>
      )}
      <ChartTooltipDivider />
      <ChartTooltipStatGrid>
        {payload.map(
          (
            entry: { name: string; value: number; color?: string },
            index: number,
          ) => (
            <ChartTooltipStatRow
              key={`tooltip-entry-${index}`}
              label={capitalizeChartLabel(entry.name)}
              value={entry.value}
              color={entry.color}
            />
          ),
        )}
      </ChartTooltipStatGrid>
    </ChartTooltip>
  );
};

export function calculateWeightedAveragesByPlayer(
  fight: Fight,
): Map<string, Levels> {
  const startTime = fight.firstLine.fightTimeMs!;
  const endTime = fight.lastLine.fightTimeMs!;
  const totalTimeInSeconds = (endTime - startTime) / 1000;

  const playerLogs = new Map<string, BoostedLevelsLog[]>();

  for (const log of filterByType(fight.data, LogTypes.BOOSTED_LEVELS)) {
    const player = log.source?.name;
    if (!player) continue;
    if (!playerLogs.has(player)) {
      playerLogs.set(player, []);
    }
    playerLogs.get(player)!.push(log);
  }

  const result = new Map<string, Levels>();

  for (const [player, logs] of playerLogs.entries()) {
    const statSums: Partial<Record<keyof Levels, number>> = {};

    const pairs: [BoostedLevelsLog, LogLine][] = d3Pairs(logs);
    if (pairs.length > 0) {
      pairs.push([logs[logs.length - 1], fight.lastLine]);
    }

    for (const [from, to] of pairs) {
      const dt = (to.fightTimeMs! - from.fightTimeMs!) / 1000;
      const weight = dt / totalTimeInSeconds;

      for (const stat of Object.keys(from.boostedLevels) as (keyof Levels)[]) {
        const val = from.boostedLevels[stat];
        if (!statSums[stat]) statSums[stat] = 0;
        statSums[stat]! += (val ?? 0) * weight;
      }
    }

    result.set(player, statSums as Levels);
  }

  return result;
}

export function calculateWeightedAverages(fight: Fight) {
  const weightedValues: Array<{
    stat: keyof Levels;
    values: Array<{ weightedValue: number }>;
  }> = [];
  const startTime = fight.firstLine.fightTimeMs!;
  const endTime = fight.lastLine.fightTimeMs!;

  // Calculate the time difference in seconds
  const totalTimeInSeconds = (endTime - startTime) / 1000;

  const filteredLogs = filterByType(fight.data, LogTypes.BOOSTED_LEVELS);
  const pairs: [LogLine, LogLine][] = d3Pairs(filteredLogs);

  if (pairs && pairs.length > 0) {
    // Create one more pair between the last and end of the fight
    pairs.push([fight.data[fight.data.length - 1], fight.lastLine!]);

    pairs.forEach((pair) => {
      const startTime = pair[0].fightTimeMs!;
      const endTime = pair[1].fightTimeMs!;
      const timeDiffInSeconds = (endTime - startTime) / 1000;

      for (const key in (pair[0] as BoostedLevelsLog).boostedLevels) {
        const value1 = (pair[0] as BoostedLevelsLog).boostedLevels[
          key as keyof Levels
        ];
        const weightedValue =
          (value1 ?? 0) * (timeDiffInSeconds / totalTimeInSeconds);

        const existingStat = weightedValues.find(
          (item) => item.stat === (key as keyof Levels),
        );
        if (existingStat) {
          existingStat.values.push({ weightedValue });
        } else {
          weightedValues.push({
            stat: key as keyof Levels,
            values: [{ weightedValue }],
          });
        }
      }
    });
  }

  const averages: Partial<Levels> = {};

  for (const stat of weightedValues) {
    let totalWeightedValue = 0;
    for (const value of stat.values) {
      totalWeightedValue += value.weightedValue;
    }
    const averageWeightedValue = totalWeightedValue;
    averages[stat.stat] = averageWeightedValue;
  }

  return averages as Levels;
}

const Boosts: React.FC<DPSChartProps> = ({ fight }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>(
    fight.loggedInPlayer,
  );
  const [boostedLevelsData, setBoostedLevelsData] = useState<
    BoostChartPoint[] | undefined
  >();
  const [attackAnimationData, setAttackAnimationData] = useState<
    AttackAnimationMarker[] | undefined
  >();
  const [showAttackAnimations, setShowAttackAnimations] =
    useState<boolean>(true); // State variable to control visibility
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fightDurationMs = useMemo(() => {
    if (!boostedLevelsData?.length) {
      return 0;
    }

    return (
      boostedLevelsData[boostedLevelsData.length - 1]?.timestamp ??
      fight.lastLine?.fightTimeMs ??
      0
    );
  }, [boostedLevelsData, fight.lastLine?.fightTimeMs]);

  const chartScrollWidth = useMemo(
    () =>
      getBoostChartScrollWidth({
        fightDurationMs,
        attackTimestamps:
          attackAnimationData?.map((attack) => attack.timestamp) ?? [],
        showAttackAnimations,
        isMobile,
      }),
    [fightDurationMs, attackAnimationData, showAttackAnimations, isMobile],
  );

  useEffect(() => {
    if (!selectedPlayer) return;

    let currentBoost: Levels | undefined;
    let currentWeapon: { itemId: number; name: string } | null = null;
    const tempBoost: BoostChartPoint[] = [];
    const tempAttack: AttackAnimationMarker[] = [];

    const upsertBoostPoint = (
      timestamp: number,
      patch: Partial<BoostChartPoint>,
    ): BoostChartPoint => {
      const existingPoint = tempBoost.find(
        (data) => data.timestamp === timestamp,
      );
      if (existingPoint) {
        Object.assign(existingPoint, patch);
        return existingPoint;
      }

      const point: BoostChartPoint = {
        timestamp,
        formattedTimestamp: formatHHmmss(timestamp, true),
        attack: currentBoost?.attack || 0,
        strength: currentBoost?.strength || 0,
        defence: currentBoost?.defence || 0,
        ranged: currentBoost?.ranged || 0,
        magic: currentBoost?.magic || 0,
        hitpoints: currentBoost?.hitpoints || 0,
        prayer: currentBoost?.prayer || 0,
        ...patch,
      };
      tempBoost.push(point);
      return point;
    };

    fight.data.forEach((log) => {
      if (!("source" in log) || log.source?.name !== selectedPlayer) {
        return;
      }

      if (log.type === LogTypes.PLAYER_EQUIPMENT && log.playerEquipment) {
        const weapon = getWeaponFromEquipment(log.playerEquipment);
        if (weapon) {
          currentWeapon = weapon;
        }
        return;
      }

      if (log.type === LogTypes.BOOSTED_LEVELS) {
        upsertBoostPoint(log.fightTimeMs!, {
          attack: log.boostedLevels?.attack || 0,
          strength: log.boostedLevels?.strength || 0,
          defence: log.boostedLevels?.defence || 0,
          ranged: log.boostedLevels?.ranged || 0,
          magic: log.boostedLevels?.magic || 0,
          hitpoints: log.boostedLevels?.hitpoints || 0,
          prayer: log.boostedLevels?.prayer || 0,
        });
        currentBoost = log.boostedLevels;
        return;
      }

      if (log.type === LogTypes.PLAYER_ATTACK_ANIMATION) {
        tempAttack.push({
          timestamp: log.fightTimeMs!,
          formattedTimestamp: formatHHmmss(log.fightTimeMs!, true),
          animationId: log.animationId,
          weaponItemId: currentWeapon?.itemId,
          weaponName: currentWeapon?.name,
        });

        upsertBoostPoint(log.fightTimeMs!, {
          animationId: log.animationId,
          weaponItemId: currentWeapon?.itemId,
          weaponName: currentWeapon?.name,
        });
      }
    });

    tempBoost.sort((a, b) => a.timestamp - b.timestamp);

    if (tempBoost.length > 0) {
      const lastFightTimeMs = fight.lastLine.fightTimeMs;
      if (lastFightTimeMs != null) {
        tempBoost.push({
          ...tempBoost[tempBoost.length - 1],
          timestamp: lastFightTimeMs,
          formattedTimestamp: formatHHmmss(lastFightTimeMs, true),
        });
      }
    }

    const verticalMelee = colors.chart.meleeVertical;
    const verticalRanged = colors.chart.rangedVertical;
    const verticalMagic = colors.chart.magicVertical;

    tempAttack.forEach((attack) => {
      if (MELEE_ANIMATIONS.includes(attack.animationId)) {
        attack.color = verticalMelee;
      } else if (RANGED_ANIMATIONS.includes(attack.animationId)) {
        attack.color = verticalRanged;
      } else if (MAGE_ANIMATION.includes(attack.animationId)) {
        attack.color = verticalMagic;
      }
    });

    setBoostedLevelsData(tempBoost);
    setAttackAnimationData(tempAttack);
  }, [fight, selectedPlayer]);

  if (!boostedLevelsData || !attackAnimationData) {
    return <div>Loading...</div>;
  }

  return (
    <SummarySection
      title="Stat Boosts"
      titleTooltip={COLUMN_TOOLTIPS.statBoosts}
      titleAdornment={<BoostPotionsDisplay fight={fight} />}
      className="stat-boosts-section"
    >
      <Box className="stat-boosts-section__body">
        <Box className="stat-boosts-section__table">
          <ActivityTable fight={fight} />
        </Box>

        <Box className="stat-boosts-charts">
          <Box className="stat-boosts-charts__player-select">
            <FormControl fullWidth size="small">
              <Select
                labelId="player-select-label"
                id="player-select"
                value={selectedPlayer}
                onChange={(e: SelectChangeEvent) =>
                  setSelectedPlayer(e.target.value)
                }
                renderValue={(value) => (
                  <span
                    className={getPlayerNameTextClass(
                      value,
                      fight.loggedInPlayer,
                    )}
                  >
                    {value}
                  </span>
                )}
              >
                {[
                  ...new Set(
                    fight.data
                      .filter(
                        (log): log is LogLine & { source: { name: string } } =>
                          log.type === LogTypes.PLAYER_ATTACK_ANIMATION &&
                          "source" in log &&
                          Boolean(log.source?.name),
                      )
                      .map((log) => log.source.name),
                  ),
                ].map((name) => (
                  <MenuItem
                    key={name}
                    value={name}
                    className={getPlayerNameTextClass(
                      name,
                      fight.loggedInPlayer,
                    )}
                  >
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className="stat-boosts-charts__chart-section">
            <Box className="stat-boosts-charts__chart-header">
              <Typography
                component="h3"
                className="stat-boosts-charts__chart-title"
              >
                Combat Stats
              </Typography>
              <FormControlLabel
                control={
                  <TanToggle
                    checked={showAttackAnimations}
                    onChange={() =>
                      setShowAttackAnimations(!showAttackAnimations)
                    }
                    color="default"
                  />
                }
                label="Attacks"
              />
            </Box>
            <ScrollableBoostCharts scrollWidth={chartScrollWidth}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={boostedLevelsData}
                  margin={{
                    top: 28,
                    left: 60,
                    bottom: chartScrollWidth ? 34 : 50,
                  }}
                >
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    tickFormatter={(timestamp) => formatHHmmss(timestamp, true)}
                    domain={[
                      0,
                      boostedLevelsData[boostedLevelsData.length - 1]
                        ?.timestamp ?? 0,
                    ]}
                  />
                  <YAxis
                    dataKey="attack"
                    label={{
                      value: "Level",
                      position: "insideLeft",
                      angle: -90,
                      offset: -50,
                      style: { textAnchor: "middle" },
                    }}
                    width={1}
                    tickFormatter={(tick) => (tick !== 0 ? tick : "")}
                    domain={[0, 125]}
                  />
                  {attackAnimationData.map(
                    (attack, index) =>
                      showAttackAnimations && (
                        <ReferenceLine
                          key={index}
                          x={attack.timestamp}
                          stroke={attack.color}
                          strokeDasharray="10 2"
                          ifOverflow="extendDomain"
                          label={<AttackReferenceLabel attack={attack} />}
                        />
                      ),
                  )}
                  <Line
                    type="stepAfter"
                    dataKey="attack"
                    stroke={colors.chart.attack}
                    dot={false}
                    animationDuration={0}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="strength"
                    stroke={colors.chart.strength}
                    dot={false}
                    animationDuration={0}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="defence"
                    stroke={colors.chart.defence}
                    dot={false}
                    animationDuration={0}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="ranged"
                    stroke={colors.chart.ranged}
                    dot={false}
                    animationDuration={0}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="magic"
                    stroke={colors.chart.magic}
                    dot={false}
                    animationDuration={0}
                  />
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip
                        {...(props as React.ComponentProps<
                          typeof CustomTooltip
                        >)}
                        attackAnimations={attackAnimationData}
                      />
                    )}
                    cursor={{ fill: colors.chart.cursor }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ScrollableBoostCharts>
          </Box>

          <Box className="stat-boosts-charts__chart-section">
            <Box className="stat-boosts-charts__chart-header">
              <Typography
                component="h3"
                className="stat-boosts-charts__chart-title"
              >
                Hitpoints & Prayer
              </Typography>
            </Box>
            <ScrollableBoostCharts scrollWidth={null}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={boostedLevelsData}
                  margin={{ top: 11, left: 60, bottom: 10 }}
                >
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    tickFormatter={(timestamp) => formatHHmmss(timestamp, true)}
                    domain={[
                      0,
                      boostedLevelsData[boostedLevelsData.length - 1]
                        ?.timestamp ?? 0,
                    ]}
                  />
                  <YAxis
                    dataKey="attack"
                    label={{
                      value: "Level",
                      position: "insideLeft",
                      angle: -90,
                      offset: -50,
                      style: { textAnchor: "middle" },
                    }}
                    width={1}
                    tickFormatter={(tick) => (tick !== 0 ? tick : "")}
                    domain={[0, 125]}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="hitpoints"
                    stroke={colors.chart.hitpoints}
                    dot={false}
                    animationDuration={0}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="prayer"
                    stroke={colors.chart.prayer}
                    dot={false}
                    animationDuration={0}
                  />
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip
                        {...(props as React.ComponentProps<
                          typeof CustomTooltip
                        >)}
                      />
                    )}
                    cursor={{ fill: colors.chart.cursor }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ScrollableBoostCharts>
          </Box>
        </Box>
      </Box>
    </SummarySection>
  );
};

export default Boosts;

const TanToggle = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: colors.switch.tanHex,
    "&:hover": {
      backgroundColor: alpha(
        colors.switch.tanHex,
        theme.palette.action.hoverOpacity,
      ),
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: colors.switch.tanHex,
  },
  "& .MuiSwitch-track": {
    backgroundColor: theme.palette.grey[400],
  },
}));
