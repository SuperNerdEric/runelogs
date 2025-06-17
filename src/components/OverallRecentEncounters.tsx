import React, { useEffect, useState } from 'react';
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
    useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import theme from '../theme';

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

const OverallRecentEncounters: React.FC = () => {
    const [encounters, setEncounters] = useState<Encounter[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/recent-encounters`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const json = await res.json();
                setEncounters(json.recentEncounters);
            } catch (e: any) {
                setError(e.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        <Box m={0}>
            <Box p={2} pt={0}>
                <Typography variant="h4" gutterBottom color="white">
                    Recent Encounters
                </Typography>
            </Box>

            {encounters && encounters.length > 0 ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: 'white' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white' }}>Duration</TableCell>
                                <TableCell sx={{ color: 'white' }}>Players</TableCell>
                                <TableCell sx={{ color: 'white' }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {encounters.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ color: 'white' }}>
                                        <Link
                                            component={RouterLink}
                                            to={`/encounter/${row.id}`}
                                            underline="hover"
                                            title={row.id}
                                        >
                                        {row.type === 'fight' ? row.mainEnemyName : row.leaderboardName}
                                        </Link>
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        {ticksToTime(row.officialDurationTicks)}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        {row.players.map((p, i) => (
                                            <React.Fragment key={p}>
                                                <Link component={RouterLink} to={`/player/${p}`} underline="hover">
                                                    {p}
                                                </Link>
                                                {i < row.players.length - 1 ? ', ' : ''}
                                            </React.Fragment>
                                        ))}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white' }}>
                                        {getRelativeTime(new Date(row.startTime.replace(/Z$/, '')))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography p={2} color="white">No recent encounters found.</Typography>
            )}
        </Box>
    );
};

const getRelativeTime = (toDate: Date): string => {
    const now = new Date();
    const diff = toDate.getTime() - now.getTime();

    const divisions: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
        { amount: 60, name: 'seconds' },
        { amount: 60, name: 'minutes' },
        { amount: 24, name: 'hours' },
        { amount: 7, name: 'days' },
        { amount: 4.34524, name: 'weeks' },
        { amount: 12, name: 'months' },
        { amount: Number.POSITIVE_INFINITY, name: 'years' },
    ];

    let duration = Math.abs(diff / 1000);
    let i = 0;

    while (i < divisions.length && duration >= divisions[i].amount) {
        duration /= divisions[i].amount;
        i++;
    }

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return rtf.format(Math.round(diff / 1000 / (divisions.slice(0, i).reduce((acc, d) => acc * d.amount, 1) || 1)), divisions[i].name);
};


export default OverallRecentEncounters;
