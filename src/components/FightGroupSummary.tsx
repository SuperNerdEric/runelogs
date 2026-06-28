import React, {useEffect, useMemo, useState} from 'react';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DamageMeterTable from './charts/DamageMeterTable';
import {FightGroupFightRows} from './sections/LogFightList';
import RunInfoBox from './RunInfoBox';
import PageBreadcrumbs from './PageBreadcrumbs';
import {contentColumnClass, pageHeroTitleClass} from '../theme';
import {colors} from '../theme';
import {displayUsername, ticksToTime} from '../utils/utils';
import {getEncounterHref} from '../utils/encounterTableRow';
import {isUnknownPlayer, UNKNOWN_PLAYER_NAME} from '../utils/actorUtils';
import {getPlayerDpsDisplayColor} from '../utils/percentile';
import RunSummaryRankBadges from './badges/RunSummaryRankBadges';
import ColosseumModifiers from './ColosseumModifiers';
import ToaRaidLevel from './ToaRaidLevel';
import {hasColosseumModifierData} from '../utils/colosseumModifiers';
import {MOKHAIOTL_HIGH_SCORE_MODE_LABEL} from '../utils/leaderboardContent';
import {FightGroupExtraInfo} from '../utils/fightGroupExtraInfo';
import {resolvePlayerRankPercentile} from './badges/playerRankPercentile';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';
import '../App.css';

interface PlayerDpsRow {
    playerId: string;
    damageDealt: number;
    dps: number;
    percentile?: number;
    rank?: number;
}

interface PlayerRank {
    playerId: string;
    category: string;
    rank: number;
    percentile?: number;
}

interface FightGroupFight {
    id: string;
    name: string;
    startTime: string;
    fightDurationTicks: number;
    success: boolean;
    order: number;
    dpsLeaderboardKey?: string | null;
    playerDps?: Array<{
        playerId: string;
        percentile?: number;
        rank?: number;
    }>;
}

interface FightGroupSummaryData {
    id: string;
    name: string;
    leaderboardName: string | null;
    officialDurationTicks: number | null;
    displayDurationTicks: number | null;
    delve1to8DisplayDurationTicks?: number | null;
    success: boolean;
    startTime: string;
    log: {
        id: string;
        uploaderId: string;
        uploadedAt: string;
        name: string | null;
    };
    receivingData?: boolean;
    players: string[];
    playerCount: number;
    durationRank: number | null;
    durationPercentile: number | null;
    overallDps: PlayerDpsRow[];
    playerRanks: PlayerRank[];
    fights: FightGroupFight[];
    extraInfo?: FightGroupExtraInfo | null;
}

const TOP_RANK_CATEGORIES = new Set(['Duration', 'Overall DPS', MOKHAIOTL_HIGH_SCORE_MODE_LABEL]);

const FightGroupSummary: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const [data, setData] = useState<FightGroupSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSummary = async (showLoading = true) => {
        if (!id) {
            setError('No run id provided in URL');
            setLoading(false);
            return;
        }

        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/fightGroup/${id}`);
            if (!res.ok) {
                throw new Error(`Server responded with status ${res.status}`);
            }
            const body: FightGroupSummaryData = await res.json();
            setData(body);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadSummary(true);
    }, [id]);

    useEffect(() => {
        if (!data?.receivingData) {
            return;
        }
        const interval = window.setInterval(() => loadSummary(false), 5000);
        return () => window.clearInterval(interval);
    }, [data?.receivingData, id]);

    const topRankBadges = useMemo(() => {
        if (!data) {
            return [];
        }
        return data.playerRanks.filter(
            (entry) => TOP_RANK_CATEGORIES.has(entry.category) && !isUnknownPlayer(entry.playerId),
        );
    }, [data]);

    const fightRankBadgesByKey = useMemo(() => {
        if (!data) {
            return new Map<string, PlayerRank[]>();
        }
        const map = new Map<string, PlayerRank[]>();
        for (const entry of data.playerRanks) {
            if (TOP_RANK_CATEGORIES.has(entry.category) || isUnknownPlayer(entry.playerId)) {
                continue;
            }
            const list = map.get(entry.category) ?? [];
            list.push(entry);
            map.set(entry.category, list);
        }
        return map;
    }, [data]);

    const percentileContext = useMemo(() => {
        const deepDelveRank = data?.playerRanks.find(
            (entry) => entry.category === MOKHAIOTL_HIGH_SCORE_MODE_LABEL,
        );
        return {
            overallDps: data?.overallDps ?? [],
            fights: data?.fights.map((fight) => ({
                dpsLeaderboardKey: fight.dpsLeaderboardKey,
                name: fight.name,
                playerDps: fight.playerDps ?? [],
            })),
            durationPercentile: data?.durationPercentile,
            highScorePercentile: deepDelveRank?.percentile,
        };
    }, [data]);

    if (loading) {
        return (
            <div className="loading-indicator-container">
                <Spinner className="size-8 text-white"/>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertDescription>{error ?? 'Run not found'}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const {displayDurationTicks, delve1to8DisplayDurationTicks} = data;
    const durationColor = data.success ? colors.fight.success : colors.fight.failure;

    const topRankLabel = (entry: PlayerRank) => {
        if (entry.category === 'Duration' || entry.category === MOKHAIOTL_HIGH_SCORE_MODE_LABEL) {
            return '';
        }
        return `${displayUsername(entry.playerId)} — Overall`;
    };

    return (
        <div className={cn(contentColumnClass, 'fight-group-summary p-2')}>
            {data.receivingData && (
                <Alert className="fight-group-summary-alert border-sky-500/40 bg-sky-500/10">
                    <AlertDescription>
                        Live log in progress — this page will refresh while new data is received.
                    </AlertDescription>
                </Alert>
            )}

            <PageBreadcrumbs
                segments={[
                    {
                        label: data.log.name ?? 'Unnamed',
                        href: `/log/${data.log.id}`,
                    },
                    {label: data.name},
                ]}
            />

            <div className="run-summary-hero text-center">
                <h1
                    className={cn(
                        pageHeroTitleClass,
                        displayDurationTicks != null && displayDurationTicks > 0 ? 'mb-1' : 'mb-0',
                    )}
                >
                    {data.name}
                </h1>
                {displayDurationTicks != null && displayDurationTicks > 0 && (
                    <div className="m-0">
                        <p className="run-summary-duration" style={{color: durationColor}}>
                            {ticksToTime(displayDurationTicks)}
                        </p>
                        {delve1to8DisplayDurationTicks != null && (
                            <p className="run-summary-delve-caption">
                                Delves 1–8: {ticksToTime(delve1to8DisplayDurationTicks)}
                            </p>
                        )}
                    </div>
                )}
                <ToaRaidLevel toa={data.extraInfo?.toa}/>
            </div>

            <RunSummaryRankBadges
                entries={topRankBadges}
                percentileContext={percentileContext}
                leaderboardName={data.leaderboardName}
                playerCount={data.playerCount}
                labelForEntry={topRankLabel}
            />

            <RunInfoBox
                uploaderId={data.log.uploaderId}
                startTime={data.startTime}
                players={data.players}
            />

            {hasColosseumModifierData(data.extraInfo?.colosseum) && (
                <ColosseumModifiers modifiers={data.extraInfo!.colosseum}/>
            )}

            {data.overallDps.length > 0 && (
                <div className="damage-done-container fight-group-dps-table">
                    <div className="encounter-title-bar">
                        <span className="encounter-title-bar-name">Overall Damage</span>
                    </div>
                    <DamageMeterTable
                        rows={data.overallDps.map((row) => {
                            const unknown = isUnknownPlayer(row.playerId);
                            const dpsDisplay = getPlayerDpsDisplayColor(row.playerId, row.percentile);
                            return {
                                key: row.playerId,
                                name: (
                                    <>
                                        {unknown ? (
                                            UNKNOWN_PLAYER_NAME
                                        ) : (
                                            <RouterLink
                                                to={`/player/${row.playerId}`}
                                                className="link"
                                            >
                                                {displayUsername(row.playerId)}
                                            </RouterLink>
                                        )}
                                    </>
                                ),
                                nameClassName: unknown ? 'unknown-text' : undefined,
                                damageDealt: row.damageDealt,
                                dps: row.dps,
                                dpsColor: dpsDisplay.color,
                                useDpsTextClass: dpsDisplay.useDpsTextClass,
                            };
                        })}
                    />
                </div>
            )}

            <div className="damage-done-container">
                <FightGroupFightRows
                    fights={data.fights.map((fight, fightGroupIndex) => {
                        const fightKey = fight.dpsLeaderboardKey ?? fight.name;
                        const rankBadges = (fightRankBadgesByKey.get(fightKey) ?? [])
                            .filter((entry) => !isUnknownPlayer(entry.playerId))
                            .map((entry) => ({
                                playerId: entry.playerId,
                                rank: entry.rank,
                                percentile: resolvePlayerRankPercentile(entry, percentileContext),
                            }));
                        return {
                            fight: {
                                name: fight.name,
                                startTime: fight.startTime,
                                fightDurationTicks: fight.fightDurationTicks,
                                success: fight.success,
                            },
                            index: 0,
                            fightGroupIndex,
                            href: getEncounterHref(fight.id),
                            rankBadges,
                        };
                    })}
                />
            </div>
        </div>
    );
};

export default FightGroupSummary;
