import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom';
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
import {colors} from "../theme";
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
import {getDpsPercentileColor} from "../utils/TickActivity";
import {COLUMN_TOOLTIPS} from '../utils/columnTooltips';
import TableColumnHeaderTooltip from './TableColumnHeaderTooltip';
import {getPercentileAccentColor} from "../utils/percentile";
import {ticksToTime} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import DurationDpsModeSelector from './DurationDpsModeSelector';
import FilterSelect from './filters/FilterSelect';
import FilterToolbar from './filters/FilterToolbar';
import {filterFieldCompactSx} from './filters/filterStyles';
import MedalIcon from "./MedalIcon";

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

const highlightedRowSx = {
    bgcolor: colors.background.surfaceAlt,
    backgroundImage: `linear-gradient(90deg, rgba(56, 139, 253, 0.2) 0%, rgba(28, 33, 40, 0.95) 42%, ${colors.background.surfaceAlt} 100%)`,
    boxShadow: `inset 4px 0 0 ${colors.upload.dragActive}, 0 0 20px rgba(56, 139, 253, 0.12)`,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    '& td': {
        bgcolor: 'transparent',
        borderBottomColor: 'rgba(56, 139, 253, 0.22)',
    },
    '&:hover': {
        bgcolor: colors.background.surfaceSelected,
        backgroundImage: `linear-gradient(90deg, rgba(56, 139, 253, 0.28) 0%, rgba(48, 54, 61, 0.98) 42%, ${colors.background.surfaceSelected} 100%)`,
        boxShadow: `inset 4px 0 0 ${colors.upload.dragActive}, 0 0 24px rgba(56, 139, 253, 0.18)`,
    },
} as const;

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

interface LeaderboardProps {
    entriesPerPage?: number;
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

    const renderTableStatusRow = (colSpan: number, content: React.ReactNode) => (
        <TableRow>
            <TableCell colSpan={colSpan} align="center" sx={tableStatusCellSx}>
                {content}
            </TableCell>
        </TableRow>
    );

    const isHighScoreMode = mode === LEADERBOARD_MODE_HIGH_SCORE;
    const highScoreLevelColumn = getHighScoreLevelColumnLabel(content.value);

    const renderDurationTable = () => (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{color: 'white'}}>Rank</TableCell>
                            {isHighScoreMode && (
                                <TableCell sx={{color: 'white'}}>{highScoreLevelColumn}</TableCell>
                            )}
                            <TableCell sx={{color: 'white'}}>
                                {isHighScoreMode ? 'Time' : 'Duration'}
                            </TableCell>
                            <TableCell sx={{color: 'white'}}>Players</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && renderTableStatusRow(isHighScoreMode ? 4 : 3, <CircularProgress color="inherit" size={28}/>)}
                        {!loading && error && renderTableStatusRow(isHighScoreMode ? 4 : 3, (
                            <Typography color="error">{error}</Typography>
                        ))}
                        {!loading && !error && durationRows.length === 0 && renderTableStatusRow(isHighScoreMode ? 4 : 3, (
                            <Typography color="white">No records yet.</Typography>
                        ))}
                        {!loading && !error && durationRows
                            .slice((page - 1) * entriesPerPage, page * entriesPerPage)
                            .map((row, idx) => {
                                const actualRank = (page - 1) * entriesPerPage + idx + 1;
                                const isHighlighted = highlightRank === actualRank;
                                const rankColor = getPercentileAccentColor(row.percentile);
                                return (
                                    <TableRow
                                        key={row.id}
                                        ref={isHighlighted ? highlightedRowRef : undefined}
                                        {...encounterTableRowProps(navigate, row.id, {
                                            durationResultType,
                                        })}
                                        sx={{
                                            cursor: 'pointer',
                                            ...(isHighlighted ? highlightedRowSx : {}),
                                        }}
                                    >
                                        <TableCell sx={{color: rankColor, fontWeight: 'bold'}}>
                                            <Link
                                                component={RouterLink}
                                                to={getEncounterHref(row.id, {durationResultType})}
                                                onClick={stopRowClick}
                                                sx={{textDecoration: 'none', color: 'inherit', '&:hover': {textDecoration: 'underline'}}}
                                            >
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                    {actualRank}
                                                    {actualRank === 1 && <CrownIcon />}
                                                    {actualRank === 2 && <MedalIcon color={colors.medal.silver} />}
                                                    {actualRank === 3 && <MedalIcon color={colors.medal.bronze} />}
                                                </Box>
                                            </Link>
                                        </TableCell>
                                        {isHighScoreMode && (
                                            <TableCell sx={{color: 'white'}}>{row.highScoreLevel ?? '—'}</TableCell>
                                        )}
                                        <TableCell sx={{color: 'white'}}>{ticksToTime(row.duration)}</TableCell>
                                        <TableCell sx={{color: 'white'}}>
                                            {row.players.map((player, i) => (
                                                <React.Fragment key={player}>
                                                    <Link component={RouterLink} to={`/player/${player}`}
                                                          underline="hover" onClick={stopRowClick}>
                                                        {player}
                                                    </Link>
                                                    {i < row.players.length - 1 ? ', ' : ''}
                                                </React.Fragment>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
            {!loading && durationRows.length > 0 && (
                <Box display="flex" justifyContent="center" pt={0} pb={1}>
                    <Pagination
                        count={Math.ceil(durationRows.length / entriesPerPage)}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        sx={paginationSx}
                    />
                </Box>
            )}
        </Box>
    );

    const renderDpsTable = () => (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{color: 'white'}}>Rank</TableCell>
                            <TableCell sx={{color: 'white'}}>Player</TableCell>
                            <TableCell sx={{color: 'white'}}>
                                <TableColumnHeaderTooltip
                                    label="DPS"
                                    tooltip={COLUMN_TOOLTIPS.dps}
                                />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && renderTableStatusRow(3, <CircularProgress color="inherit" size={28}/>)}
                        {!loading && error && renderTableStatusRow(3, (
                            <Typography color="error">{error}</Typography>
                        ))}
                        {!loading && !error && dpsRows.length === 0 && renderTableStatusRow(3, (
                            <Typography color="white">No records yet.</Typography>
                        ))}
                        {!loading && !error && dpsRows
                            .slice((page - 1) * entriesPerPage, page * entriesPerPage)
                            .map((row) => {
                                const percentile = dpsTotal <= 1
                                    ? 100
                                    : Math.round(((dpsTotal - row.rank) / (dpsTotal - 1)) * 100);
                                const dpsColor = getDpsPercentileColor(percentile);
                                const isHighlighted = highlightRank === row.rank;

                                return (
                                    <TableRow
                                        key={`${row.player}-${row.rank}`}
                                        ref={isHighlighted ? highlightedRowRef : undefined}
                                        {...encounterTableRowProps(navigate, row.encounterId, {
                                            encounterType: row.encounterType,
                                            fightKey: selectedFight,
                                        })}
                                        sx={{
                                            cursor: 'pointer',
                                            ...(isHighlighted ? highlightedRowSx : {}),
                                        }}
                                    >
                                        <TableCell sx={{color: dpsColor, fontWeight: 'bold'}}>
                                            <Link
                                                component={RouterLink}
                                                to={getEncounterHref(row.encounterId, {
                                                    encounterType: row.encounterType,
                                                    fightKey: selectedFight,
                                                })}
                                                onClick={stopRowClick}
                                                sx={{textDecoration: 'none', color: 'inherit', '&:hover': {textDecoration: 'underline'}}}
                                            >
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                    {row.rank}
                                                    {row.rank === 1 && <CrownIcon />}
                                                    {row.rank === 2 && <MedalIcon color={colors.medal.silver} />}
                                                    {row.rank === 3 && <MedalIcon color={colors.medal.bronze} />}
                                                </Box>
                                            </Link>
                                        </TableCell>
                                        <TableCell sx={{color: 'white'}}>
                                            <Link component={RouterLink} to={`/player/${row.player}`}
                                                  underline="hover" onClick={stopRowClick}>
                                                {row.player}
                                            </Link>
                                        </TableCell>
                                        <TableCell sx={{color: dpsColor, fontWeight: 'bold'}}>{row.dps}</TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
            {!loading && dpsRows.length > 0 && (
                <Box display="flex" justifyContent="center" pt={0} pb={1}>
                    <Pagination
                        count={Math.ceil(dpsRows.length / entriesPerPage)}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        sx={paginationSx}
                    />
                </Box>
            )}
        </Box>
    );

    const renderLeaderboardContent = () => (
        mode === 'dps' ? renderDpsTable() : renderDurationTable()
    );

    return (
        <Box m={0}>
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
                            sx={{minWidth: {xs: 120, sm: 160}}}
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
                            sx={filterFieldCompactSx}
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
                        sx={{minWidth: {xs: 100, sm: 120}}}
                        onChange={(fight) => {
                            updateSearchParams({fight});
                        }}
                    />
                ) : undefined}
            />

            {renderLeaderboardContent()}
        </Box>
    );
};

export default Leaderboard;
