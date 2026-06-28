import React, {useCallback, useEffect, useState} from 'react';
import AppTooltip from './AppTooltip';
import {format} from 'date-fns';
import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom';
import {encounterTableRowProps, getEncounterHref, stopRowClick} from '../utils/encounterTableRow';
import {
    BROWSE_ANY_PLAYER_COUNT,
    BrowsePlayerCount,
    buildBrowsePlayerCountOptions,
    buildRecentEncountersHref,
    browsePlayerCountToApiParam,
    isRecentEncountersAllContent,
    RECENT_ENCOUNTERS_CONTENT_OPTIONS,
    RecentEncountersContentOption,
    resolveBrowsePlayerCount,
    resolveRecentEncountersContent,
} from '../utils/leaderboardContent';
import {colors} from '../theme';
import {ticksToTime} from '../utils/utils';
import FilterSelect from './filters/FilterSelect';
import FilterToolbar from './filters/FilterToolbar';
import {filterFieldCompactClass} from './filters/filterStyles';
import {Spinner} from '@/components/ui/spinner';
import {cn} from '@/lib/utils';
import {ChevronLeft, ChevronRight} from 'lucide-react';

type Encounter = {
    type: 'fight' | 'fightGroup';
    id: string;
    name: string;
    mainEnemyName?: string;
    leaderboardName?: string;
    startTime: string;
    officialDurationTicks: number | null;
    inProgress?: boolean;
    success: boolean;
    logId: string;
    uploadedAt: string;
    players: string[];
};

interface OverallRecentEncountersProps {
    embedded?: boolean;
    entriesPerPage?: number;
}

function toSearchParams(
    content: RecentEncountersContentOption,
    playerCount: BrowsePlayerCount,
    page: number,
): Record<string, string> {
    return Object.fromEntries(
        new URLSearchParams(
            buildRecentEncountersHref({
                content: content.value,
                playerCount: isRecentEncountersAllContent(content.value)
                    ? undefined
                    : browsePlayerCountToApiParam(playerCount),
                page,
            }).split('?')[1] ?? '',
        ),
    );
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

const OverallRecentEncounters: React.FC<OverallRecentEncountersProps> = ({
    embedded = false,
    entriesPerPage = 50,
}) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const contentParam = embedded ? null : searchParams.get('content');
    const playerCountParam = embedded ? null : searchParams.get('playerCount');
    const pageParam = embedded ? 1 : parseInt(searchParams.get('page') || '', 10);

    const initialContent = resolveRecentEncountersContent(contentParam);
    const initialPlayerCount = resolveBrowsePlayerCount(initialContent, playerCountParam);
    const initialPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const [content, setContent] = useState(initialContent);
    const [playerCount, setPlayerCount] = useState(initialPlayerCount);
    const [page, setPage] = useState(initialPage);
    const [encounters, setEncounters] = useState<Encounter[] | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAllContent = isRecentEncountersAllContent(content.value);

    useEffect(() => {
        if (embedded) {
            return;
        }

        const newContent = resolveRecentEncountersContent(searchParams.get('content'));
        const newPlayerCount = resolveBrowsePlayerCount(
            newContent,
            searchParams.get('playerCount'),
        );
        const newPageParam = parseInt(searchParams.get('page') || '', 10);
        const newPage = Number.isFinite(newPageParam) && newPageParam > 0 ? newPageParam : 1;

        setContent(newContent);
        setPlayerCount(newPlayerCount);
        setPage(newPage);
    }, [embedded, searchParams]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: String(embedded ? 10 : entriesPerPage),
                page: String(page),
            });

            if (!embedded && !isRecentEncountersAllContent(content.value)) {
                params.set('content', content.value);
                const apiPlayerCount = browsePlayerCountToApiParam(playerCount);
                if (apiPlayerCount != null) {
                    params.set('playerCount', String(apiPlayerCount));
                }
            }

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/recent-encounters?${params.toString()}`,
            );
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const json = await res.json();
            setEncounters(json.recentEncounters);
            setTotal(json.total ?? json.recentEncounters.length);
        } catch (e: any) {
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [content.value, embedded, entriesPerPage, isAllContent, page, playerCount]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateSearchParams = (updates: {
        content?: RecentEncountersContentOption;
        playerCount?: BrowsePlayerCount;
        page?: number;
    }) => {
        const nextContent = updates.content ?? content;
        const nextPlayerCount = updates.playerCount ?? playerCount;
        const nextPage = updates.page ?? page;
        setSearchParams(toSearchParams(nextContent, nextPlayerCount, nextPage));
    };

    const rows = encounters ?? [];
    const pageCount = Math.max(1, Math.ceil(total / entriesPerPage));

    const renderTableStatusRow = (contentNode: React.ReactNode) => (
        <tr>
            <td colSpan={4} className="app-table-status-cell">
                {contentNode}
            </td>
        </tr>
    );

    return (
        <div className="m-0">
            {!embedded && (
                <FilterToolbar>
                    <FilterSelect
                        field="content"
                        value={content.value}
                        options={RECENT_ENCOUNTERS_CONTENT_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                        }))}
                        className="min-w-[100px] sm:min-w-[140px]"
                        onChange={(nextContentValue) => {
                            const selectedContent = RECENT_ENCOUNTERS_CONTENT_OPTIONS.find(
                                (option) => option.value === nextContentValue,
                            )!;
                            const newPlayerCount = BROWSE_ANY_PLAYER_COUNT;
                            setContent(selectedContent);
                            setPlayerCount(newPlayerCount);
                            setPage(1);
                            updateSearchParams({
                                content: selectedContent,
                                playerCount: newPlayerCount,
                                page: 1,
                            });
                        }}
                    />

                    {!isAllContent && content.defaultPlayerCount != null && (
                        <FilterSelect<BrowsePlayerCount>
                            field="team"
                            value={playerCount}
                            compact
                            className={filterFieldCompactClass}
                            options={buildBrowsePlayerCountOptions(content.playerCounts)}
                            onChange={(count) => {
                                setPlayerCount(count);
                                setPage(1);
                                updateSearchParams({playerCount: count, page: 1});
                            }}
                        />
                    )}
                </FilterToolbar>
            )}

            <div>
                <div className="app-table-container">
                    <table className="app-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Duration</th>
                                <th>Players</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && renderTableStatusRow(
                                <Spinner className="mx-auto text-white" size="sm"/>,
                            )}
                            {!loading && error && renderTableStatusRow(
                                <span className="text-[var(--color-fight-failure)]">{error}</span>,
                            )}
                            {!loading && !error && rows.length === 0 && renderTableStatusRow(
                                <span className="text-white">No recent encounters found.</span>,
                            )}
                            {!loading && !error && rows.map((row) => {
                                const encounterOptions = row.type === 'fightGroup'
                                    ? {durationResultType: 'fightGroup' as const}
                                    : undefined;

                                return (
                                    <tr
                                        key={row.id}
                                        {...encounterTableRowProps(navigate, row.id, encounterOptions)}
                                    >
                                        <td>
                                            <RouterLink
                                                to={getEncounterHref(row.id, encounterOptions)}
                                                className="link"
                                                title={row.id}
                                                onClick={stopRowClick}
                                            >
                                                {row.type === 'fight' ? row.mainEnemyName : row.leaderboardName}
                                            </RouterLink>
                                        </td>
                                        <td
                                            style={{
                                                color: row.inProgress
                                                    ? undefined
                                                    : row.success
                                                        ? colors.fight.success
                                                        : colors.fight.failure,
                                            }}
                                        >
                                            {row.inProgress
                                                ? 'In Progress'
                                                : row.officialDurationTicks != null
                                                    ? ticksToTime(row.officialDurationTicks)
                                                    : '-'}
                                        </td>
                                        <td>
                                            {row.players.map((p, i) => (
                                                <React.Fragment key={p}>
                                                    <RouterLink
                                                        to={`/player/${p}`}
                                                        className="link"
                                                        onClick={stopRowClick}
                                                    >
                                                        {p}
                                                    </RouterLink>
                                                    {i < row.players.length - 1 ? ', ' : ''}
                                                </React.Fragment>
                                            ))}
                                        </td>
                                        <td>
                                            <AppTooltip
                                                title={format(new Date(row.startTime), 'MMM d, yyyy, h:mm a')}
                                                side="top"
                                                disableTouch
                                            >
                                                <span>{getRelativeTime(new Date(row.startTime))}</span>
                                            </AppTooltip>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {!embedded && !loading && pageCount > 1 && (
                    <TablePagination
                        count={pageCount}
                        page={page}
                        onPageChange={(value) => {
                            setPage(value);
                            updateSearchParams({page: value});
                        }}
                    />
                )}
            </div>
        </div>
    );
};

const getRelativeTime = (toDate: Date): string => {
    const now = new Date();
    const diff = toDate.getTime() - now.getTime();

    const divisions: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
        {amount: 60, name: 'seconds'},
        {amount: 60, name: 'minutes'},
        {amount: 24, name: 'hours'},
        {amount: 7, name: 'days'},
        {amount: 4.34524, name: 'weeks'},
        {amount: 12, name: 'months'},
        {amount: Number.POSITIVE_INFINITY, name: 'years'},
    ];

    let duration = Math.abs(diff / 1000);
    let i = 0;

    while (i < divisions.length && duration >= divisions[i].amount) {
        duration /= divisions[i].amount;
        i++;
    }

    const rtf = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});
    return rtf.format(
        Math.round(diff / 1000 / (divisions.slice(0, i).reduce((acc, d) => acc * d.amount, 1) || 1)),
        divisions[i].name,
    );
};

export default OverallRecentEncounters;
