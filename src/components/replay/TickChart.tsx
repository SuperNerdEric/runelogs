import React, {CSSProperties, useEffect, useMemo, useRef} from 'react';
import {Fight} from '../../models/Fight';
import {LogLine, LogTypes} from '../../models/LogLine';
import {getItemImageUrl} from "./PlayerEquipment";
import undeadGraspImg from '../../assets/animations/Undead_Grasp_8972.png';

interface TickChartProps {
    fight: Fight;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    initialTick: number;
    maxTick: number;
    activePlayers: string[];
}

type AttackAnimationsByTick = {
    [tickNumber: number]: {
        [playerName: string]: {
            weaponId: string;
            animationId?: number;
        };
    };
};

const animationIdToImage: Record<number, string> = {
    8972: undeadGraspImg,
};

const getAnimationOrItemImageUrl = (
    animationId: number | undefined,
    weaponId: string
): string => {
    return (animationId && animationIdToImage[animationId])
        ? animationIdToImage[animationId]
        : getItemImageUrl(weaponId as unknown as number);
};

const TickChart: React.FC<TickChartProps> = ({
                                                 fight,
                                                 currentTime,
                                                 setCurrentTime,
                                                 initialTick,
                                                 maxTick,
                                                 activePlayers
                                             }) => {
    /**
     * Build a structure of all players we encounter, plus
     * track "attack animations" by tick for each player.
     *
     * This example:
     *   1. Loops over logs once
     *   2. Keeps track of each player's last-known weapon (from PlayerEquipment logs)
     *   3. Whenever we see an AttackAnimationLog, we map tick => playerName => weaponName
     */
    const {players, attackAnimations} = useMemo(() => {
        // Keep track of players
        const playerSet = new Set<string>();

        // lastKnownEquipment[playerName] = string[] of item names
        // (We assume the weapon is index[3])
        const lastKnownEquipment: Record<string, string[] | undefined> = {};

        // For storing the results
        const attackAnimationsByTick: AttackAnimationsByTick = {};

        fight.data.forEach((logLine: LogLine) => {
            // Skip logs that have no tick
            const tick = logLine.tick;
            if (typeof tick !== 'number') return;

            if ("source" in logLine) {
                const playerName = !logLine.source?.id ? logLine.source?.name : undefined;
                if (playerName) {
                    // Keep track of the player
                    playerSet.add(playerName);

                    // If this is a PlayerEquipment log, update the known equipment
                    if (logLine.type === LogTypes.PLAYER_EQUIPMENT && playerName) {
                        const equipmentLog = logLine as any; // typed as PlayerEquipmentLog
                        lastKnownEquipment[playerName] = equipmentLog.playerEquipment;
                    }

                    // If it’s an AttackAnimation log, record the player's current weapon
                    // TODO: I believe there's cases where an attack animation won't match the weapon, such as throwing chins immediately after switching
                    // TODO: You can cast spells with any weapon equipped.. we probably need to manually define all of those
                    if (logLine.type === LogTypes.PLAYER_ATTACK_ANIMATION && playerName) {
                        const eq = lastKnownEquipment[playerName];
                        const weapon = eq?.[3] || '???';
                        const animationId = logLine.animationId;

                        if (!attackAnimationsByTick[tick]) {
                            attackAnimationsByTick[tick] = {};
                        }
                        attackAnimationsByTick[tick][playerName] = {
                            weaponId: weapon,
                            animationId,
                        };
                    }
                }
            }
        });

        return {
            players: Array.from(playerSet),
            attackAnimations: attackAnimationsByTick,
        };
    }, [fight]);

    /**
     * The highest tick is `maxTick` from your parent logic (the raw highest fight.data tick).
     * We'll iterate from `initialTick` to `maxTick` inclusive to build columns.
     */
    const columnTicks = useMemo(() => {
        const cols = [];
        for (let t = initialTick; t <= maxTick; t++) {
            cols.push(t);
        }
        return cols;
    }, [initialTick, maxTick]);

    /**
     * We'll compute the "highlighted tick" from currentTime:
     *   floor(currentTime / 0.6) + initialTick
     */
    const highlightedTick = Math.floor(currentTime / 0.6) + initialTick;

    const tableContainerStyle: CSSProperties = {
        overflowX: 'auto',
        maxWidth: '100%',
        marginBottom: '10px',
    };

    const stickyHeader: CSSProperties = {
        position: 'sticky',
        left: 0,
        backgroundColor: '#262a2e',
        zIndex: 1,
        userSelect: 'text',
    };

    const tableStyle: CSSProperties = {
        borderCollapse: 'separate',
        borderSpacing: '0',
        width: 'max-content',
        userSelect: 'none',
    };

    const thTdStyle: CSSProperties = {
        borderRight: '1px solid #999',
        borderBottom: '1px solid #999',
        padding: '2px 8px',
        fontSize: '16px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
    };

    const highlightedColumnStyle: CSSProperties = {
        backgroundColor: 'rgb(0, 32, 64)',
    };

    // Helper: When user clicks a column, set the parent's currentTime
    const handleTickClick = (tick: number) => {
        // Time offset = (tick - initialTick) * 0.6
        const newTime = (tick - initialTick) * 0.6;
        setCurrentTime(newTime);
    };

    const columnRefs = useRef<Record<number, HTMLTableHeaderCellElement | null>>({});

    useEffect(() => {
        const columnElement = columnRefs.current[highlightedTick];
        if (columnElement) {
            columnElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [highlightedTick]);

    return (
        <div style={tableContainerStyle}>
            <table style={tableStyle}>
                <thead>
                <tr>
                    <th style={{...thTdStyle, ...stickyHeader}}>Player</th>
                    {columnTicks.map((tick) => {

                        const style = {
                            ...thTdStyle,
                            ...(tick === highlightedTick ? highlightedColumnStyle : {}),
                        };

                        return (
                            <th
                                ref={(el) => {
                                    // Store each column's ref
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
                {players
                    .filter((playerName) => activePlayers.includes(playerName))
                    .map((playerName) => {
                        return (
                            <tr key={playerName}>
                                {/* Player name in the first column */}
                                <td style={{...thTdStyle, ...stickyHeader}}>{playerName}</td>

                                {/* Each tick cell */}
                                {columnTicks.map((tick) => {
                                    const style = {
                                        ...thTdStyle,
                                        ...(tick === highlightedTick ? highlightedColumnStyle : {}),
                                        cursor: 'pointer',
                                    };

                                    // If we have an attack animation for this player at this tick...
                                    const attack = attackAnimations[tick]?.[playerName];
                                    return (
                                        <td
                                            key={`${playerName}-${tick}`}
                                            style={style}
                                            onClick={() => handleTickClick(tick)}
                                        >
                                            <div
                                                style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    margin: '0 auto',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {attack ? (
                                                    <img
                                                        src={getAnimationOrItemImageUrl(attack.animationId, attack.weaponId)}
                                                        alt={`Animation ID ${attack.animationId}`}
                                                        title={`Animation ID ${attack.animationId}`}
                                                        style={{width: '30px', height: '30px'}}
                                                    />
                                                ) : null}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )
                            ;
                    })}
                </tbody>
            </table>
        </div>
    )
        ;
};

export default TickChart;
