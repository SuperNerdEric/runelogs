import React, {useCallback, useEffect, useState} from 'react';
import {
    Box,
    CircularProgress,
    Link,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
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
import {filterFieldCompactSx} from './filters/filterStyles';

type Encounter = {
    type: 'fight' | 'fightGroup';
    id: string;
    name: string;
    mainEnemyName?: string;
    leaderboardName?: string;
    startTime: string;
    officialDurationTicks: number;
    success: boolean;
    logId: string;
    uploadedAt: string;
    players: string[];
};

interface OverallRecentEncountersProps {
    /** Homepage embed: no filters, fetches the latest encounters across all content. */
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

const paginationSx = {
    '& .MuiPaginationItem-root': {color: 'white'},
    '& .MuiPaginationItem-root.Mui-selected': {
        backgroundColor: 'white',
        color: 'black',
        borderRadius: '4px',
    },
} as const;

const tableStatusCellSx = {
    py: 4,
    color: 'white',
    borderBottom: 'none',
} as const;

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

    const renderTableStatusRow = (content: React.ReactNode) => (
        <TableRow>
            <TableCell colSpan={4} align="center" sx={tableStatusCellSx}>
                {content}
            </TableCell>
        </TableRow>
    );

    return (
        <Box m={0}>
            {!embedded && (
                <FilterToolbar>
                    <FilterSelect
                        field="content"
                        value={content.value}
                        options={RECENT_ENCOUNTERS_CONTENT_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                        }))}
                        sx={{minWidth: {xs: 100, sm: 140}}}
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
                            sx={filterFieldCompactSx}
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

            <Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{color: 'white'}}>Name</TableCell>
                                <TableCell sx={{color: 'white'}}>Duration</TableCell>
                                <TableCell sx={{color: 'white'}}>Players</TableCell>
                                <TableCell sx={{color: 'white'}}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && renderTableStatusRow(
                                <CircularProgress color="inherit" size={28}/>,
                            )}
                            {!loading && error && renderTableStatusRow(
                                <Typography color="error">{error}</Typography>,
                            )}
                            {!loading && !error && rows.length === 0 && renderTableStatusRow(
                                <Typography color="white">No recent encounters found.</Typography>,
                            )}
                            {!loading && !error && rows.map((row) => {
                                const encounterOptions = row.type === 'fightGroup'
                                    ? {durationResultType: 'fightGroup' as const}
                                    : undefined;

                                return (
                                    <TableRow
                                        key={row.id}
                                        {...encounterTableRowProps(navigate, row.id, encounterOptions)}
                                    >
                                        <TableCell sx={{color: 'white'}}>
                                            <Link
                                                component={RouterLink}
                                                to={getEncounterHref(row.id, encounterOptions)}
                                                underline="hover"
                                                title={row.id}
                                                onClick={stopRowClick}
                                            >
                                                {row.type === 'fight' ? row.mainEnemyName : row.leaderboardName}
                                            </Link>
                                        </TableCell>
                                        <TableCell sx={{
                                            color: row.success
                                                ? colors.fight.success
                                                : colors.fight.failure,
                                        }}>
                                            {ticksToTime(row.officialDurationTicks)}
                                        </TableCell>
                                        <TableCell sx={{color: 'white'}}>
                                            {row.players.map((p, i) => (
                                                <React.Fragment key={p}>
                                                    <Link
                                                        component={RouterLink}
                                                        to={`/player/${p}`}
                                                        underline="hover"
                                                        onClick={stopRowClick}
                                                    >
                                                        {p}
                                                    </Link>
                                                    {i < row.players.length - 1 ? ', ' : ''}
                                                </React.Fragment>
                                            ))}
                                        </TableCell>
                                        <TableCell sx={{color: 'white'}}>
                                            {getRelativeTime(new Date(row.startTime))}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {!embedded && !loading && pageCount > 1 && (
                    <Box display="flex" justifyContent="center" pt={0} pb={1}>
                        <Pagination
                            count={pageCount}
                            page={page}
                            onChange={(_, value) => {
                                setPage(value);
                                updateSearchParams({page: value});
                            }}
                            sx={paginationSx}
                        />
                    </Box>
                )}
            </Box>
        </Box>
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
