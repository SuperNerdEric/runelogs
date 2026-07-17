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
  PlayerSpellName,
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
import {
  ChartTooltip,
  ChartTooltipDivider,
  ChartTooltipTime,
} from "../charts/ChartTooltip";
import { formatHHmmss } from "../../utils/utils";
import { getReplayMissedTicks } from "../../utils/replayMissedTicks";
import {
  BoostLevelsByTick,
  createBoostLevelResolver,
  getFightTimeMsForTick,
} from "../../utils/replayTickTooltip";
import { isPlayerDeathTarget } from "../../utils/deathEvents";
import {
  PLAYER_SPELL_ICON_URLS,
  VENGEANCE_OTHER_CAST_ARROW_URL,
  VENGEANCE_OTHER_ICON_URL,
} from "../../utils/playerSpells";
import { getTimeFromTickOffset } from "../../lib/replayTiming";
import {
  getPresentTrackedNpcAttackNpcs,
  getTrackedNpcAttackNpc,
  isMainBossTrackedNpc,
  npcAttackRowKey as trackedNpcAttackRowKey,
} from "../../utils/trackedNpcAttackNpcs";
import {
  BLOAT_STOMP_IMAGE_URL,
  NYLOCAS_MATOMENOS_IMAGE_URL,
  XARPUS_TURN_IMAGE_URL,
  resolveNpcAttackImageUrl,
  getNpcAttackAnimationName,
} from "../../utils/npcAttackAnimationNames";
import {
  buildBloatDownHighlightTicks,
  formatBloatDownContextLabel,
  synthesizeBloatStompAttacks,
} from "../../utils/bloatDownHighlight";
import { getBloatStompFightTimeMs } from "../../utils/bloatDownEvents";
import {
  getMaidenPhaseMarkers,
  injectMaidenPhaseSpawnAttacks,
  MAIDEN_ROW_PREFIX,
} from "../../utils/maidenPhaseEvents";
import {
  synthesizeXarpusTurnAttacks,
  type XarpusScreechMarker,
} from "../../utils/xarpusTurnHighlight";
import { getXarpusTurnFightTimeMs } from "../../utils/xarpusTurnEvents";
import {
  injectXarpusExhumeAttacks,
  isXarpusExhumedGroundObjectId,
  XARPUS_EXHUMED_IMAGE_URL,
  type XarpusExhumeSpawn,
} from "../../utils/xarpusExhumeHighlight";
import { Actor } from "../../models/Actor";
import { npcIdMap } from "../../lib/npcIdMap";

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
  maxWidth: "30px",
  maxHeight: "30px",
  width: "auto",
  height: "auto",
  objectFit: "contain",
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
  targetName?: string;
  fightTimeMs?: number;
  boostedLevels?: Levels;
  isSpecialAttack: boolean;
}

interface ReplayNpcAttackCell {
  npcId: number;
  npcName: string;
  attackName: string;
  attackImageUrl: string;
  animationId: number;
  targetName?: string;
  fightTimeMs?: number;
}

type AttackAnimationsByTick = {
  [tickNumber: number]: {
    [playerName: string]: ReplayAttackCell;
  };
};

type NpcAttackAnimationsByTick = {
  [tickNumber: number]: {
    [npcKey: string]: ReplayNpcAttackCell;
  };
};

type DeathsByTick = Record<number, Record<string, true>>;
type SpellsByTick = Record<number, Record<string, PlayerSpellName[]>>;
type VengOtherCastByTick = Record<number, Record<string, string>>;

interface NpcRow {
  key: string;
  label: string;
  npcId: number;
  npcName: string;
  /** Full monster name for row-label hover. */
  fullName: string;
  isMainBoss: boolean;
}

interface HoveredCell {
  anchorEl: HTMLElement;
  tick: number;
  rowKey: string;
  rowKind: "player" | "npc";
}

interface HoveredNpcLabel {
  anchorEl: HTMLElement;
  fullName: string;
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

function resolveAttackTargetName(
  target: Actor | undefined,
): string | undefined {
  if (!target) {
    return undefined;
  }
  if (target.id != null) {
    const tracked = getTrackedNpcAttackNpc(target.id);
    if (tracked?.shortName) {
      return tracked.shortName;
    }
    const name = npcIdMap[target.id]?.name || target.name;
    return name?.trim() || undefined;
  }
  return target.name?.trim() || undefined;
}

interface TickChartCellProps {
  tick: number;
  rowKey: string;
  rowKind: "player" | "npc";
  isHighlighted: boolean;
  isMissed: boolean;
  isBloatDown?: boolean;
  isDeath: boolean;
  attack?: ReplayAttackCell;
  npcAttack?: ReplayNpcAttackCell;
  spells?: PlayerSpellName[];
  vengOtherCastTarget?: string;
  onCellClick: (tick: number) => void;
  onCellHover: (hover: HoveredCell | null) => void;
}

const TickChartCell = memo(function TickChartCell({
  tick,
  rowKey,
  rowKind,
  isHighlighted,
  isMissed,
  isBloatDown = false,
  isDeath,
  attack,
  npcAttack,
  spells,
  vengOtherCastTarget,
  onCellClick,
  onCellHover,
}: TickChartCellProps) {
  const cellClassName = [
    "replay-tick-chart__cell",
    isMissed ? "replay-tick-chart__cell--missed" : "",
    isBloatDown ? "replay-tick-chart__cell--bloat-down" : "",
    isHighlighted ? "replay-tick-chart__cell--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const hasSpells = !!spells?.length;
  const hasVengOtherCast = !!vengOtherCastTarget;
  // Keep one primary icon in the fixed 30x30 cell; extras are corner overlays.
  const spellIconCount =
    (hasSpells ? spells!.length : 0) + (hasVengOtherCast ? 1 : 0);
  const hasPrimaryAttack = !!attack || !!npcAttack;
  const spellAsOverlay = spellIconCount > 0 && hasPrimaryAttack;
  const deathAsOverlay = isDeath && (hasPrimaryAttack || spellIconCount > 0);

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
          rowKey,
          rowKind,
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
        {npcAttack && (
          <img src={npcAttack.attackImageUrl} alt="" style={attackIconStyle} />
        )}
        {hasVengOtherCast && (
          <span
            className={
              spellAsOverlay
                ? "replay-tick-chart__spell-wrap replay-tick-chart__spell-wrap--overlay"
                : "replay-tick-chart__spell-wrap"
            }
          >
            <img
              src={VENGEANCE_OTHER_ICON_URL}
              alt=""
              aria-hidden="true"
              className="replay-tick-chart__spell-icon"
              width={26}
              height={26}
            />
            <img
              src={VENGEANCE_OTHER_CAST_ARROW_URL}
              alt=""
              aria-hidden="true"
              className="replay-tick-chart__spell-cast-arrow"
              width={32}
              height={32}
            />
          </span>
        )}
        {hasSpells &&
          spells!.map((spell, index) => {
            const isOverlay = spellAsOverlay || hasVengOtherCast || index > 0;
            return (
              <span
                key={spell}
                className={
                  isOverlay
                    ? "replay-tick-chart__spell-wrap replay-tick-chart__spell-wrap--overlay"
                    : "replay-tick-chart__spell-wrap"
                }
              >
                <img
                  src={PLAYER_SPELL_ICON_URLS[spell]}
                  alt=""
                  aria-hidden="true"
                  className="replay-tick-chart__spell-icon"
                  width={26}
                  height={26}
                />
              </span>
            );
          })}
        {isDeath && (
          <img
            src={SKULL_ICON_URL}
            alt=""
            aria-hidden="true"
            className={
              deathAsOverlay
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
  const [hoveredNpcLabel, setHoveredNpcLabel] =
    useState<HoveredNpcLabel | null>(null);

  const chartData = useMemo(() => {
    const playerSet = new Set<string>();
    const presentTrackedNpcs = getPresentTrackedNpcAttackNpcs(fight);
    const npcRowsByKey = new Map<string, NpcRow>();
    for (const npc of presentTrackedNpcs) {
      npcRowsByKey.set(npc.key, {
        key: npc.key,
        label: npc.name,
        npcId: npc.primaryId,
        npcName: npc.name,
        fullName: npcIdMap[npc.primaryId]?.name ?? npc.name,
        isMainBoss: isMainBossTrackedNpc(
          { shortName: npc.name, primaryId: npc.primaryId },
          fight,
        ),
      });
    }

    const lastKnownEquipment: Record<string, string[] | undefined> = {};
    const lastKnownBoostedLevels: Record<string, Levels | undefined> = {};
    const boostedLevelsAtTick: BoostLevelsByTick = {};
    const attackAnimationsByTick: AttackAnimationsByTick = {};
    const npcAttackAnimationsByTick: NpcAttackAnimationsByTick = {};
    const xarpusScreeches: XarpusScreechMarker[] = [];
    const xarpusExhumeSpawns: XarpusExhumeSpawn[] = [];
    const deathsByTick: DeathsByTick = {};
    const spellsByTick: SpellsByTick = {};
    const vengOtherCastByTick: VengOtherCastByTick = {};

    fight.data.forEach((logLine: LogLine) => {
      const tick = logLine.tick;
      if (typeof tick !== "number") {
        return;
      }

      if (
        logLine.type === LogTypes.GROUND_OBJECT_SPAWNED &&
        isXarpusExhumedGroundObjectId(logLine.id)
      ) {
        xarpusExhumeSpawns.push({
          tick,
          fightTimeMs: logLine.fightTimeMs,
        });
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

      if (logLine.type === LogTypes.PLAYER_ATTACK_ANIMATION) {
        const attackLog = logLine as AttackAnimationLog;
        const source = attackLog.source;
        const tracked = getTrackedNpcAttackNpc(source?.id);
        if (tracked && source?.index != null) {
          const npcKey = trackedNpcAttackRowKey(tracked.family, source.index);
          // Only chart attacks for NPCs that belong in this fight's tracked set
          if (npcRowsByKey.has(npcKey)) {
            // Screech is a phase marker; Turns are synthesized below (not charted).
            if (attackLog.attackSpecial === "SCREECH") {
              xarpusScreeches.push({
                npcKey,
                tick,
                npcId: source.id ?? tracked.primaryId,
                npcName: npcRowsByKey.get(npcKey)!.npcName,
                fightTimeMs: attackLog.fightTimeMs,
                targetName: resolveAttackTargetName(attackLog.target),
              });
              return;
            }
            if (!npcAttackAnimationsByTick[tick]) {
              npcAttackAnimationsByTick[tick] = {};
            }
            npcAttackAnimationsByTick[tick][npcKey] = {
              npcId: tracked.primaryId,
              npcName: npcRowsByKey.get(npcKey)!.npcName,
              attackName: getNpcAttackAnimationName(
                attackLog.animationId,
                tracked.primaryId,
                attackLog.projectileId,
                attackLog.attackSpecial,
              ),
              attackImageUrl:
                attackLog.attackImageUrl ??
                resolveNpcAttackImageUrl(
                  attackLog.animationId,
                  tracked.primaryId,
                  attackLog.projectileId,
                  attackLog.attackSpecial,
                ),
              animationId: attackLog.animationId,
              targetName: resolveAttackTargetName(attackLog.target),
              fightTimeMs: attackLog.fightTimeMs,
            };
          }
          return;
        }
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

      if (logLine.type === LogTypes.VENGEANCE_OTHER_CAST) {
        if (!vengOtherCastByTick[tick]) {
          vengOtherCastByTick[tick] = {};
        }
        vengOtherCastByTick[tick][playerName] =
          logLine.target?.name || "Unknown";
        return;
      }

      if (logLine.type === LogTypes.PLAYER_SPELL) {
        if (!spellsByTick[tick]) {
          spellsByTick[tick] = {};
        }
        const existing = spellsByTick[tick][playerName] ?? [];
        if (!existing.includes(logLine.spell)) {
          spellsByTick[tick][playerName] = [...existing, logLine.spell];
        }
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
        targetName: resolveAttackTargetName(attackLog.target),
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

    const npcNameCounts = new Map<string, number>();
    for (const row of npcRowsByKey.values()) {
      npcNameCounts.set(row.npcName, (npcNameCounts.get(row.npcName) ?? 0) + 1);
    }
    for (const row of npcRowsByKey.values()) {
      if ((npcNameCounts.get(row.npcName) ?? 0) > 1) {
        const indexPart = row.key.split(":")[1];
        row.label = `${row.npcName} (${indexPart ?? row.key})`;
      }
    }

    const npcRows = Array.from(npcRowsByKey.values()).sort((a, b) => {
      if (a.isMainBoss !== b.isMainBoss) {
        return a.isMainBoss ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });

    synthesizeBloatStompAttacks(
      npcAttackAnimationsByTick,
      maxTick,
      (downAttack) => ({
        npcId: downAttack.npcId,
        npcName: downAttack.npcName,
        attackName: "Stomp",
        attackImageUrl: BLOAT_STOMP_IMAGE_URL,
        animationId: 0,
        targetName: downAttack.targetName,
        fightTimeMs:
          downAttack.fightTimeMs != null
            ? getBloatStompFightTimeMs(downAttack.fightTimeMs)
            : undefined,
      }),
    );

    synthesizeXarpusTurnAttacks(
      npcAttackAnimationsByTick,
      xarpusScreeches,
      maxTick,
      (screech, _turnTick, turnIndex) => ({
        npcId: screech.npcId,
        npcName: screech.npcName,
        attackName: "Turn",
        attackImageUrl: XARPUS_TURN_IMAGE_URL,
        animationId: 0,
        targetName: screech.targetName,
        fightTimeMs:
          screech.fightTimeMs != null
            ? getXarpusTurnFightTimeMs(screech.fightTimeMs, turnIndex)
            : undefined,
      }),
    );

    const xarpusNpcKeys = npcRows
      .filter((row) => row.key.startsWith("xarpus:"))
      .map((row) => row.key);
    injectXarpusExhumeAttacks(
      npcAttackAnimationsByTick,
      xarpusNpcKeys,
      xarpusExhumeSpawns,
      (spawn, npcKey) => {
        const row = npcRowsByKey.get(npcKey)!;
        return {
          npcId: row.npcId,
          npcName: row.npcName,
          attackName: "Exhume",
          attackImageUrl: XARPUS_EXHUMED_IMAGE_URL,
          animationId: 0,
          fightTimeMs: spawn.fightTimeMs,
        };
      },
    );

    const maidenNpcKeys = npcRows
      .filter((row) => row.key.startsWith(MAIDEN_ROW_PREFIX))
      .map((row) => row.key);
    injectMaidenPhaseSpawnAttacks(
      npcAttackAnimationsByTick,
      maidenNpcKeys,
      getMaidenPhaseMarkers(fight),
      (marker, npcKey) => {
        const row = npcRowsByKey.get(npcKey)!;
        return {
          npcId: row.npcId,
          npcName: row.npcName,
          attackName: `${marker.label} Nylocas Matomenos Spawn`,
          attackImageUrl: NYLOCAS_MATOMENOS_IMAGE_URL,
          animationId: 0,
          targetName: undefined,
          fightTimeMs: marker.fightTimeMs,
        };
      },
    );

    return {
      players: Array.from(playerSet),
      npcRows,
      attackAnimations: attackAnimationsByTick,
      npcAttackAnimations: npcAttackAnimationsByTick,
      bloatDownHighlights: buildBloatDownHighlightTicks(
        npcAttackAnimationsByTick,
        maxTick,
      ),
      deathsByTick,
      spellsByTick,
      vengOtherCastByTick,
      missedTicks: getReplayMissedTicks(fight, initialTick, maxTick),
      resolveBoostedLevels: createBoostLevelResolver(boostedLevelsAtTick),
    };
  }, [fight, initialTick, maxTick]);

  const {
    players,
    npcRows,
    attackAnimations,
    npcAttackAnimations,
    bloatDownHighlights,
    deathsByTick,
    spellsByTick,
    vengOtherCastByTick,
    missedTicks,
    resolveBoostedLevels,
  } = chartData;

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
      setCurrentTime(getTimeFromTickOffset(tick - initialTick));
    },
    [initialTick, setCurrentTime],
  );

  const handleCellHover = useCallback((hover: HoveredCell | null) => {
    setHoveredNpcLabel(null);
    setHoveredCell(hover);
  }, []);

  const handleNpcLabelHover = useCallback((hover: HoveredNpcLabel | null) => {
    setHoveredCell(null);
    setHoveredNpcLabel(hover);
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
    if (hoveredNpcLabel) {
      return (
        <ChartTooltip className="chart-tooltip--replay">
          <div className="chart-tooltip__attack">
            <span>{hoveredNpcLabel.fullName}</span>
          </div>
        </ChartTooltip>
      );
    }

    if (!hoveredCell) {
      return null;
    }

    const { tick, rowKey, rowKind } = hoveredCell;

    if (rowKind === "npc") {
      const downIndex = bloatDownHighlights[tick]?.[rowKey];
      const npcAttack = npcAttackAnimations[tick]?.[rowKey];
      const isDownAttack =
        npcAttack != null &&
        (npcAttack.animationId === 8082 || npcAttack.attackName === "Down");
      const isWindowEnd =
        downIndex != null &&
        bloatDownHighlights[tick + 1]?.[rowKey] !== downIndex;
      const downLabel =
        downIndex != null
          ? formatBloatDownContextLabel(downIndex, {
              isDownAttack,
              isWindowEnd,
            })
          : undefined;
      if (npcAttack) {
        return (
          <AttackTooltip
            attack={{
              ...attackEventToTooltipDetails({
                weaponItemId: 0,
                weaponName: npcAttack.attackName,
                animationId: npcAttack.animationId,
                targetName: npcAttack.targetName,
                fightTimeMs: npcAttack.fightTimeMs,
                isSpecialAttack: false,
                iconUrl: npcAttack.attackImageUrl,
              }),
              contextLabel: downLabel,
              timeFallback:
                npcAttack.fightTimeMs == null
                  ? `Tick ${tick - initialTick + 1}`
                  : undefined,
            }}
          />
        );
      }
      if (downLabel) {
        const fightTimeMs = getFightTimeMsForTick(
          tick,
          initialTick,
          fightStartMs,
        );
        return (
          <ChartTooltip className="chart-tooltip--replay">
            <ChartTooltipTime>
              {formatHHmmss(fightTimeMs, true)}
            </ChartTooltipTime>
            <ChartTooltipDivider />
            <div className="chart-tooltip__missed-label">{downLabel}</div>
          </ChartTooltip>
        );
      }
      return null;
    }

    const attack = attackAnimations[tick]?.[rowKey];
    const isMissed = missedTicks[tick]?.[rowKey] === true;
    const isDeath = deathsByTick[tick]?.[rowKey] === true;
    const spells = spellsByTick[tick]?.[rowKey];
    const vengOtherCastTarget = vengOtherCastByTick[tick]?.[rowKey];
    const fightTimeMs = getFightTimeMsForTick(tick, initialTick, fightStartMs);
    const boostedLevels = resolveBoostedLevels(tick, rowKey);

    if (attack) {
      return (
        <AttackTooltip
          attack={{
            ...attackEventToTooltipDetails({
              ...attack,
              spells,
              vengOtherCastTarget,
            }),
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
          spells={spells}
          vengOtherCastTarget={vengOtherCastTarget}
        />
      );
    }

    if (isMissed) {
      return (
        <MissedTickTooltip
          fightTimeMs={fightTimeMs}
          boostedLevels={boostedLevels}
          spells={spells}
          vengOtherCastTarget={vengOtherCastTarget}
        />
      );
    }

    return (
      <TickPlayerStatsTooltip
        fightTimeMs={fightTimeMs}
        boostedLevels={boostedLevels}
        spells={spells}
        vengOtherCastTarget={vengOtherCastTarget}
      />
    );
  }, [
    hoveredCell,
    hoveredNpcLabel,
    attackAnimations,
    npcAttackAnimations,
    bloatDownHighlights,
    deathsByTick,
    spellsByTick,
    vengOtherCastByTick,
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
          {npcRows.map((npcRow) => (
            <tr key={npcRow.key}>
              <td
                className="replay-tick-chart-sticky-col"
                style={tdStyle}
                onMouseEnter={(event) =>
                  handleNpcLabelHover({
                    anchorEl: event.currentTarget,
                    fullName: npcRow.fullName,
                  })
                }
                onMouseLeave={() => handleNpcLabelHover(null)}
              >
                {npcRow.label}
              </td>

              {columnTicks.map((tick) => (
                <TickChartCell
                  key={`${npcRow.key}-${tick}`}
                  tick={tick}
                  rowKey={npcRow.key}
                  rowKind="npc"
                  isHighlighted={tick === highlightedTick}
                  isMissed={false}
                  isBloatDown={bloatDownHighlights[tick]?.[npcRow.key] != null}
                  isDeath={false}
                  npcAttack={npcAttackAnimations[tick]?.[npcRow.key]}
                  onCellClick={handleTickClick}
                  onCellHover={handleCellHover}
                />
              ))}
            </tr>
          ))}
          {visiblePlayers.map((playerName) => (
            <tr key={playerName}>
              <td className="replay-tick-chart-sticky-col" style={tdStyle}>
                {playerName}
              </td>

              {columnTicks.map((tick) => (
                <TickChartCell
                  key={`${playerName}-${tick}`}
                  tick={tick}
                  rowKey={playerName}
                  rowKind="player"
                  isHighlighted={tick === highlightedTick}
                  isMissed={missedTicks[tick]?.[playerName] === true}
                  isDeath={deathsByTick[tick]?.[playerName] === true}
                  attack={attackAnimations[tick]?.[playerName]}
                  spells={spellsByTick[tick]?.[playerName]}
                  vengOtherCastTarget={vengOtherCastByTick[tick]?.[playerName]}
                  onCellClick={handleTickClick}
                  onCellHover={handleCellHover}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Popper
        open={
          tooltipContent !== null &&
          (hoveredCell !== null || hoveredNpcLabel !== null)
        }
        anchorEl={hoveredNpcLabel?.anchorEl ?? hoveredCell?.anchorEl ?? null}
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

export default TickChart;
