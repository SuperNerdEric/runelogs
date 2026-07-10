import React from "react";
import { Levels } from "../models/Levels";
import { PlayerSpellName } from "../models/LogLine";
import { colors } from "../theme";
import { formatHHmmss } from "../utils/utils";
import {
  PLAYER_SPELL_ICON_URLS,
  PLAYER_SPELL_LABELS,
} from "../utils/playerSpells";
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
  isDeath?: boolean;
  spells?: PlayerSpellName[];
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

function SpellTooltipRows({ spells }: { spells?: PlayerSpellName[] }) {
  if (!spells?.length) {
    return null;
  }

  return (
    <>
      {spells.map((spell) => (
        <div key={spell} className="chart-tooltip__spell">
          <img
            src={PLAYER_SPELL_ICON_URLS[spell]}
            alt=""
            width={20}
            height={20}
            className="chart-tooltip__spell-icon"
          />
          <span>{PLAYER_SPELL_LABELS[spell]}</span>
        </div>
      ))}
    </>
  );
}

interface AttackTooltipProps {
  attack: AttackTooltipDetails;
}

interface TickPlayerStatsTooltipProps {
  fightTimeMs: number;
  boostedLevels?: Levels;
  spells?: PlayerSpellName[];
}

export const TickPlayerStatsTooltip: React.FC<TickPlayerStatsTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
  spells,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);
  const hasSpells = !!spells?.length;

  return (
    <ChartTooltip className="chart-tooltip--replay">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      {hasSpells && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows spells={spells} />
        </>
      )}
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
  spells?: PlayerSpellName[];
}

export const MissedTickTooltip: React.FC<MissedTickTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
  spells,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);

  return (
    <ChartTooltip className="chart-tooltip--replay chart-tooltip--missed-tick">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      <ChartTooltipDivider />
      <div className="chart-tooltip__missed-label">Missed Tick</div>
      {!!spells?.length && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows spells={spells} />
        </>
      )}
      {statRows.length > 0 && (
        <>
          <ChartTooltipDivider />
          <ChartTooltipStatGrid>{statRows}</ChartTooltipStatGrid>
        </>
      )}
    </ChartTooltip>
  );
};

interface DeathTooltipProps {
  fightTimeMs: number;
  boostedLevels?: Levels;
  spells?: PlayerSpellName[];
}

export const DeathTooltip: React.FC<DeathTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
  spells,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);

  return (
    <ChartTooltip className="chart-tooltip--replay chart-tooltip--death">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      <ChartTooltipDivider />
      <div className="chart-tooltip__death">
        <img
          src="/images/skull-icon.png"
          alt=""
          width={20}
          height={20}
          className="chart-tooltip__death-icon"
        />
        <span>Death</span>
      </div>
      {!!spells?.length && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows spells={spells} />
        </>
      )}
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
      {!!attack.spells?.length && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows spells={attack.spells} />
        </>
      )}
      {attack.isDeath && (
        <>
          <ChartTooltipDivider />
          <div className="chart-tooltip__death">
            <img
              src="/images/skull-icon.png"
              alt=""
              width={20}
              height={20}
              className="chart-tooltip__death-icon"
            />
            <span>Death</span>
          </div>
        </>
      )}
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
    | "spells"
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
    spells: event.spells,
  };
}

export default AttackTooltip;
