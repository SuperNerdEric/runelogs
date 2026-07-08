import React from "react";
import { Levels } from "../models/Levels";
import { colors } from "../theme";
import { formatHHmmss } from "../utils/utils";
import {
  capitalizeChartLabel,
  ChartTooltip,
  ChartTooltipAttackRow,
  ChartTooltipDivider,
  ChartTooltipStatGrid,
  ChartTooltipStatRow,
  ChartTooltipTargetRow,
  ChartTooltipTime,
} from "./charts/ChartTooltip";

export interface AttackTooltipDetails {
  weaponItemId: number;
  weaponName: string;
  animationId: number;
  targetName: string;
  fightTimeMs?: number;
  boostedLevels?: Levels;
  isSpecialAttack: boolean;
  timeFallback?: string;
}

export const ATTACK_TOOLTIP_SLOT_PROPS = {
  tooltip: { className: "chart-tooltip-popper" },
  arrow: { sx: { color: "var(--color-bg-tooltip)" } },
} as const;

const ATTACK_STAT_KEYS: Array<{
  key: keyof Levels;
  color: string;
}> = [
  { key: "attack", color: colors.chart.attack },
  { key: "strength", color: colors.chart.strength },
  { key: "defence", color: colors.chart.defence },
  { key: "ranged", color: colors.chart.ranged },
  { key: "magic", color: colors.chart.magic },
  { key: "hitpoints", color: colors.chart.hitpoints },
  { key: "prayer", color: colors.chart.prayer },
];

function buildBoostedLevelStatRows(boostedLevels?: Levels) {
  return ATTACK_STAT_KEYS.flatMap(({ key, color }) => {
    const value = boostedLevels?.[key];
    if (value == null) {
      return [];
    }

    return (
      <ChartTooltipStatRow
        key={key}
        label={capitalizeChartLabel(key)}
        value={value}
        color={color}
      />
    );
  });
}

interface AttackTooltipProps {
  attack: AttackTooltipDetails;
}

interface TickPlayerStatsTooltipProps {
  fightTimeMs: number;
  boostedLevels?: Levels;
}

export const TickPlayerStatsTooltip: React.FC<TickPlayerStatsTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);

  return (
    <ChartTooltip className="chart-tooltip--replay">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      {statRows.length > 0 && (
        <>
          <ChartTooltipDivider />
          <ChartTooltipStatGrid>{statRows}</ChartTooltipStatGrid>
        </>
      )}
    </ChartTooltip>
  );
};

interface MissedTickTooltipProps {
  fightTimeMs: number;
  boostedLevels?: Levels;
}

export const MissedTickTooltip: React.FC<MissedTickTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);

  return (
    <ChartTooltip className="chart-tooltip--replay chart-tooltip--missed-tick">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      <ChartTooltipDivider />
      <div className="chart-tooltip__missed-label">Missed Tick</div>
      {statRows.length > 0 && (
        <>
          <ChartTooltipDivider />
          <ChartTooltipStatGrid>{statRows}</ChartTooltipStatGrid>
        </>
      )}
    </ChartTooltip>
  );
};

const AttackTooltip: React.FC<AttackTooltipProps> = ({ attack }) => {
  const statRows = buildBoostedLevelStatRows(attack.boostedLevels);

  const timeLabel =
    attack.fightTimeMs != null
      ? formatHHmmss(attack.fightTimeMs, true)
      : attack.timeFallback;

  return (
    <ChartTooltip className="chart-tooltip--replay">
      {timeLabel && <ChartTooltipTime>{timeLabel}</ChartTooltipTime>}
      <ChartTooltipDivider />
      <ChartTooltipAttackRow
        weaponItemId={attack.weaponItemId}
        weaponName={
          attack.isSpecialAttack
            ? `${attack.weaponName} (Special attack)`
            : attack.weaponName
        }
        animationId={attack.animationId}
      />
      <ChartTooltipDivider />
      <ChartTooltipTargetRow targetName={attack.targetName} />
      {statRows.length > 0 && (
        <>
          <ChartTooltipDivider />
          <ChartTooltipStatGrid>{statRows}</ChartTooltipStatGrid>
        </>
      )}
    </ChartTooltip>
  );
};

export function attackEventToTooltipDetails(
  event: Pick<
    AttackTooltipDetails,
    | "weaponItemId"
    | "weaponName"
    | "animationId"
    | "targetName"
    | "fightTimeMs"
    | "boostedLevels"
    | "isSpecialAttack"
  >,
): AttackTooltipDetails {
  return {
    weaponItemId: event.weaponItemId,
    weaponName: event.weaponName,
    animationId: event.animationId,
    targetName: event.targetName,
    fightTimeMs: event.fightTimeMs,
    boostedLevels: event.boostedLevels,
    isSpecialAttack: event.isSpecialAttack,
  };
}

export default AttackTooltip;
