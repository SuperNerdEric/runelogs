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
    Typography, useMediaQuery,
} from '@mui/material';
import {Link as RouterLink, useParams} from 'react-router-dom';
import theme from "../theme";

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
}

interface RecentEncountersResponse {
    player: string;
    recentEncounters: RecentEncounter[];
}

const RecentEncounters: React.FC = () => {
    const {playerName} = useParams<{ playerName: string }>();
    const [data, setData] = useState<RecentEncountersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
            <Box m={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    const encounters = (data?.recentEncounters || []).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    if (encounters.length === 0) {
        return (
            <Box m={2}>
                <Typography color="white">No recent encounters found.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{maxWidth: 1000, width: '100%', marginTop: 4}}>
            <Typography variant="h5" gutterBottom color="white">
                Recent Encounters
            </Typography>
            <Box m={2}>
                <TableContainer sx={{backgroundColor: '#141414', border: '1px solid grey', borderRadius: 1}}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{color: 'white'}}>Name</TableCell>
                                <TableCell sx={{color: 'white'}}>Id</TableCell>
                                <TableCell sx={{color: 'white'}}>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {encounters.map((enc) => (
                                <TableRow key={enc.id}>
                                    <TableCell sx={{color: 'white'}}>{enc.name}</TableCell>
                                    <TableCell sx={{color: 'white'}}>
                                        <Link component={RouterLink} to={`/encounter/${enc.id}`} underline="hover">
                                            {isMobile ? `${enc.id.slice(0, 8)}...` : enc.id}
                                        </Link>
                                    </TableCell>
                                    <TableCell sx={{color: 'white'}}>
                                        {new Date(enc.startTime.replace(/Z$/, '')).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default RecentEncounters;
