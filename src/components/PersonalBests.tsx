import React, {useEffect, useMemo, useState} from 'react';
import {Link as RouterLink, useNavigate, useParams} from 'react-router-dom';
import {format} from 'date-fns';
import {encounterTableRowProps, getEncounterHref, stopRowClick} from '../utils/encounterTableRow';
import {buildLeaderboardHref, LeaderboardMode, LEADERBOARD_CONTENT_OPTIONS} from '../utils/leaderboardContent';
import {
    buildDurationPersonalBestEntries,
    DurationPersonalBestEntry,
    DurationStandaloneFightPersonalBest,
} from '../utils/personalBests';
import {colors} from '../theme';
import {getDpsPercentileColor} from '../utils/TickActivity';
import {COLUMN_TOOLTIPS} from '../utils/columnTooltips';
import TableColumnHeaderTooltip from './TableColumnHeaderTooltip';
import {getPercentileAccentColor, rankToPercentile} from '../utils/percentile';
import {ticksToTime} from '../utils/utils';
import {CrownIcon} from './CrownIcon';
import MedalIcon from './MedalIcon';
import TrophyIcon from './TrophyIcon';
import DurationDpsModeSelector from './DurationDpsModeSelector';
import FilterSelect from './filters/FilterSelect';
import FilterToolbar from './filters/FilterToolbar';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';

interface DurationFightGroup extends DurationPersonalBestEntry {}

interface DurationStandaloneFight extends DurationStandaloneFightPersonalBest {}

interface DpsPersonalBest {
    contentName: string;
    fightKey: string;
    playerCount: number;
    dps: number;
    rank: number;
    leaderboardSize: number;
    encounterId: string;
    encounterType: 'fight' | 'fightGroup';
    startTime: string;
    players: string[];
}

type DpsConfigGroup = {
    contentName: string;
    fights: string[];
    hasOverall: boolean;
};

interface PersonalBestsResponse {
    player: string;
    personalBests: {
        fights: DurationStandaloneFight[];
        fightGroups: Omit<DurationFightGroup, 'resultType'>[];
    };
}

interface DpsPersonalBestsResponse {
    player: string;
    entries: DpsPersonalBest[];
}

function dpsRankColor(rank: number, leaderboardSize: number): string {
    return getDpsPercentileColor(rankToPercentile(rank, leaderboardSize));
}

const PersonalBests: React.FC = () => {
    const navigate = useNavigate();
    const {playerName} = useParams<{ playerName: string }>();
    const [mode, setMode] = useState<LeaderboardMode>('time');
    const [durationData, setDurationData] = useState<PersonalBestsResponse | null>(null);
    const [dpsData, setDpsData] = useState<DpsPersonalBestsResponse | null>(null);
    const [dpsConfig, setDpsConfig] = useState<DpsConfigGroup[]>([]);
    const [selectedFights, setSelectedFights] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [dpsLoading, setDpsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/dps-leaderboard/config`)
            .then((res) => res.ok ? res.json() : Promise.reject())
            .then((data) => setDpsConfig(data.fightGroups ?? []))
            .catch(() => setDpsConfig([]));
    }, []);

    useEffect(() => {
        if (!playerName) {
            return;
        }

        const fetchDuration = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/player/${playerName}/personal-bests`);
                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`);
                }
                const json = await res.json();
                setDurationData(json);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchDuration();
    }, [playerName]);

    useEffect(() => {
        if (!playerName || mode !== 'dps' || dpsData) {
            return;
        }

        const fetchDps = async () => {
            setDpsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/player/${playerName}/dps-personal-bests`);
                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`);
                }
                const json = await res.json();
                setDpsData(json);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                setError(message);
            } finally {
                setDpsLoading(false);
            }
        };

        fetchDps();
    }, [playerName, mode, dpsData]);

    const fightsByContent = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const group of dpsConfig) {
            map.set(group.contentName, group.fights);
        }
        return map;
    }, [dpsConfig]);

    const getSelectedFight = (contentValue: string, availableFights: string[]) => {
        const selected = selectedFights[contentValue];
        if (selected && availableFights.includes(selected)) {
            return selected;
        }
        if (availableFights.includes('Overall')) {
            return 'Overall';
        }
        return availableFights[0] ?? 'Overall';
    };

    const durationEntries = useMemo(
        () => buildDurationPersonalBestEntries(durationData?.personalBests),
        [durationData],
    );

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="text-white"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8">
                <p className="text-[var(--color-fight-failure)]">{error}</p>
            </div>
        );
    }

    const dpsEntries = dpsData?.entries ?? [];
    const isBusy = mode === 'dps' && dpsLoading;
    const hasDuration = durationEntries.length > 0;
    const hasDps = dpsEntries.length > 0;

    const renderPlayers = (players: string[] | undefined, highlightPlayer?: string) => {
        if (!players?.length) {
            return '-';
        }
        return players.map((p, i) => (
            <React.Fragment key={p}>
                <RouterLink
                    to={`/player/${p}`}
                    className={cn('link', p === highlightPlayer && 'link-player')}
                    onClick={stopRowClick}
                >
                    {p}
                </RouterLink>
                {i < players.length - 1 ? ', ' : ''}
            </React.Fragment>
        ));
    };

    const renderDate = (startTime?: string) => {
        if (!startTime) {
            return '-';
        }
        return (
            <>
                <span className="date-responsive-short">
                    {format(new Date(startTime), 'MMM d, yyyy')}
                </span>
                <span className="date-responsive-full">
                    {format(new Date(startTime), 'PPp')}
                </span>
            </>
        );
    };

    const renderRank = (rank: number | undefined, color: string, href?: string) => {
        if (!rank) {
            return '-';
        }
        const content = (
            <span className="inline-flex items-center gap-2">
                <span style={{color, fontWeight: 'bold'}}>{rank}</span>
                {rank === 1 && <CrownIcon/>}
                {rank === 2 && <MedalIcon color={colors.medal.silver}/>}
                {rank === 3 && <MedalIcon color={colors.medal.bronze}/>}
            </span>
        );
        if (!href) {
            return content;
        }
        return (
            <RouterLink to={href} onClick={stopRowClick} className="table-link-inherit">
                {content}
            </RouterLink>
        );
    };

    return (
        <div className="mt-8">
            <div className="player-section-header pb-2">
                <span className="inline-flex items-center leading-none">
                    <TrophyIcon size={34}/>
                </span>
                <h2 className="player-section-title">Personal Bests</h2>
            </div>

            <FilterToolbar modeSelector={<DurationDpsModeSelector value={mode} onChange={setMode}/>}/>

            {isBusy && (
                <div className="flex justify-center py-8">
                    <Spinner className="text-white"/>
                </div>
            )}

            {!isBusy && mode === 'time' && !hasDuration && (
                <p className="text-white">No personal bests found.</p>
            )}

            {!isBusy && mode === 'dps' && !hasDps && (
                <p className="text-white">No DPS personal bests found.</p>
            )}

            {!isBusy && mode === 'time' && LEADERBOARD_CONTENT_OPTIONS.map((content) => {
                const relevantFights = durationEntries
                    .filter((f) => f.leaderboardName === content.value)
                    .sort((a, b) => a.playerCount - b.playerCount);

                if (relevantFights.length === 0) {
                    return null;
                }

                return (
                    <div key={content.value} className="mb-6">
                        <h3 className="content-section-title">{content.label}</h3>

                        <div className="app-table-container">
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap max-[1279px]:min-w-8">#</th>
                                        <th>Rank</th>
                                        <th>Duration</th>
                                        <th>Players</th>
                                        <th className="app-table-cell--hide-mobile whitespace-nowrap">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {content.playerCounts.map((count) => {
                                        const match = relevantFights.find((f) => f.playerCount === count);

                                        return (
                                            <tr
                                                key={count}
                                                {...encounterTableRowProps(navigate, match?.id, {
                                                    durationResultType: match?.resultType,
                                                })}
                                            >
                                                <td className="whitespace-nowrap max-[1279px]:min-w-8">
                                                    {match ? (
                                                        <RouterLink
                                                            to={getEncounterHref(match.id, {
                                                                durationResultType: match.resultType,
                                                            })}
                                                            className="link"
                                                            onClick={stopRowClick}
                                                        >
                                                            {count}
                                                        </RouterLink>
                                                    ) : (
                                                        count
                                                    )}
                                                </td>
                                                <td onClick={stopRowClick}>
                                                    {renderRank(
                                                        match?.rank,
                                                        match?.percentile !== undefined
                                                            ? getPercentileAccentColor(match.percentile)
                                                            : 'white',
                                                        match?.rank
                                                            ? buildLeaderboardHref({
                                                                mode: 'time',
                                                                leaderboard: content.value,
                                                                playerCount: count,
                                                                highlightRank: match.rank,
                                                            })
                                                            : undefined,
                                                    )}
                                                </td>
                                                <td>
                                                    {match ? ticksToTime(match.officialDurationTicks) : '-'}
                                                </td>
                                                <td>{renderPlayers(match?.players, playerName)}</td>
                                                <td className="app-table-cell--hide-mobile whitespace-nowrap">
                                                    {renderDate(match?.startTime)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {!isBusy && mode === 'dps' && LEADERBOARD_CONTENT_OPTIONS.map((content) => {
                const configFights = fightsByContent.get(content.value) ?? [];
                const contentEntries = dpsEntries.filter((entry) => entry.contentName === content.value);
                if (contentEntries.length === 0) {
                    return null;
                }

                const availableFights = configFights.length > 0
                    ? configFights.filter((fight) => contentEntries.some((entry) => entry.fightKey === fight))
                    : Array.from(new Set(contentEntries.map((entry) => entry.fightKey))).sort();

                const selectedFight = getSelectedFight(content.value, availableFights);
                const relevantEntries = contentEntries
                    .filter((entry) => entry.fightKey === selectedFight)
                    .sort((a, b) => a.playerCount - b.playerCount);

                return (
                    <div key={content.value} className="mb-6">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                            <h3 className="content-section-title m-0">{content.label}</h3>
                            {availableFights.length > 1 && (
                                <div className="min-w-full flex-[0_0_220px] sm:min-w-0 sm:w-[220px]">
                                    <FilterSelect
                                        field="fight"
                                        value={selectedFight}
                                        options={availableFights.map((fight) => ({
                                            value: fight,
                                            label: fight,
                                        }))}
                                        className="min-w-[120px]"
                                        onChange={(fight) => {
                                            setSelectedFights((prev) => ({
                                                ...prev,
                                                [content.value]: fight,
                                            }));
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="app-table-container">
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap max-[1279px]:min-w-8">#</th>
                                        <th>Rank</th>
                                        <th>
                                            <TableColumnHeaderTooltip
                                                label="DPS"
                                                tooltip={COLUMN_TOOLTIPS.dps}
                                            />
                                        </th>
                                        <th className="app-table-cell--hide-mobile whitespace-nowrap">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {content.playerCounts.map((count) => {
                                        const match = relevantEntries.find((entry) => entry.playerCount === count);
                                        const rankColor = match
                                            ? dpsRankColor(match.rank, match.leaderboardSize)
                                            : 'white';

                                        return (
                                            <tr
                                                key={count}
                                                {...encounterTableRowProps(navigate, match?.encounterId, {
                                                    encounterType: match?.encounterType,
                                                    fightKey: selectedFight,
                                                })}
                                            >
                                                <td className="whitespace-nowrap max-[1279px]:min-w-8">
                                                    {match ? (
                                                        <RouterLink
                                                            to={getEncounterHref(match.encounterId, {
                                                                encounterType: match.encounterType,
                                                                fightKey: selectedFight,
                                                            })}
                                                            className="link"
                                                            onClick={stopRowClick}
                                                        >
                                                            {count}
                                                        </RouterLink>
                                                    ) : (
                                                        count
                                                    )}
                                                </td>
                                                <td onClick={stopRowClick}>
                                                    {renderRank(
                                                        match?.rank,
                                                        rankColor,
                                                        match?.rank
                                                            ? buildLeaderboardHref({
                                                                mode: 'dps',
                                                                leaderboard: content.value,
                                                                playerCount: count,
                                                                fight: selectedFight,
                                                                highlightRank: match.rank,
                                                            })
                                                            : undefined,
                                                    )}
                                                </td>
                                                <td style={{color: rankColor, fontWeight: 'bold'}}>
                                                    {match ? match.dps : '-'}
                                                </td>
                                                <td className="app-table-cell--hide-mobile whitespace-nowrap">
                                                    {renderDate(match?.startTime)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PersonalBests;
