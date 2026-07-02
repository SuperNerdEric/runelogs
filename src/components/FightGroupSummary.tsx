import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link as RouterLink, useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Box,
    CircularProgress,
    Link,
    Typography,
} from '@mui/material';
import DamageMeterTable from './charts/DamageMeterTable';
import {FightGroupFightRows} from './sections/LogFightList';
import RunInfoBox from './RunInfoBox';
import PageBreadcrumbs from './PageBreadcrumbs';
import {contentColumnSx, pageHeroTitleSx} from '../theme';
import {displayUsername, ticksToTime} from '../utils/utils';
import {getEncounterHref} from '../utils/encounterTableRow';
import {isUnknownPlayer, UNKNOWN_PLAYER_NAME} from '../utils/actorUtils';
import {getPlayerDpsDisplayColor} from '../utils/percentile';
import RunSummaryRankBadges from './badges/RunSummaryRankBadges';
import ColosseumModifiers from './ColosseumModifiers';
import ToaRaidLevel from './ToaRaidLevel';
import {hasColosseumModifierData} from '../utils/colosseumModifiers';
import {MOKHAIOTL_HIGH_SCORE_MODE_LABEL} from '../utils/leaderboardContent';
import {resolveFightGroupSpriteKey} from '../lib/hiscoreSprites';
import {FightGroupExtraInfo} from '../utils/fightGroupExtraInfo';
import {resolveFightOutcomeColor, resolveLiveFightTileState} from '../utils/fightDisplayStatus';
import LiveLogProgressAlert from './LiveLogProgressAlert';
import LogNameDisplay from './LogNameDisplay';
import {LIVE_PAGE_RETRY_INTERVAL_MS} from '../utils/livePageFetchRetry';
import {useLivePageRefreshPulse} from '../utils/useLivePageRefreshPulse';
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
        liveActiveEncounterId?: string | null;
        liveActiveFightId?: string | null;
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
    const navigate = useNavigate();
    const [data, setData] = useState<FightGroupSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [receivingData, setReceivingData] = useState(false);
    const {refreshing, runBackgroundRefresh} = useLivePageRefreshPulse();

    const loadSummary = useCallback(async (showLoading = true) => {
        const execute = async () => {
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
            if (res.status === 410) {
                const body = await res.json();
                if (body.redirectTo) {
                    navigate(body.redirectTo);
                    return;
                }
            }
            // 404 fast-fail: intermittent 404 during live logging is a backend bug; see livePageFetchRetry.
            if (!res.ok) {
                throw new Error(`Server responded with status ${res.status}`);
            }
            const body: FightGroupSummaryData = await res.json();
            setData(body);
            setReceivingData(Boolean(body.receivingData));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
        };

        if (showLoading) {
            return execute();
        }
        return runBackgroundRefresh(execute);
    }, [id, navigate, runBackgroundRefresh]);

    useEffect(() => {
        setData(null);
        setReceivingData(false);
        void loadSummary(true);
    }, [id, loadSummary]);

    useEffect(() => {
        if (!id || !receivingData) {
            return;
        }
        const interval = window.setInterval(() => loadSummary(false), LIVE_PAGE_RETRY_INTERVAL_MS);
        return () => window.clearInterval(interval);
    }, [id, receivingData, loadSummary]);

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
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" p={4}>
                <Alert severity="error">{error ?? 'Run not found'}</Alert>
            </Box>
        );
    }

    const {displayDurationTicks, delve1to8DisplayDurationTicks} = data;
    const runInProgress = Boolean(data.receivingData);
    const durationColor = resolveFightOutcomeColor(data.success, runInProgress);

    const topRankLabel = (entry: PlayerRank) => {
        if (entry.category === 'Duration' || entry.category === MOKHAIOTL_HIGH_SCORE_MODE_LABEL) {
            return '';
        }
        return `${displayUsername(entry.playerId)} — Overall`;
    };

    return (
        <Box p={2} sx={contentColumnSx} className="fight-group-summary">
            {data.receivingData && (
                <LiveLogProgressAlert refreshing={refreshing} sx={{mb: 2}}/>
            )}

            <PageBreadcrumbs
                segments={[
                    {
                        label: (
                            <LogNameDisplay
                                name={data.log.name}
                                isLive={Boolean(data.receivingData)}
                            />
                        ),
                        title: data.log.name ?? 'Unnamed',
                        href: `/log/${data.log.id}`,
                    },
                    {
                        label: data.name,
                        spriteKey: resolveFightGroupSpriteKey(data.name, data.leaderboardName),
                    },
                ]}
            />

            <Box className="run-summary-hero" sx={{textAlign: 'center', mb: 2}}>
                <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                        ...pageHeroTitleSx,
                        mb: displayDurationTicks != null && displayDurationTicks > 0 ? 0.5 : 0,
                    }}
                >
                    {data.name}
                </Typography>
                {(runInProgress || (displayDurationTicks != null && displayDurationTicks > 0)) && (
                    <Box sx={{m: 0}}>
                        {displayDurationTicks != null && displayDurationTicks > 0 && (
                            <Typography
                                component="p"
                                sx={{
                                    color: durationColor,
                                    fontWeight: 700,
                                    fontSize: {xs: '1.25rem', sm: '1.75rem'},
                                    m: 0,
                                }}
                            >
                                {ticksToTime(displayDurationTicks)}
                            </Typography>
                        )}
                        {runInProgress && (
                            <Typography
                                component="p"
                                variant="body2"
                                sx={{
                                    color: durationColor,
                                    fontWeight: 600,
                                    mt: displayDurationTicks != null && displayDurationTicks > 0 ? 0.5 : 0,
                                    mb: 0,
                                }}
                            >
                                In Progress
                            </Typography>
                        )}
                        {delve1to8DisplayDurationTicks != null && (
                            <Typography
                                component="p"
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    mt: 0.5,
                                    mb: 0,
                                }}
                            >
                                Delves 1–8: {ticksToTime(delve1to8DisplayDurationTicks)}
                            </Typography>
                        )}
                    </Box>
                )}
                <ToaRaidLevel toa={data.extraInfo?.toa} />
            </Box>

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
                <ColosseumModifiers modifiers={data.extraInfo!.colosseum} />
            )}

            {data.overallDps.length > 0 && (
                <Box className="damage-done-container fight-group-dps-table" sx={{mb: 2}}>
                    <Box className="encounter-title-bar">
                        <span className="encounter-title-bar-name">Overall Damage</span>
                    </Box>
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
                                        <Link
                                            component={RouterLink}
                                            to={`/player/${row.playerId}`}
                                            underline="hover"
                                            color="inherit"
                                        >
                                            {displayUsername(row.playerId)}
                                        </Link>
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
                </Box>
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
                        const fightStates = data.fights.map((entry) => ({
                            id: entry.id,
                            success: entry.success,
                            order: entry.order,
                        }));
                        const tileState = resolveLiveFightTileState(
                            runInProgress,
                            data.success,
                            fightStates,
                            {
                                id: fight.id,
                                success: fight.success,
                                order: fight.order,
                            },
                            data.log.liveActiveEncounterId,
                            data.log.liveActiveFightId,
                        );
                        return {
                            fight: {
                                name: fight.name,
                                startTime: fight.startTime,
                                fightDurationTicks: fight.fightDurationTicks,
                                success: tileState.displaySuccess,
                                inProgress: tileState.inProgress,
                            },
                            index: 0,
                            fightGroupIndex,
                            href: getEncounterHref(fight.id),
                            rankBadges,
                        };
                    })}
                />
            </div>
        </Box>
    );
};

export default FightGroupSummary;
