import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    CircularProgress,
    Link,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
} from '@mui/material';

type ContentOption = {
    label: string;
    value: string;
    playerCounts: number[];
};

const contentOptions: ContentOption[] = [
    { label: 'Theatre of Blood', value: 'Theatre of Blood', playerCounts: [4] },
    { label: 'Tombs of Amascut', value: 'Tombs of Amascut', playerCounts: [4] },
];

type Order = 'asc' | 'desc';

interface Entry {
    id: string;
    duration: number;
    players: string[];
}

const Leaderboard: React.FC = () => {
    const [content, setContent] = useState(contentOptions[0]);
    const [playerCount, setPlayerCount] = useState(contentOptions[0].playerCounts[0]);
    const [entries, setEntries] = useState<Entry[] | null>(null);
    const [setLeaderType] = useState<'fight' | 'fightGroup'>('fight');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderBy] = useState<'duration'>('duration');
    const [order, setOrder] = useState<Order>('asc');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `https://api.runelogs.com/leaderboard?content=${encodeURIComponent(
                content.value,
            )}&playerCount=${playerCount}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setEntries(data.leaderboard);
            setLeaderType(data.type === 'fightGroup' ? 'fightGroup' : 'fight');
        } catch (e: any) {
            setError(e.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [content, playerCount]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sorted = useMemo(() => {
        if (!entries) return null;
        return [...entries].sort((a, b) =>
            order === 'asc' ? a.duration - b.duration : b.duration - a.duration,
        );
    }, [entries, order]);

    const ticksToTime = (ticks: number) => {
        const secs = ticks * 0.6;
        const m = Math.floor(secs / 60);
        const s = Math.round(secs % 60)
            .toString()
            .padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress color="inherit" />
            </Box>
        );

    if (error)
        return (
            <Box m={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );

    return (
        <Box m={2}>
            <Typography variant="h4" gutterBottom color="white">
                Leaderboard
            </Typography>

            <Box display="flex" gap={2} mb={2}>
                <Select
                    value={content.value}
                    onChange={(e) => setContent(contentOptions.find((o) => o.value === e.target.value)!)}
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
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
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
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: 'white' }}>Rank</TableCell>
                                <TableCell sx={{ color: 'white' }}>Id</TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                    <TableSortLabel
                                        active={orderBy === 'duration'}
                                        direction={order}
                                        onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                                        sx={{ color: 'white', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                                    >
                                        Duration
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>Players</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sorted!.map((row, idx) => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ color: 'white' }}>{idx + 1}</TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        <Link
                                            component={RouterLink}
                                            to={`/encounter/${row.id}`}
                                            underline="hover"
                                        >
                                            {row.id}
                                        </Link>
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>{ticksToTime(row.duration)}</TableCell>
                                    <TableCell sx={{ color: 'white' }}>{row.players.join(', ')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography color="white">No records yet.</Typography>
            )}
        </Box>
    );
};

export default Leaderboard;
