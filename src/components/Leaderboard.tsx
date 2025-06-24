import React, {useCallback, useEffect, useState} from 'react';

import {Link as RouterLink, useSearchParams} from 'react-router-dom';
import {
    Box,
    CircularProgress,
    Link,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
} from '@mui/material';
import theme from "../theme";
import {getRankColor, ticksToTime} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import MedalIcon from "./MedalIcon";

type ContentOption = {
    label: string;
    value: string;
    playerCounts: number[];
    defaultPlayerCount: number;
};

const contentOptions: ContentOption[] = [
    {label: 'Theatre of Blood', value: 'Theatre of Blood', playerCounts: [1, 2, 3, 4, 5], defaultPlayerCount: 4},
    {label: 'Theatre of Blood: Hard Mode', value: 'Theatre of Blood: Hard Mode', playerCounts: [1, 2, 3, 4, 5], defaultPlayerCount: 5},
    {label: 'Tombs of Amascut', value: 'Tombs of Amascut', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8], defaultPlayerCount: 1},
    {label: 'Tombs of Amascut: Expert Mode', value: 'Tombs of Amascut: Expert Mode', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8], defaultPlayerCount: 1},
    {label: 'Fight Caves', value: 'Fight Caves', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'The Inferno', value: 'The Inferno', playerCounts: [1], defaultPlayerCount: 1},
    {label: 'Fortis Colosseum', value: 'Fortis Colosseum', playerCounts: [1], defaultPlayerCount: 1},
];

type Order = 'asc' | 'desc';

interface Entry {
    id: string;
    duration: number;
    players: string[];
}

const Leaderboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const contentParam = searchParams.get('leaderboard');
    const playerCountParam = parseInt(searchParams.get('playerCount') || '', 10);

    const initialContent = contentOptions.find(o => o.value === contentParam) ?? contentOptions[5];
    const initialPlayerCount = initialContent.playerCounts.includes(playerCountParam)
        ? playerCountParam
        : initialContent.defaultPlayerCount;

    const [content, setContent] = useState(initialContent);
    const [playerCount, setPlayerCount] = useState(initialPlayerCount);

    const [entries, setEntries] = useState<Entry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderBy] = useState<'duration'>('duration');
    const [order, setOrder] = useState<Order>('asc');
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${import.meta.env.VITE_API_URL}/leaderboard?content=${encodeURIComponent(
                content.value,
            )}&playerCount=${playerCount}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setEntries(data.leaderboard);
        } catch (e: any) {
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [content, playerCount]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress color="inherit"/>
            </Box>
        );

    if (error)
        return (
            <Box m={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );

    return (
        <Box m={0}>
            <Box p={2} pb={0} pt={0}>
                <Typography variant="h4" gutterBottom color="white">
                    Leaderboard
                </Typography>
            </Box>

            <Box display="flex" p={2} pt={0}>
                <Select
                    value={content.value}
                    onChange={(e) => {
                        const selectedContent = contentOptions.find((o) => o.value === e.target.value)!;
                        setContent(selectedContent);

                        const newDefault = selectedContent.defaultPlayerCount;
                        setPlayerCount(newDefault);

                        setSearchParams({
                            leaderboard: selectedContent.value,
                            playerCount: newDefault.toString(),
                        });
                    }}
                    size="small"
                >
                    {contentOptions.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                            {o.label}
                        </MenuItem>
                    ))}
                </Select>

                <Select
                    value={playerCount}
                    onChange={(e) => {
                        const count = Number(e.target.value);
                        setPlayerCount(count);
                        setSearchParams({
                            leaderboard: content.value,
                            playerCount: count.toString(),
                        });
                    }}
                    size="small"
                >
                    {content.playerCounts.map((pc) => (
                        <MenuItem key={pc} value={pc}>
                            {pc}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {entries && entries.length > 0 ? (
                <Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{color: 'white'}}>Rank</TableCell>
                                    <TableCell sx={{color: 'white'}}>Id</TableCell>
                                    <TableCell sx={{color: 'white'}}>Duration</TableCell>
                                    <TableCell sx={{color: 'white'}}>Players</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entries!.map((row, idx) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell
                                            sx={{
                                                color: getRankColor(idx + 1),
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {idx + 1}
                                                {idx === 0 && <CrownIcon />}
                                                {idx === 1 && <MedalIcon color="#C0C0C0" />}
                                                {idx === 2 && <MedalIcon color="#CD7F32" />}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{color: 'white'}}>
                                            <Link
                                                component={RouterLink}
                                                to={`/encounter/${row.id}`}
                                                underline="hover"
                                                title={row.id}
                                            >
                                                {isMobile ? `${row.id.slice(0, 8)}...` : row.id}
                                            </Link>
                                        </TableCell>
                                        <TableCell sx={{color: 'white'}}>{ticksToTime(row.duration)}</TableCell>
                                        <TableCell sx={{color: 'white'}}>
                                            {row.players.map((player, i) => (
                                                <React.Fragment key={player}>
                                                    <Link component={RouterLink} to={`/player/${player}`}
                                                          underline="hover">
                                                        {player}
                                                    </Link>
                                                    {i < row.players.length - 1 ? ', ' : ''}
                                                </React.Fragment>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ) : (
                <Typography p={2} color="white">No records yet.</Typography>
            )}
        </Box>
    );
};

export default Leaderboard;
