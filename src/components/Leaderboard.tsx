import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom';
import {colors} from '../theme';
import {encounterTableRowProps, getEncounterHref, stopRowClick} from '../utils/encounterTableRow';
import {
    buildLeaderboardHref,
    buildLeaderboardPlayerCountOptions,
    getLeaderboardModesForContent,
    getHighScoreLevelColumnLabel,
    isMokhaiotlLeaderboardContent,
    LEADERBOARD_CONTENT_OPTIONS,
    LEADERBOARD_MODE_HIGH_SCORE,
    LeaderboardDpsConfigGroup,
    LeaderboardMode,
    MOKHAIOTL_DELVE_1_8_KEY,
    resolveLeaderboardStateFromSearchParams,
} from '../utils/leaderboardContent';
import {getDpsPercentileColor} from '../utils/TickActivity';
import {COLUMN_TOOLTIPS} from '../utils/columnTooltips';
import TableColumnHeaderTooltip from './TableColumnHeaderTooltip';
import {getPercentileAccentColor} from '../utils/percentile';
import {ticksToTime} from '../utils/utils';
import {CrownIcon} from './CrownIcon';
import DurationDpsModeSelector from './DurationDpsModeSelector';
import FilterSelect from './filters/FilterSelect';
import FilterToolbar from './filters/FilterToolbar';
import {filterFieldCompactClass} from './filters/filterStyles';
import MedalIcon from './MedalIcon';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';
import {ChevronLeft, ChevronRight} from 'lucide-react';

type DurationEntry = {
    id: string;
    duration: number;
    players: string[];
    percentile?: number;
    highScoreLevel?: number;
};

type DpsEntry = {
    rank: number;
    player: string;
    dps: number;
    encounterId: string;
    encounterType: 'fight' | 'fightGroup';
};

type DpsConfigGroup = LeaderboardDpsConfigGroup & {
    hasOverall: boolean;
};

interface LeaderboardProps {
    entriesPerPage?: number;
}

function TablePagination({
    count,
    page,
    onPageChange,
}: {
    count: number;
    page: number;
    onPageChange: (page: number) => void;
}) {
    if (count <= 1) {
        return null;
    }

    return (
        <nav className="app-pagination" aria-label="Pagination">
            <button
                type="button"
                className="app-pagination__btn"
                disabled={page <= 1}
                aria-label="Previous page"
                onClick={() => onPageChange(page - 1)}
            >
                <ChevronLeft className="size-5" aria-hidden />
            </button>
            {Array.from({length: count}, (_, index) => index + 1).map((pageNumber) => (
                <button
                    key={pageNumber}
                    type="button"
                    className={cn(
                        'app-pagination__btn',
                        pageNumber === page && 'app-pagination__btn--selected',
                    )}
                    onClick={() => onPageChange(pageNumber)}
                >
                    {pageNumber}
                </button>
            ))}
            <button
                type="button"
                className="app-pagination__btn"
                disabled={page >= count}
                aria-label="Next page"
                onClick={() => onPageChange(page + 1)}
            >
                <ChevronRight className="size-5" aria-hidden />
            </button>
        </nav>
    );
}

const Leaderboard: React.FC<LeaderboardProps> = ({entriesPerPage = 25}) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [dpsConfig, setDpsConfig] = useState<DpsConfigGroup[]>([]);

    const {
        mode,
        content,
        playerCount,
        selectedFight,
        highlightRank,
    } = useMemo(
        () => resolveLeaderboardStateFromSearchParams(searchParams, dpsConfig),
        [searchParams, dpsConfig],
    );

    const [durationEntries, setDurationEntries] = useState<DurationEntry[] | null>(null);
    const [durationResultType, setDurationResultType] = useState<'fight' | 'fightGroup'>('fight');
    const [dpsEntries, setDpsEntries] = useState<DpsEntry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

    const availableFights = dpsConfig.find((group) => group.contentName === content.value)?.fights ?? [];

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/dps-leaderboard/config`)
            .then((res) => res.ok ? res.json() : Promise.reject())
            .then((data) => setDpsConfig(data.fightGroups ?? []))
            .catch(() => setDpsConfig([]));
    }, []);

    const fetchHighScoreData = useCallback(async () => {
        const url = `${import.meta.env.VITE_API_URL}/high-score-leaderboard?content=${encodeURIComponent(
            content.value,
        )}&playerCount=${playerCount}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setDurationEntries(data.leaderboard);
        setDurationResultType('fightGroup');
    }, [content, playerCount]);

    const fetchDurationData = useCallback(async () => {
        const url = `${import.meta.env.VITE_API_URL}/leaderboard?content=${encodeURIComponent(
            content.value,
        )}&playerCount=${playerCount}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setDurationEntries(data.leaderboard);
        setDurationResultType(data.type === 'fightGroup' ? 'fightGroup' : 'fight');
    }, [content, playerCount]);

    const fetchDpsData = useCallback(async () => {
        const url = `${import.meta.env.VITE_API_URL}/dps-leaderboard?content=${encodeURIComponent(
            content.value,
        )}&fight=${encodeURIComponent(selectedFight)}&playerCount=${playerCount}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setDpsEntries(data.leaderboard);
    }, [content, playerCount, selectedFight]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (mode === 'dps') {
                await fetchDpsData();
            } else if (mode === LEADERBOARD_MODE_HIGH_SCORE) {
                await fetchHighScoreData();
            } else {
                await fetchDurationData();
            }
        } catch (e: any) {
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [mode, fetchDpsData, fetchDurationData, fetchHighScoreData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!highlightRank) {
            setPage(1);
            return;
        }
        setPage(Math.max(1, Math.ceil(highlightRank / entriesPerPage)));
    }, [highlightRank, entriesPerPage, mode, content.value, playerCount, selectedFight]);

    useEffect(() => {
        if (!highlightRank || loading) {
            return;
        }
        const timer = window.setTimeout(() => {
            highlightedRowRef.current?.scrollIntoView({block: 'center', behavior: 'smooth'});
        }, 100);
        return () => window.clearTimeout(timer);
    }, [highlightRank, loading, page, durationEntries, dpsEntries, mode]);

    const updateSearchParams = (updates: Record<string, string>) => {
        setSearchParams({
            mode,
            leaderboard: content.value,
            playerCount: playerCount.toString(),
            ...(mode === 'dps' ? {fight: selectedFight} : {}),
            ...updates,
        });
    };

    const setLeaderboardSearchParams = (params: {
        mode: LeaderboardMode;
        leaderboard: string;
        playerCount: number;
        fight?: string;
        highlightRank?: number | null;
    }) => {
        setSearchParams(Object.fromEntries(
            new URLSearchParams(
                buildLeaderboardHref({
                    mode: params.mode,
                    leaderboard: params.leaderboard,
                    playerCount: params.playerCount,
                    fight: params.fight,
                    highlightRank: params.highlightRank ?? undefined,
                }).split('?')[1] ?? '',
            ),
        ));
    };

    const dpsTotal = dpsEntries?.length ?? 0;
    const durationRows = durationEntries ?? [];
    const dpsRows = dpsEntries ?? [];

    const renderTableStatusRow = (colSpan: number, contentNode: React.ReactNode) => (
        <tr>
            <td colSpan={colSpan} className="app-table-status-cell">
                {contentNode}
            </td>
        </tr>
    );

    const isHighScoreMode = mode === LEADERBOARD_MODE_HIGH_SCORE;
    const highScoreLevelColumn = getHighScoreLevelColumnLabel(content.value);

    const renderDurationTable = () => (
        <div>
            <div className="app-table-container">
                <table className="app-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            {isHighScoreMode && <th>{highScoreLevelColumn}</th>}
                            <th>{isHighScoreMode ? 'Time' : 'Duration'}</th>
                            <th>Players</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && renderTableStatusRow(isHighScoreMode ? 4 : 3, <Spinner className="mx-auto text-white" size="sm"/>)}
                        {!loading && error && renderTableStatusRow(isHighScoreMode ? 4 : 3, (
                            <span className="text-[var(--color-fight-failure)]">{error}</span>
                        ))}
                        {!loading && !error && durationRows.length === 0 && renderTableStatusRow(isHighScoreMode ? 4 : 3, (
                            <span className="text-white">No records yet.</span>
                        ))}
                        {!loading && !error && durationRows
                            .slice((page - 1) * entriesPerPage, page * entriesPerPage)
                            .map((row, idx) => {
                                const actualRank = (page - 1) * entriesPerPage + idx + 1;
                                const isHighlighted = highlightRank === actualRank;
                                const rankColor = getPercentileAccentColor(row.percentile);
                                const rowProps = encounterTableRowProps(navigate, row.id, {
                                    durationResultType,
                                });
                                return (
                                    <tr
                                        key={row.id}
                                        ref={isHighlighted ? highlightedRowRef : undefined}
                                        className={cn(
                                            rowProps.className,
                                            isHighlighted && 'highlighted-leaderboard-row',
                                        )}
                                        onClick={rowProps.onClick}
                                    >
                                        <td style={{color: rankColor, fontWeight: 'bold'}}>
                                            <RouterLink
                                                to={getEncounterHref(row.id, {durationResultType})}
                                                onClick={stopRowClick}
                                                className="table-link-inherit"
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    {actualRank}
                                                    {actualRank === 1 && <CrownIcon/>}
                                                    {actualRank === 2 && <MedalIcon color={colors.medal.silver}/>}
                                                    {actualRank === 3 && <MedalIcon color={colors.medal.bronze}/>}
                                                </span>
                                            </RouterLink>
                                        </td>
                                        {isHighScoreMode && (
                                            <td>{row.highScoreLevel ?? '—'}</td>
                                        )}
                                        <td>{ticksToTime(row.duration)}</td>
                                        <td>
                                            {row.players.map((player, i) => (
                                                <React.Fragment key={player}>
                                                    <RouterLink
                                                        to={`/player/${player}`}
                                                        className="link"
                                                        onClick={stopRowClick}
                                                    >
                                                        {player}
                                                    </RouterLink>
                                                    {i < row.players.length - 1 ? ', ' : ''}
                                                </React.Fragment>
                                            ))}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
            {!loading && durationRows.length > 0 && (
                <TablePagination
                    count={Math.ceil(durationRows.length / entriesPerPage)}
                    page={page}
                    onPageChange={setPage}
                />
            )}
        </div>
    );

    const renderDpsTable = () => (
        <div>
            <div className="app-table-container">
                <table className="app-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>
                                <TableColumnHeaderTooltip
                                    label="DPS"
                                    tooltip={COLUMN_TOOLTIPS.dps}
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && renderTableStatusRow(3, <Spinner className="mx-auto text-white" size="sm"/>)}
                        {!loading && error && renderTableStatusRow(3, (
                            <span className="text-[var(--color-fight-failure)]">{error}</span>
                        ))}
                        {!loading && !error && dpsRows.length === 0 && renderTableStatusRow(3, (
                            <span className="text-white">No records yet.</span>
                        ))}
                        {!loading && !error && dpsRows
                            .slice((page - 1) * entriesPerPage, page * entriesPerPage)
                            .map((row) => {
                                const percentile = dpsTotal <= 1
                                    ? 100
                                    : Math.round(((dpsTotal - row.rank) / (dpsTotal - 1)) * 100);
                                const dpsColor = getDpsPercentileColor(percentile);
                                const isHighlighted = highlightRank === row.rank;
                                const rowProps = encounterTableRowProps(navigate, row.encounterId, {
                                    encounterType: row.encounterType,
                                    fightKey: selectedFight,
                                });

                                return (
                                    <tr
                                        key={`${row.player}-${row.rank}`}
                                        ref={isHighlighted ? highlightedRowRef : undefined}
                                        className={cn(
                                            rowProps.className,
                                            isHighlighted && 'highlighted-leaderboard-row',
                                        )}
                                        onClick={rowProps.onClick}
                                    >
                                        <td style={{color: dpsColor, fontWeight: 'bold'}}>
                                            <RouterLink
                                                to={getEncounterHref(row.encounterId, {
                                                    encounterType: row.encounterType,
                                                    fightKey: selectedFight,
                                                })}
                                                onClick={stopRowClick}
                                                className="table-link-inherit"
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    {row.rank}
                                                    {row.rank === 1 && <CrownIcon/>}
                                                    {row.rank === 2 && <MedalIcon color={colors.medal.silver}/>}
                                                    {row.rank === 3 && <MedalIcon color={colors.medal.bronze}/>}
                                                </span>
                                            </RouterLink>
                                        </td>
                                        <td>
                                            <RouterLink
                                                to={`/player/${row.player}`}
                                                className="link"
                                                onClick={stopRowClick}
                                            >
                                                {row.player}
                                            </RouterLink>
                                        </td>
                                        <td style={{color: dpsColor, fontWeight: 'bold'}}>{row.dps}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
            {!loading && dpsRows.length > 0 && (
                <TablePagination
                    count={Math.ceil(dpsRows.length / entriesPerPage)}
                    page={page}
                    onPageChange={setPage}
                />
            )}
        </div>
    );

    return (
        <div className="m-0">
            <FilterToolbar
                leadingFilters={(
                    <>
                        <FilterSelect
                            field="content"
                            value={content.value}
                            options={LEADERBOARD_CONTENT_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                            }))}
                            className="min-w-[120px] sm:min-w-[160px]"
                            onChange={(nextContentValue) => {
                                const selectedContent = LEADERBOARD_CONTENT_OPTIONS.find(
                                    (option) => option.value === nextContentValue,
                                )!;
                                const newDefault = selectedContent.defaultPlayerCount;
                                const fights = dpsConfig.find(
                                    (group) => group.contentName === selectedContent.value,
                                )?.fights ?? [];
                                const nextFight = isMokhaiotlLeaderboardContent(selectedContent.value) && fights.includes(MOKHAIOTL_DELVE_1_8_KEY)
                                    ? MOKHAIOTL_DELVE_1_8_KEY
                                    : fights.includes('Overall')
                                        ? 'Overall'
                                        : (fights[0] ?? 'Overall');
                                const nextMode = getLeaderboardModesForContent(selectedContent.value).includes(mode)
                                    ? mode
                                    : 'time';
                                setLeaderboardSearchParams({
                                    mode: nextMode,
                                    leaderboard: selectedContent.value,
                                    playerCount: newDefault,
                                    fight: nextMode === 'dps' ? nextFight : undefined,
                                });
                            }}
                        />

                        <FilterSelect
                            field="team"
                            value={playerCount}
                            compact
                            className={filterFieldCompactClass}
                            options={buildLeaderboardPlayerCountOptions(content.playerCounts)}
                            onChange={(count) => {
                                updateSearchParams({playerCount: count.toString()});
                            }}
                        />
                    </>
                )}
                modeSelector={(
                    <DurationDpsModeSelector
                        value={mode}
                        contentName={content.value}
                        onChange={(nextMode) => {
                            const fights = dpsConfig.find(
                                (group) => group.contentName === content.value,
                            )?.fights ?? [];
                            const nextFight = isMokhaiotlLeaderboardContent(content.value) && fights.includes(MOKHAIOTL_DELVE_1_8_KEY)
                                ? MOKHAIOTL_DELVE_1_8_KEY
                                : selectedFight;
                            setLeaderboardSearchParams({
                                mode: nextMode,
                                leaderboard: content.value,
                                playerCount,
                                fight: nextMode === 'dps' ? nextFight : undefined,
                            });
                        }}
                    />
                )}
                trailingFilters={mode === 'dps' && availableFights.length > 0 ? (
                    <FilterSelect
                        field="fight"
                        value={selectedFight}
                        options={availableFights.map((fight) => ({
                            value: fight,
                            label: fight,
                        }))}
                        className="min-w-[100px] sm:min-w-[120px]"
                        onChange={(fight) => {
                            updateSearchParams({fight});
                        }}
                    />
                ) : undefined}
            />

            {mode === 'dps' ? renderDpsTable() : renderDurationTable()}
        </div>
    );
};

export default Leaderboard;
