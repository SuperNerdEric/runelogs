import React, {useEffect, useState} from 'react';
import {AlertCircle, ChevronDown, X} from 'lucide-react';
import AppTooltip from './AppTooltip';
import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";
import {Levels} from "../models/Levels";
import attackImage from '../assets/Attack.webp';
import strengthImage from '../assets/Strength.webp';
import defenceImage from '../assets/Defence.webp';
import hitpointsImage from '../assets/Hitpoints.webp';
import magicImage from '../assets/Magic.webp';
import rangedImage from '../assets/Ranged.webp';
import prayerImage from '../assets/Prayer.webp';
import sailingImage from '../assets/Sailing.webp';
import {formatHHmmss} from "../utils/utils";
import {colors, layout} from "../theme";
import {ActorFilter, matchesLogActorFilters} from "../utils/actorFilter";
import {EquipmentFilter, buildEquipmentTimelines, matchesEquipmentFilter} from "../utils/equipmentFilter";
import {PrayerFilter, buildPrayerTimelines, matchesPrayerFilter} from "../utils/prayerFilter";
import {getActorFromLog, getActorName, getActorSpecificIds, isUnknownPlayer} from "../utils/actorUtils";
import {itemIdMap} from "../lib/itemIdMap";
import {prayerIdMap} from "../lib/prayerIdMap";
import {prayerImages} from "../lib/prayerImages";
import FilterSearchBar from "./FilterSearchBar";
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const getFilterTextColor = (filter: ActorFilter, loggedInPlayer: string): string => {
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
        return 'logged-in-player-text';
    }
    if (isUnknownPlayer(source)) {
        return 'unknown-text';
    }
    return 'other-text';
};

const filterChipStyle = (textColor: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    color: textColor,
    border: '1px solid grey',
    borderRadius: '5px',
    fontSize: '0.9rem',
    overflow: 'hidden',
});

const filterChipButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '4px 10px',
    font: 'inherit',
};

const filterChipDeleteStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '4px 8px 4px 4px',
};

export const renderStatImages = (levels: Levels) => {
    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            {Object.entries(levels).map(([stat, value], index) => (
                <div key={index} style={{display: 'inline-block', marginRight: '10px'}}>
                    <img
                        src={statImages[stat as keyof Levels]}
                        alt={stat}
                        style={{
                            marginRight: '5px',
                            height: '18px',
                            verticalAlign: 'middle',
                        }}
                    />
                    <span style={{verticalAlign: 'middle'}}>{value}</span>
                </div>
            ))}
        </div>
    );
};

const EventsTable: React.FC<EventsTableProps> = ({
    fight,
    allLogs,
    maxHeight,
    showSource = false,
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
                if (!matchesEquipmentFilter(log, equipmentTimelines, equipmentFilter, sourceFilter, targetFilter)) {
                    return false;
                }
                if (!matchesPrayerFilter(log, prayerTimelines, prayerFilter, sourceFilter, targetFilter)) {
                    return false;
                }
                if (eventTypeFilter && log.type !== eventTypeFilter) {
                    return false;
                }
                return true;
            });

            setLogs(filteredLogs);
            setSourceSpecificIds(
                sourceFilter ? getActorSpecificIds(fight.data, 'source', sourceFilter.name) : []
            );
            setTargetSpecificIds(
                targetFilter ? getActorSpecificIds(fight.data, 'target', targetFilter.name) : []
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
            <div style={{display: 'flex', alignItems: 'center'}}>
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
                                className={onSelectPrayerFilter ? 'link' : undefined}
                                style={{
                                    display: 'inline-block',
                                    marginLeft: '0px',
                                    cursor: onSelectPrayerFilter ? 'pointer' : 'default',
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
                                        scale: '0.75',
                                        verticalAlign: 'middle',
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

    const hasFilterControls = onSelectSourceFilter || onSelectTargetFilter || onSelectEquipmentFilter || onSelectPrayerFilter;

    return (
        <>
            {hasFilterControls && (
                <FilterSearchBar
                    fight={{...fight, data: allLogs ?? fight.data}}
                    onSelectSourceFilter={onSelectSourceFilter}
                    onSelectTargetFilter={onSelectTargetFilter}
                    onSelectEquipmentFilter={onSelectEquipmentFilter}
                    onSelectPrayerFilter={onSelectPrayerFilter}
                />
            )}
            {(sourceFilter || targetFilter || equipmentFilter || prayerFilter || eventTypeFilter) && (
                <div
                    className="flex flex-wrap gap-2 mb-2 w-full"
                    style={{maxWidth: `${layout.contentMaxWidth}px`}}
                >
                    {sourceFilter && (
                        <DropdownMenu>
                            <span style={filterChipStyle(getFilterTextColor(sourceFilter, loggedInPlayer))}>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" style={filterChipButtonStyle}>
                                        <ChevronDown size={16}/>
                                        {`Source: ${sourceFilter.name}${sourceFilter.index !== undefined ? ` - ${sourceFilter.index}` : ''}`}
                                    </button>
                                </DropdownMenuTrigger>
                                <button
                                    type="button"
                                    aria-label="Clear source filter"
                                    style={filterChipDeleteStyle}
                                    onClick={onClearSourceFilter}
                                >
                                    <X size={16}/>
                                </button>
                            </span>
                            <DropdownMenuContent className="max-h-[200px] min-w-[100px]">
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (onSelectSourceFilter) {
                                            onSelectSourceFilter({name: sourceFilter.name});
                                        }
                                    }}
                                >
                                    All IDs
                                </DropdownMenuItem>
                                {sourceSpecificIds.map((specificId) => (
                                    <DropdownMenuItem
                                        key={`source-id-${specificId}`}
                                        onClick={() => {
                                            if (onSelectSourceFilter) {
                                                onSelectSourceFilter({name: sourceFilter.name, index: specificId});
                                            }
                                        }}
                                    >
                                        {specificId}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {targetFilter && (
                        <DropdownMenu>
                            <span style={filterChipStyle(getFilterTextColor(targetFilter, loggedInPlayer))}>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" style={filterChipButtonStyle}>
                                        <ChevronDown size={16}/>
                                        {`Target: ${targetFilter.name}${targetFilter.index !== undefined ? ` - ${targetFilter.index}` : ''}`}
                                    </button>
                                </DropdownMenuTrigger>
                                <button
                                    type="button"
                                    aria-label="Clear target filter"
                                    style={filterChipDeleteStyle}
                                    onClick={onClearTargetFilter}
                                >
                                    <X size={16}/>
                                </button>
                            </span>
                            <DropdownMenuContent className="max-h-[200px] min-w-[100px]">
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (onSelectTargetFilter) {
                                            onSelectTargetFilter({name: targetFilter.name});
                                        }
                                    }}
                                >
                                    All IDs
                                </DropdownMenuItem>
                                {targetSpecificIds.map((specificId) => (
                                    <DropdownMenuItem
                                        key={`target-id-${specificId}`}
                                        onClick={() => {
                                            if (onSelectTargetFilter) {
                                                onSelectTargetFilter({name: targetFilter.name, index: specificId});
                                            }
                                        }}
                                    >
                                        {specificId}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {equipmentFilter && (
                        <span style={filterChipStyle('white')}>
                            <AppTooltip
                                title="Equipment filter is based on when an event was recorded. However, some actions, such as projectile damage, may have been initiated while different equipment was equipped."
                            >
                                <span style={{display: 'inline-flex', marginLeft: '8px', marginRight: '4px'}}>
                                    <AlertCircle size={16} style={{color: '#f44336'}}/>
                                </span>
                            </AppTooltip>
                            <span style={{padding: '4px 0'}}>
                                {`Equipment: ${equipmentFilter.name || itemIdMap[equipmentFilter.id] || equipmentFilter.id}`}
                            </span>
                            <button
                                type="button"
                                aria-label="Clear equipment filter"
                                style={filterChipDeleteStyle}
                                onClick={onClearEquipmentFilter}
                            >
                                <X size={16}/>
                            </button>
                        </span>
                    )}
                    {prayerFilter && (
                        <span style={filterChipStyle('white')}>
                            <AppTooltip
                                title="Prayer filter is based on when an event was recorded. Active prayers and overhead prayers are tracked separately in the log."
                            >
                                <span style={{display: 'inline-flex', marginLeft: '8px', marginRight: '4px'}}>
                                    <AlertCircle size={16} style={{color: '#f44336'}}/>
                                </span>
                            </AppTooltip>
                            <span style={{padding: '4px 0'}}>
                                {`Prayer: ${prayerFilter.name || prayerIdMap[prayerFilter.id] || prayerFilter.id}`}
                            </span>
                            <button
                                type="button"
                                aria-label="Clear prayer filter"
                                style={filterChipDeleteStyle}
                                onClick={onClearPrayerFilter}
                            >
                                <X size={16}/>
                            </button>
                        </span>
                    )}
                    {eventTypeFilter && (
                        <span style={filterChipStyle('white')}>
                            <span style={{padding: '4px 10px'}}>{`Type: ${eventTypeFilter}`}</span>
                            <button
                                type="button"
                                aria-label="Clear event type filter"
                                style={filterChipDeleteStyle}
                                onClick={onClearEventTypeFilter}
                            >
                                <X size={16}/>
                            </button>
                        </span>
                    )}
                </div>
            )}
            <div
                className="events-table-container w-full overflow-y-auto max-h-[70vh] md:max-h-[var(--events-table-max-height)]"
                style={{
                    maxWidth: `${layout.contentMaxWidth}px`,
                    '--events-table-max-height': maxHeight,
                } as React.CSSProperties}
            >
                <div className="app-table-container" style={{marginBottom: 0}}>
                    <table className="app-table events-table" style={{tableLayout: 'auto'}}>
                        <thead style={{backgroundColor: '#494949'}}>
                            <tr>
                                <th className="events-table-col-time">Time</th>
                                <th className="events-table-col-type events-table-col-type-header">Type</th>
                                <th className="events-table-col-event">Event</th>
                                <th className="events-table-col-source">Source</th>
                                <th className="events-table-col-target">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8" style={{borderBottom: 'none'}}>
                                        <div className="flex justify-center">
                                            <Spinner size="lg"/>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                            logs.map((log, index) => {
                                const source = getActorName(log, 'source');
                                const target = getActorName(log, 'target');
                                return (
                                    <tr
                                        key={index}
                                        className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                        style={{cursor: 'default'}}
                                        onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                        onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}
                                    >
                                        <td className="events-table-col-time">{formatHHmmss(log.fightTimeMs!, true)}</td>
                                        <td className="events-table-col-type">
                                            {onSelectEventTypeFilter ? (
                                                <span className="link" onClick={() => onSelectEventTypeFilter(log.type)}>
                                                    {log.type}
                                                </span>
                                            ) : (
                                                log.type
                                            )}
                                        </td>
                                        <td className="events-table-col-event">
                                        {log.type === LogTypes.LOG_VERSION ? `Log version ${log.logVersion}` : ""}
                                        {log.type === LogTypes.LOGGED_IN_PLAYER ? `Logged in player ${log.loggedInPlayer}` : ""}
                                        {log.type === LogTypes.PLAYER_REGION ? `${log.playerRegion}` : ""}
                                        {log.type === LogTypes.BASE_LEVELS ? renderStatImages(log.baseLevels) : ""}
                                        {log.type === LogTypes.BOOSTED_LEVELS ? renderStatImages(log.boostedLevels) : ""}
                                        {log.type === LogTypes.PRAYER ? renderPrayerImages(log.prayers) : ""}
                                        {log.type === LogTypes.OVERHEAD ? renderPrayerImages([log.overhead]) : ""}
                                        {log.type === LogTypes.PLAYER_EQUIPMENT && Array.isArray(log.playerEquipment) ? (
                                            <div style={{display: 'flex'}}>
                                                {log.playerEquipment.map((itemId: string, i: number) => {
                                                    const id = parseInt(itemId);
                                                    return id > 0 ? (
                                                        <div
                                                            key={i}
                                                            className={onSelectEquipmentFilter ? 'link' : undefined}
                                                            style={{
                                                                width: '22px',
                                                                overflow: 'hidden',
                                                                marginRight: '5px',
                                                                backgroundColor: '#494945',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                cursor: onSelectEquipmentFilter ? 'pointer' : 'default',
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
                                                            <img src={getItemImageUrl(id)}
                                                                 alt={`Item ${itemId}`}
                                                                 style={{height: '22px'}}/>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        ) : ""}
                                        {log.type === LogTypes.DAMAGE ? (
                                            <>
                                                <span className="hitsplat-name">{log.hitsplatName} </span>
                                                <span className="damage-amount">{log.damageAmount}</span>
                                            </>
                                        ) : ""}
                                        {log.type === LogTypes.HEAL ? (
                                            <>
                                                <span className="hitsplat-name">{log.hitsplatName} </span>
                                                <span className="heal-amount">{log.healAmount}</span>
                                            </>
                                        ) : ""}
                                        {log.type === LogTypes.PLAYER_ATTACK_ANIMATION ? (
                                            <>
                                                <span className="attack-animation-text">{log.animationId} </span>
                                            </>
                                        ) : ""}
                                        {log.type === LogTypes.POSITION ? `(${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GRAPHICS_OBJECT_SPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GRAPHICS_OBJECT_DESPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GAME_OBJECT_SPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GAME_OBJECT_DESPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GROUND_OBJECT_SPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GROUND_OBJECT_DESPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.NPC_CHANGED ? `Changed ID: ${log.oldNpc.id} -> ${log.newNpc.id}` : ""}
                                        {log.type === LogTypes.WAVE_START}
                                        {log.type === LogTypes.WAVE_END}
                                        {log.type === LogTypes.PATH_START ? `${log.pathName}` : ""}
                                        {log.type === LogTypes.PATH_COMPLETE ? `${log.pathName}` : ""}
                                        {log.type === LogTypes.DURATION ? `${log.duration}` : ""}
                                        </td>
                                        <td className={cn('events-table-col-source', getSourceTextClass(source, loggedInPlayer))}>
                                            {(() => {
                                                const sourceActor = getActorFromLog(log, 'source');
                                                return sourceActor && onSelectSourceFilter ? (
                                                    <span
                                                        className="link link-inherit"
                                                        onClick={() => onSelectSourceFilter({
                                                            name: sourceActor.name,
                                                        })}
                                                    >
                                                        {source}
                                                    </span>
                                                ) : source;
                                            })()}
                                        </td>
                                        <td
                                            className={cn(
                                                'events-table-col-target',
                                                target === loggedInPlayer ? 'logged-in-player-text' : 'other-text',
                                            )}>
                                            {(() => {
                                                const targetActor = getActorFromLog(log, 'target');
                                                return targetActor && onSelectTargetFilter ? (
                                                    <span
                                                        className="link link-inherit"
                                                        onClick={() => onSelectTargetFilter({
                                                            name: targetActor.name,
                                                        })}
                                                    >
                                                        {target}
                                                    </span>
                                                ) : target;
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default EventsTable;
