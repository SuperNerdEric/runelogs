import React from "react";
import { Levels } from "../models/Levels";
import { PlayerSpellName } from "../models/LogLine";
import { colors } from "../theme";
import { formatHHmmss } from "../utils/utils";
import {
  PLAYER_SPELL_ICON_URLS,
  PLAYER_SPELL_LABELS,
  VENGEANCE_OTHER_ICON_URL,
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
  /** Omitted when the attack has no target (e.g. Bloat down/stomp). */
  targetName?: string;
  fightTimeMs?: number;
  boostedLevels?: Levels;
  isSpecialAttack: boolean;
  isDeath?: boolean;
  spells?: PlayerSpellName[];
  vengOtherCastTarget?: string;
  timeFallback?: string;
  iconUrl?: string;
  /** Extra section label shown above the attack row (e.g. "Down 1 Start"). */
  contextLabel?: string;
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

function SpellTooltipRows({
  spells,
  vengOtherCastTarget,
}: {
  spells?: PlayerSpellName[];
  vengOtherCastTarget?: string;
}) {
  const hasSpells = !!spells?.length;
  const hasVengOtherCast = !!vengOtherCastTarget;
  if (!hasSpells && !hasVengOtherCast) {
    return null;
  }

  return (
    <>
      {hasVengOtherCast && (
        <div className="chart-tooltip__spell">
          <img
            src={VENGEANCE_OTHER_ICON_URL}
            alt=""
            width={20}
            height={20}
            className="chart-tooltip__spell-icon"
          />
          <span>Vengeance Other cast on {vengOtherCastTarget}</span>
        </div>
      )}
      {spells?.map((spell) => (
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
  vengOtherCastTarget?: string;
}

export const TickPlayerStatsTooltip: React.FC<TickPlayerStatsTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
  spells,
  vengOtherCastTarget,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);
  const hasSpellRows = !!spells?.length || !!vengOtherCastTarget;

  return (
    <ChartTooltip className="chart-tooltip--replay">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      {hasSpellRows && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows
            spells={spells}
            vengOtherCastTarget={vengOtherCastTarget}
          />
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
  vengOtherCastTarget?: string;
}

export const MissedTickTooltip: React.FC<MissedTickTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
  spells,
  vengOtherCastTarget,
}) => {
  const statRows = buildBoostedLevelStatRows(boostedLevels);

  return (
    <ChartTooltip className="chart-tooltip--replay chart-tooltip--missed-tick">
      <ChartTooltipTime>{formatHHmmss(fightTimeMs, true)}</ChartTooltipTime>
      <ChartTooltipDivider />
      <div className="chart-tooltip__missed-label">Missed Tick</div>
      {(!!spells?.length || !!vengOtherCastTarget) && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows
            spells={spells}
            vengOtherCastTarget={vengOtherCastTarget}
          />
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
  vengOtherCastTarget?: string;
}

export const DeathTooltip: React.FC<DeathTooltipProps> = ({
  fightTimeMs,
  boostedLevels,
  spells,
  vengOtherCastTarget,
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
      {(!!spells?.length || !!vengOtherCastTarget) && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows
            spells={spells}
            vengOtherCastTarget={vengOtherCastTarget}
          />
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
      {attack.contextLabel && (
        <>
          <ChartTooltipDivider />
          <div className="chart-tooltip__missed-label">
            {attack.contextLabel}
          </div>
        </>
      )}
      <ChartTooltipDivider />
      <ChartTooltipAttackRow
        weaponItemId={attack.weaponItemId}
        weaponName={
          attack.isSpecialAttack
            ? `${attack.weaponName} (Special attack)`
            : attack.weaponName
        }
        animationId={attack.animationId}
        iconUrl={attack.iconUrl}
      />
      {attack.targetName && (
        <>
          <ChartTooltipDivider />
          <ChartTooltipTargetRow targetName={attack.targetName} />
        </>
      )}
      {(!!attack.spells?.length || !!attack.vengOtherCastTarget) && (
        <>
          <ChartTooltipDivider />
          <SpellTooltipRows
            spells={attack.spells}
            vengOtherCastTarget={attack.vengOtherCastTarget}
          />
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
    | "vengOtherCastTarget"
    | "iconUrl"
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
    vengOtherCastTarget: event.vengOtherCastTarget,
    iconUrl: event.iconUrl,
  };
}

export default AttackTooltip;
