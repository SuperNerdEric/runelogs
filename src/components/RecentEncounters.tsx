import React, {useEffect, useState} from 'react';
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
import HistoryIcon from '@mui/icons-material/History';
import {format} from 'date-fns';
import {colors, media} from "../theme";
import {encounterTableRowProps, stopRowClick} from '../utils/encounterTableRow';
import {ticksToTime} from '../utils/utils';

interface RecentEncounter {
    type: 'fight' | 'fightGroup';
    id: string;
    name: string;
    mainEnemyName?: string;
    startTime: string;
    leaderboardName?: string;
    success?: boolean;
    officialDurationTicks: number | null;
    uploadedAt: string;
    players?: string[];
}

interface RecentEncountersResponse {
    player: string;
    recentEncounters: RecentEncounter[];
}

const RecentEncounters: React.FC = () => {
    const navigate = useNavigate();
    const {playerName} = useParams<{ playerName: string }>();
    const [data, setData] = useState<RecentEncountersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/player/${playerName}/recent-encounters`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                setError(e.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [playerName]);

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

    const encounters = (data?.recentEncounters || []).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    if (encounters.length === 0) {
        return (
            <Box mt={4}>
                <Box pt={0} pb={2} display="flex" alignItems="center" gap={1}>
                    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                        <HistoryIcon sx={{color: colors.text.rune, fontSize: '2.125rem'}}/>
                    </Box>
                    <Typography variant="h4" color="white" sx={{m: 0, lineHeight: 1.2}}>
                        Recent Encounters
                    </Typography>
                </Box>
                <Typography color="white">No recent encounters found.</Typography>
            </Box>
        );
    }

    return (
        <Box mt={4}>
            <Box pt={0} pb={2} display="flex" alignItems="center" gap={1}>
                <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                    <HistoryIcon sx={{color: colors.text.rune, fontSize: '2.125rem'}}/>
                </Box>
                <Typography variant="h4" color="white" sx={{m: 0, lineHeight: 1.2}}>
                    Recent Encounters
                </Typography>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{color: 'white'}}>Name</TableCell>
                            <TableCell sx={{color: 'white', whiteSpace: 'nowrap'}}>Duration</TableCell>
                            <TableCell sx={{color: 'white'}}>Players</TableCell>
                            <TableCell sx={{color: 'white', whiteSpace: 'nowrap'}}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {encounters.map((enc) => (
                            <TableRow key={enc.id} {...encounterTableRowProps(navigate, enc.id)}>
                                <TableCell sx={{color: 'white'}}>
                                    <Link
                                        component={RouterLink}
                                        to={`/encounter/${enc.id}`}
                                        underline="hover"
                                        onClick={stopRowClick}
                                    >
                                        {enc.name}
                                    </Link>
                                </TableCell>
                                <TableCell sx={{color: 'white', whiteSpace: 'nowrap'}}>
                                    {enc.officialDurationTicks != null ? ticksToTime(enc.officialDurationTicks) : '-'}
                                </TableCell>
                                <TableCell sx={{color: 'white'}}>
                                    {enc.players?.length ? enc.players.map((p, i) => (
                                        <React.Fragment key={p}>
                                            <Link
                                                component={RouterLink}
                                                to={`/player/${p}`}
                                                underline="hover"
                                                onClick={stopRowClick}
                                                sx={p === playerName ? {color: colors.text.player} : undefined}
                                            >
                                                {p}
                                            </Link>
                                            {i < enc.players!.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    )) : '-'}
                                </TableCell>
                                <TableCell sx={{color: 'white', whiteSpace: 'nowrap'}}>
                                    <Box component="span" sx={{ [media.desktopUp]: { display: 'none' } }}>
                                        {format(new Date(enc.startTime), 'MMM d, yyyy')}
                                    </Box>
                                    <Box component="span" sx={{ display: 'none', [media.desktopUp]: { display: 'inline' } }}>
                                        {format(new Date(enc.startTime), 'PPp')}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default RecentEncounters;
