import React, {useCallback, useEffect, useState} from 'react';
import {
    Box,
    CircularProgress,
    Link,
    MenuItem,
    Pagination,
    Select,
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
    buildRecentEncountersHref,
    isRecentEncountersAllContent,
    RECENT_ENCOUNTERS_CONTENT_OPTIONS,
    RecentEncountersContentOption,
    resolveRecentEncountersContent,
} from '../utils/leaderboardContent';
import {ticksToTime} from '../utils/utils';

type Encounter = {
    type: 'fight' | 'fightGroup';
    id: string;
    name: string;
    mainEnemyName?: string;
    leaderboardName?: string;
    startTime: string;
    officialDurationTicks: number;
    logId: string;
    uploadedAt: string;
    players: string[];
};

interface OverallRecentEncountersProps {
    /** Homepage embed: no filters, fetches the latest encounters across all content. */
    embedded?: boolean;
    entriesPerPage?: number;
}

function resolvePlayerCount(
    content: RecentEncountersContentOption,
    playerCountParam: number,
): number {
    if (isRecentEncountersAllContent(content.value) || content.defaultPlayerCount == null) {
        return content.defaultPlayerCount ?? 1;
    }
    return content.playerCounts.includes(playerCountParam)
        ? playerCountParam
        : content.defaultPlayerCount;
}

function toSearchParams(
    content: RecentEncountersContentOption,
    playerCount: number,
    page: number,
): Record<string, string> {
    return Object.fromEntries(
        new URLSearchParams(
            buildRecentEncountersHref({
                content: content.value,
                playerCount: isRecentEncountersAllContent(content.value)
                    ? undefined
                    : playerCount,
                page,
            }).split('?')[1] ?? '',
        ),
    );
}

const OverallRecentEncounters: React.FC<OverallRecentEncountersProps> = ({
    embedded = false,
    entriesPerPage = 50,
}) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const contentParam = embedded ? null : searchParams.get('content');
    const playerCountParam = embedded ? NaN : parseInt(searchParams.get('playerCount') || '', 10);
    const pageParam = embedded ? 1 : parseInt(searchParams.get('page') || '', 10);

    const initialContent = resolveRecentEncountersContent(contentParam);
    const initialPlayerCount = resolvePlayerCount(initialContent, playerCountParam);
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
        const newPlayerCount = resolvePlayerCount(
            newContent,
            parseInt(searchParams.get('playerCount') || '', 10),
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
                params.set('playerCount', String(playerCount));
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
        playerCount?: number;
        page?: number;
    }) => {
        const nextContent = updates.content ?? content;
        const nextPlayerCount = updates.playerCount ?? playerCount;
        const nextPage = updates.page ?? page;
        setSearchParams(toSearchParams(nextContent, nextPlayerCount, nextPage));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress color="inherit"/>
            </Box>
        );
    }

    if (error) {
        return (
            <Box m={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    const pageCount = Math.max(1, Math.ceil(total / entriesPerPage));

    return (
        <Box m={0}>
            {!embedded && (
                <Box display="flex" pt={0} pb={2} gap={1} flexWrap="wrap" alignItems="center">
                    <Select
                        value={content.value}
                        onChange={(e) => {
                            const selectedContent = RECENT_ENCOUNTERS_CONTENT_OPTIONS.find(
                                (o) => o.value === e.target.value,
                            )!;
                            const newPlayerCount = selectedContent.defaultPlayerCount ?? 1;
                            setContent(selectedContent);
                            setPlayerCount(newPlayerCount);
                            setPage(1);
                            updateSearchParams({
                                content: selectedContent,
                                playerCount: newPlayerCount,
                                page: 1,
                            });
                        }}
                        size="small"
                    >
                        {RECENT_ENCOUNTERS_CONTENT_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                                {o.label}
                            </MenuItem>
                        ))}
                    </Select>

                    {!isAllContent && content.defaultPlayerCount != null && (
                        <Select
                            value={playerCount}
                            onChange={(e) => {
                                const count = Number(e.target.value);
                                setPlayerCount(count);
                                setPage(1);
                                updateSearchParams({playerCount: count, page: 1});
                            }}
                            size="small"
                        >
                            {content.playerCounts.map((pc) => (
                                <MenuItem key={pc} value={pc}>
                                    {pc}
                                </MenuItem>
                            ))}
                        </Select>
                    )}
                </Box>
            )}

            {encounters && encounters.length > 0 ? (
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
                                {encounters.map((row) => {
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
                                            <TableCell sx={{color: 'white'}}>
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
                    {!embedded && pageCount > 1 && (
                        <Box display="flex" justifyContent="center" pt={0} pb={1}>
                            <Pagination
                                count={pageCount}
                                page={page}
                                onChange={(_, value) => {
                                    setPage(value);
                                    updateSearchParams({page: value});
                                }}
                                sx={{
                                    '& .MuiPaginationItem-root': {color: 'white'},
                                    '& .MuiPaginationItem-root.Mui-selected': {
                                        backgroundColor: 'white',
                                        color: 'black',
                                        borderRadius: '4px',
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Box>
            ) : (
                <Typography py={2} color="white">No recent encounters found.</Typography>
            )}
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
