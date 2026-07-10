import React, {
  CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Popper } from "@mui/material";
import { Fight } from "../../models/Fight";
import {
  AttackAnimationLog,
  BoostedLevelsLog,
  LogLine,
  LogTypes,
} from "../../models/LogLine";
import { Levels } from "../../models/Levels";
import { getItemImageUrl } from "./PlayerEquipment";
import undeadGraspImg from "../../assets/animations/Undead_Grasp_8972.png";
import nullImg from "../../assets/animations/Null.png";
import { colors, fontSizes } from "../../theme";
import { isSpecialAttack } from "../../utils/specialAttackAnimations";
import { resolveWeaponFromEquipment } from "../../utils/attackAnimationBreakdown";
import { itemIdMap } from "../../lib/itemIdMap";
import AttackTooltip, {
  attackEventToTooltipDetails,
  DeathTooltip,
  MissedTickTooltip,
  TickPlayerStatsTooltip,
} from "../AttackTooltip";
import { getReplayMissedTicks } from "../../utils/replayMissedTicks";
import {
  BoostLevelsByTick,
  createBoostLevelResolver,
  getFightTimeMsForTick,
} from "../../utils/replayTickTooltip";
import { isPlayerDeathTarget } from "../../utils/deathEvents";

const SPECIAL_ATTACK_ORB_URL = "/images/special-attack-orb-64.png";
const SKULL_ICON_URL = "/images/skull-icon.png";

const attackCellStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
};

const attackIconStyle: CSSProperties = {
  width: "30px",
  height: "30px",
};

interface TickChartProps {
  fight: Fight;
  highlightedTick: number;
  setCurrentTime: (time: number) => void;
  initialTick: number;
  maxTick: number;
  activePlayers: string[];
  isPlaying: boolean;
  tooltipContainer?: HTMLElement | (() => HTMLElement | null) | null;
}

interface ReplayAttackCell {
  weaponId: string;
  weaponItemId: number;
  weaponName: string;
  animationId: number;
  targetName: string;
  fightTimeMs?: number;
  boostedLevels?: Levels;
  isSpecialAttack: boolean;
}

type AttackAnimationsByTick = {
  [tickNumber: number]: {
    [playerName: string]: ReplayAttackCell;
  };
};

type DeathsByTick = Record<number, Record<string, true>>;

interface HoveredCell {
  anchorEl: HTMLElement;
  tick: number;
  playerName: string;
}

const animationIdToImage: Record<number, string> = {
  8972: undeadGraspImg,
};

const getAnimationOrItemImageUrl = (
  animationId: number | undefined,
  weaponId: string,
): string => {
  if (animationId && animationIdToImage[animationId]) {
    return animationIdToImage[animationId];
  }

  const parsedWeaponId = parseInt(weaponId, 10);
  if (!isNaN(parsedWeaponId) && parsedWeaponId > 0) {
    return getItemImageUrl(parsedWeaponId);
  }

  return nullImg;
};

interface TickChartCellProps {
  tick: number;
  playerName: string;
  isHighlighted: boolean;
  isMissed: boolean;
  isDeath: boolean;
  attack?: ReplayAttackCell;
  onCellClick: (tick: number) => void;
  onCellHover: (hover: HoveredCell | null) => void;
}

const TickChartCell = memo(function TickChartCell({
  tick,
  playerName,
  isHighlighted,
  isMissed,
  isDeath,
  attack,
  onCellClick,
  onCellHover,
}: TickChartCellProps) {
  const cellClassName = [
    "replay-tick-chart__cell",
    isMissed ? "replay-tick-chart__cell--missed" : "",
    isHighlighted ? "replay-tick-chart__cell--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td
      className={cellClassName}
      style={{
        borderRight: `1px solid ${colors.replay.gridBorder}`,
        borderBottom: `1px solid ${colors.replay.gridBorder}`,
        padding: "2px 8px",
        fontSize: fontSizes.base,
        textAlign: "center",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
      onClick={() => onCellClick(tick)}
      onMouseEnter={(event) =>
        onCellHover({
          anchorEl: event.currentTarget,
          tick,
          playerName,
        })
      }
      onMouseLeave={() => onCellHover(null)}
    >
      <div style={attackCellStyle}>
        {attack && (
          <>
            <img
              src={getAnimationOrItemImageUrl(
                attack.animationId,
                attack.weaponId,
              )}
              alt=""
              style={attackIconStyle}
            />
            {attack.isSpecialAttack && (
              <img
                src={SPECIAL_ATTACK_ORB_URL}
                alt=""
                aria-hidden="true"
                className="replay-tick-chart__special-attack-icon"
                width={64}
                height={64}
              />
            )}
          </>
        )}
        {isDeath && (
          <img
            src={SKULL_ICON_URL}
            alt=""
            aria-hidden="true"
            className={
              attack
                ? "replay-tick-chart__death-icon replay-tick-chart__death-icon--overlay"
                : "replay-tick-chart__death-icon"
            }
            width={30}
            height={30}
          />
        )}
      </div>
    </td>
  );
});

const TickChart: React.FC<TickChartProps> = ({
  fight,
  highlightedTick,
  setCurrentTime,
  initialTick,
  maxTick,
  activePlayers,
  isPlaying,
  tooltipContainer,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);

  const chartData = useMemo(() => {
    const playerSet = new Set<string>();
    const lastKnownEquipment: Record<string, string[] | undefined> = {};
    const lastKnownBoostedLevels: Record<string, Levels | undefined> = {};
    const boostedLevelsAtTick: BoostLevelsByTick = {};
    const attackAnimationsByTick: AttackAnimationsByTick = {};
    const deathsByTick: DeathsByTick = {};

    fight.data.forEach((logLine: LogLine) => {
      const tick = logLine.tick;
      if (typeof tick !== "number") {
        return;
      }

      if (logLine.type === LogTypes.DEATH) {
        const target = logLine.target;
        if (target?.name && isPlayerDeathTarget(fight, target)) {
          if (!deathsByTick[tick]) {
            deathsByTick[tick] = {};
          }
          deathsByTick[tick][target.name] = true;
          playerSet.add(target.name);
        }
        return;
      }

      if (!("source" in logLine) || logLine.source?.id) {
        return;
      }

      const playerName = logLine.source?.name;
      if (!playerName) {
        return;
      }

      playerSet.add(playerName);

      if (logLine.type === LogTypes.PLAYER_EQUIPMENT) {
        lastKnownEquipment[playerName] = logLine.playerEquipment;
        return;
      }

      if (logLine.type === LogTypes.BOOSTED_LEVELS) {
        const boostedLevels = (logLine as BoostedLevelsLog).boostedLevels;
        lastKnownBoostedLevels[playerName] = boostedLevels;
        if (!boostedLevelsAtTick[tick]) {
          boostedLevelsAtTick[tick] = {};
        }
        boostedLevelsAtTick[tick][playerName] = boostedLevels;
        return;
      }

      if (logLine.type !== LogTypes.PLAYER_ATTACK_ANIMATION) {
        return;
      }

      const attackLog = logLine as AttackAnimationLog;
      const equipment = lastKnownEquipment[playerName];
      const weapon = resolveWeaponFromEquipment(equipment);
      const weaponSlotId = equipment?.[3] ?? "???";
      const weaponItemId = weapon?.itemId ?? parseInt(weaponSlotId, 10);
      const parsedWeaponItemId =
        !isNaN(weaponItemId) && weaponItemId > 0 ? weaponItemId : 0;

      if (!attackAnimationsByTick[tick]) {
        attackAnimationsByTick[tick] = {};
      }

      attackAnimationsByTick[tick][playerName] = {
        weaponId: weaponSlotId,
        weaponItemId: parsedWeaponItemId,
        weaponName:
          weapon?.name ||
          (parsedWeaponItemId > 0
            ? itemIdMap[parsedWeaponItemId] || `Item ${parsedWeaponItemId}`
            : "Unknown weapon"),
        animationId: attackLog.animationId,
        targetName: attackLog.target?.name || "Unknown target",
        fightTimeMs: attackLog.fightTimeMs,
        boostedLevels: lastKnownBoostedLevels[playerName]
          ? { ...lastKnownBoostedLevels[playerName]! }
          : undefined,
        isSpecialAttack:
          parsedWeaponItemId > 0 &&
          isSpecialAttack(parsedWeaponItemId, attackLog.animationId),
      };
    });

    for (const [tickKey, attacksByPlayer] of Object.entries(
      attackAnimationsByTick,
    )) {
      const tick = Number(tickKey);
      const tickBoosts = boostedLevelsAtTick[tick];
      if (!tickBoosts) {
        continue;
      }

      for (const [playerName, attack] of Object.entries(attacksByPlayer)) {
        const tickLevels = tickBoosts[playerName];
        if (tickLevels) {
          attack.boostedLevels = { ...tickLevels };
        }
      }
    }

    return {
      players: Array.from(playerSet),
      attackAnimations: attackAnimationsByTick,
      deathsByTick,
      missedTicks: getReplayMissedTicks(fight, initialTick, maxTick),
      resolveBoostedLevels: createBoostLevelResolver(boostedLevelsAtTick),
    };
  }, [fight, initialTick, maxTick]);

  const { players, attackAnimations, deathsByTick, missedTicks, resolveBoostedLevels } =
    chartData;

  const columnTicks = useMemo(() => {
    const cols = [];
    for (let t = initialTick; t <= maxTick; t++) {
      cols.push(t);
    }
    return cols;
  }, [initialTick, maxTick]);

  const fightStartMs = fight.firstLine.fightTimeMs ?? 0;

  const tableStyle: CSSProperties = {
    borderCollapse: "separate",
    borderSpacing: "0",
    width: "max-content",
    userSelect: "none",
  };

  const thHeaderStyle: CSSProperties = {
    borderBottom: `1px solid ${colors.replay.gridBorder}`,
    fontSize: fontSizes.base,
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  const tdStyle: CSSProperties = {
    borderRight: `1px solid ${colors.replay.gridBorder}`,
    borderBottom: `1px solid ${colors.replay.gridBorder}`,
    padding: "2px 8px",
    fontSize: fontSizes.base,
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  const highlightedColumnStyle: CSSProperties = {
    backgroundColor: colors.background.rowHover,
  };

  const handleTickClick = useCallback(
    (tick: number) => {
      const newTime = (tick - initialTick) * 0.6;
      setCurrentTime(newTime);
    },
    [initialTick, setCurrentTime],
  );

  const handleCellHover = useCallback((hover: HoveredCell | null) => {
    setHoveredCell(hover);
  }, []);

  const columnRefs = useRef<Record<number, HTMLTableHeaderCellElement | null>>(
    {},
  );

  useEffect(() => {
    const columnElement = columnRefs.current[highlightedTick];
    if (columnElement) {
      columnElement.scrollIntoView({
        behavior: isPlaying ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [highlightedTick, isPlaying]);

  const tooltipContent = useMemo(() => {
    if (!hoveredCell) {
      return null;
    }

    const { tick, playerName } = hoveredCell;
    const attack = attackAnimations[tick]?.[playerName];
    const isMissed = missedTicks[tick]?.[playerName] === true;
    const isDeath = deathsByTick[tick]?.[playerName] === true;
    const fightTimeMs = getFightTimeMsForTick(tick, initialTick, fightStartMs);
    const boostedLevels = resolveBoostedLevels(tick, playerName);

    if (attack) {
      return (
        <AttackTooltip
          attack={{
            ...attackEventToTooltipDetails(attack),
            isDeath,
            timeFallback:
              attack.fightTimeMs == null
                ? `Tick ${tick - initialTick + 1}`
                : undefined,
          }}
        />
      );
    }

    if (isDeath) {
      return (
        <DeathTooltip
          fightTimeMs={fightTimeMs}
          boostedLevels={boostedLevels}
        />
      );
    }

    if (isMissed) {
      return (
        <MissedTickTooltip
          fightTimeMs={fightTimeMs}
          boostedLevels={boostedLevels}
        />
      );
    }

    return (
      <TickPlayerStatsTooltip
        fightTimeMs={fightTimeMs}
        boostedLevels={boostedLevels}
      />
    );
  }, [
    hoveredCell,
    attackAnimations,
    deathsByTick,
    missedTicks,
    initialTick,
    fightStartMs,
    resolveBoostedLevels,
  ]);

  const visiblePlayers = useMemo(
    () => players.filter((playerName) => activePlayers.includes(playerName)),
    [players, activePlayers],
  );

  return (
    <div className="replay-tick-chart">
      <table style={tableStyle}>
        <thead>
          <tr>
            <th
              className="replay-tick-chart-sticky-col"
              style={thHeaderStyle}
            />
            {columnTicks.map((tick) => {
              const style = {
                ...thHeaderStyle,
                ...(tick === highlightedTick ? highlightedColumnStyle : {}),
              };

              return (
                <th
                  ref={(el) => {
                    columnRefs.current[tick] = el;
                  }}
                  key={tick - initialTick + 1}
                  style={style}
                  onClick={() => handleTickClick(tick)}
                >
                  {tick - initialTick + 1}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visiblePlayers.map((playerName) => (
            <tr key={playerName}>
              <td className="replay-tick-chart-sticky-col" style={tdStyle}>
                {playerName}
              </td>

              {columnTicks.map((tick) => (
                <TickChartCell
                  key={`${playerName}-${tick}`}
                  tick={tick}
                  playerName={playerName}
                  isHighlighted={tick === highlightedTick}
                  isMissed={missedTicks[tick]?.[playerName] === true}
                  isDeath={deathsByTick[tick]?.[playerName] === true}
                  attack={attackAnimations[tick]?.[playerName]}
                  onCellClick={handleTickClick}
                  onCellHover={handleCellHover}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Popper
        open={hoveredCell !== null && tooltipContent !== null}
        anchorEl={hoveredCell?.anchorEl ?? null}
        placement="top"
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
        container={tooltipContainer ?? undefined}
        sx={{ zIndex: 1500, pointerEvents: "none" }}
      >
        {tooltipContent}
      </Popper>
    </div>
  );
};

export default memo(TickChart);
