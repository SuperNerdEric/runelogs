import React, {useEffect, useMemo, useState} from 'react';
import {
    Box,
    CircularProgress,
    Link,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {Link as RouterLink, useNavigate, useParams} from 'react-router-dom';
import {format} from 'date-fns';
import {encounterTableRowProps, getEncounterHref, stopRowClick} from '../utils/encounterTableRow';
import {buildLeaderboardHref, LeaderboardMode, LEADERBOARD_CONTENT_OPTIONS} from '../utils/leaderboardContent';
import {media} from "../theme";
import {colors} from "../theme";
import {getDpsPercentileColor} from "../utils/TickActivity";
import {getPercentileAccentColor, rankToPercentile} from "../utils/percentile";
import {ticksToTime} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import MedalIcon from "./MedalIcon";
import TrophyIcon from "./TrophyIcon";
import DurationDpsModeSelector from './DurationDpsModeSelector';
import FilterSelect from './filters/FilterSelect';
import FilterToolbar from './filters/FilterToolbar';

const partySizeColumnSx = {
    color: 'white',
    whiteSpace: 'nowrap',
    [media.mobileDown]: {
        minWidth: 32,
    },
} as const;

interface DurationFightGroup {
    id: string;
    name: string;
    leaderboardName: string;
    officialDurationTicks: number;
    playerCount: number;
    rank?: number;
    percentile?: number;
    startTime?: string;
    players?: string[];
}

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
        fights: unknown[];
        fightGroups: DurationFightGroup[];
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress color="inherit"/>
            </Box>
        );
    }

    if (error) {
        return (
            <Box mt={4}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    const durationFightGroups = durationData?.personalBests.fightGroups ?? [];
    const dpsEntries = dpsData?.entries ?? [];
    const isBusy = mode === 'dps' && dpsLoading;
    const hasDuration = durationFightGroups.length > 0;
    const hasDps = dpsEntries.length > 0;

    const renderPlayers = (players: string[] | undefined, highlightPlayer?: string) => {
        if (!players?.length) {
            return '-';
        }
        return players.map((p, i) => (
            <React.Fragment key={p}>
                <Link
                    component={RouterLink}
                    to={`/player/${p}`}
                    underline="hover"
                    onClick={stopRowClick}
                    sx={p === highlightPlayer ? {color: colors.text.player} : undefined}
                >
                    {p}
                </Link>
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
                <Box component="span" sx={{[media.desktopUp]: {display: 'none'}}}>
                    {format(new Date(startTime), 'MMM d, yyyy')}
                </Box>
                <Box component="span" sx={{display: 'none', [media.desktopUp]: {display: 'inline'}}}>
                    {format(new Date(startTime), 'PPp')}
                </Box>
            </>
        );
    };

    const renderRank = (rank: number | undefined, color: string, href?: string) => {
        if (!rank) {
            return '-';
        }
        const content = (
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Typography component="span" sx={{color, fontWeight: 'bold'}}>
                    {rank}
                </Typography>
                {rank === 1 && <CrownIcon/>}
                {rank === 2 && <MedalIcon color={colors.medal.silver}/>}
                {rank === 3 && <MedalIcon color={colors.medal.bronze}/>}
            </Box>
        );
        if (!href) {
            return content;
        }
        return (
            <Link
                component={RouterLink}
                to={href}
                onClick={stopRowClick}
                sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': {textDecoration: 'underline'},
                }}
            >
                {content}
            </Link>
        );
    };

    return (
        <Box mt={4}>
            <Box pt={0} pb={1} display="flex" alignItems="center" gap={1}>
                <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                    <TrophyIcon size={34}/>
                </Box>
                <Typography variant="h4" color="white" sx={{m: 0, lineHeight: 1.2}}>
                    Personal Bests
                </Typography>
            </Box>

            <FilterToolbar modeSelector={<DurationDpsModeSelector value={mode} onChange={setMode} />}/>

            {isBusy && (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress color="inherit"/>
                </Box>
            )}

            {!isBusy && mode === 'time' && !hasDuration && (
                <Typography variant="body1" color="white">
                    No personal bests found.
                </Typography>
            )}

            {!isBusy && mode === 'dps' && !hasDps && (
                <Typography variant="body1" color="white">
                    No DPS personal bests found.
                </Typography>
            )}

            {!isBusy && mode === 'time' && LEADERBOARD_CONTENT_OPTIONS.map((content) => {
                const relevantFights = durationFightGroups
                    .filter((f) => f.leaderboardName === content.value)
                    .sort((a, b) => a.playerCount - b.playerCount);

                if (relevantFights.length === 0) {
                    return null;
                }

                return (
                    <Box key={content.value} mb={3}>
                        <Typography variant="h6" gutterBottom color="white">
                            {content.label}
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={partySizeColumnSx}>#</TableCell>
                                        <TableCell sx={{color: 'white'}}>Rank</TableCell>
                                        <TableCell sx={{color: 'white'}}>Duration</TableCell>
                                        <TableCell sx={{color: 'white'}}>Players</TableCell>
                                        <TableCell sx={{color: 'white', whiteSpace: 'nowrap', [media.mobileDown]: {display: 'none'}}}>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {content.playerCounts.map((count) => {
                                        const match = relevantFights.find((f) => f.playerCount === count);

                                        return (
                                            <TableRow key={count} {...encounterTableRowProps(navigate, match?.id, {durationResultType: 'fightGroup'})}>
                                                <TableCell sx={partySizeColumnSx}>
                                                    {match ? (
                                                        <Link
                                                            component={RouterLink}
                                                            to={getEncounterHref(match.id, {durationResultType: 'fightGroup'})}
                                                            underline="hover"
                                                            onClick={stopRowClick}
                                                        >
                                                            {count}
                                                        </Link>
                                                    ) : (
                                                        count
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}} onClick={stopRowClick}>
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
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}}>
                                                    {match ? ticksToTime(match.officialDurationTicks) : '-'}
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}}>
                                                    {renderPlayers(match?.players, playerName)}
                                                </TableCell>
                                                <TableCell sx={{color: 'white', whiteSpace: 'nowrap', [media.mobileDown]: {display: 'none'}}}>
                                                    {renderDate(match?.startTime)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
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
                    <Box key={content.value} mb={3}>
                        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" mb={1.5}>
                            <Typography variant="h6" color="white" sx={{m: 0}}>
                                {content.label}
                            </Typography>
                            {availableFights.length > 1 && (
                                <Box sx={{minWidth: {xs: '100%', sm: 220}, flex: {sm: '0 0 220px'}}}>
                                    <FilterSelect
                                        field="fight"
                                        value={selectedFight}
                                        options={availableFights.map((fight) => ({
                                            value: fight,
                                            label: fight,
                                        }))}
                                        sx={{minWidth: 120}}
                                        onChange={(fight) => {
                                            setSelectedFights((prev) => ({
                                                ...prev,
                                                [content.value]: fight,
                                            }));
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={partySizeColumnSx}>#</TableCell>
                                        <TableCell sx={{color: 'white'}}>Rank</TableCell>
                                        <TableCell sx={{color: 'white'}}>DPS</TableCell>
                                        <TableCell sx={{color: 'white', whiteSpace: 'nowrap', [media.mobileDown]: {display: 'none'}}}>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {content.playerCounts.map((count) => {
                                        const match = relevantEntries.find((entry) => entry.playerCount === count);
                                        const rankColor = match
                                            ? dpsRankColor(match.rank, match.leaderboardSize)
                                            : 'white';

                                        return (
                                            <TableRow
                                                key={count}
                                                {...encounterTableRowProps(navigate, match?.encounterId, {
                                                    encounterType: match?.encounterType,
                                                    fightKey: selectedFight,
                                                })}
                                            >
                                                <TableCell sx={partySizeColumnSx}>
                                                    {match ? (
                                                        <Link
                                                            component={RouterLink}
                                                            to={getEncounterHref(match.encounterId, {
                                                                encounterType: match.encounterType,
                                                                fightKey: selectedFight,
                                                            })}
                                                            underline="hover"
                                                            onClick={stopRowClick}
                                                        >
                                                            {count}
                                                        </Link>
                                                    ) : (
                                                        count
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}} onClick={stopRowClick}>
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
                                                </TableCell>
                                                <TableCell sx={{color: rankColor, fontWeight: 'bold'}}>
                                                    {match ? match.dps : '-'}
                                                </TableCell>
                                                <TableCell sx={{color: 'white', whiteSpace: 'nowrap', [media.mobileDown]: {display: 'none'}}}>
                                                    {renderDate(match?.startTime)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            })}
        </Box>
    );
};

export default PersonalBests;
