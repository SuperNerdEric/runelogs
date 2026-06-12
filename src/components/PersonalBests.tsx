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
    useMediaQuery
} from '@mui/material';
import {Link as RouterLink, useParams} from 'react-router-dom';
import theme from "../theme";
import {colors} from "../theme";
import {getRankColor, ticksToTime} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import MedalIcon from "./MedalIcon";

type ContentOption = {
    label: string;
    value: string;
    playerCounts: number[];
};

const contentOptions: ContentOption[] = [
    {label: 'Theatre of Blood', value: 'Theatre of Blood', playerCounts: [1, 2, 3, 4, 5]},
    {label: 'Theatre of Blood: Hard Mode', value: 'Theatre of Blood: Hard Mode', playerCounts: [1, 2, 3, 4, 5]},
    {label: 'Tombs of Amascut', value: 'Tombs of Amascut', playerCounts: [1, 2, 3, 4, 5, 6, 7, 8]},
    {
        label: 'Tombs of Amascut: Expert Mode',
        value: 'Tombs of Amascut: Expert Mode',
        playerCounts: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    {label: 'Fight Caves', value: 'Fight Caves', playerCounts: [1]},
    {label: 'The Inferno', value: 'The Inferno', playerCounts: [1]},
    {label: 'Fortis Colosseum', value: 'Fortis Colosseum', playerCounts: [1]},
];

interface FightGroup {
    id: string;
    name: string;
    leaderboardName: string;
    officialDurationTicks: number;
    playerCount: number;
    rank?: number;
}

interface PersonalBestsResponse {
    player: string;
    personalBests: {
        fights: unknown[];
        fightGroups: FightGroup[];
    };
}

const PersonalBests: React.FC = () => {
    const {playerName} = useParams<{ playerName: string }>();
    const [data, setData] = useState<PersonalBestsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/player/${playerName}/personal-bests`);
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

    const fightGroups = data?.personalBests.fightGroups || [];

    if (fightGroups.length === 0) {
        return (
            <Box mt={4}>
                <Box pt={0} pb={2}>
                    <Typography variant="h4" gutterBottom color="white">
                        Personal Bests
                    </Typography>
                </Box>
                <Typography variant="body1" color="white">
                    No personal bests found.
                </Typography>
            </Box>
        );
    }

    return (
        <Box mt={4}>
            <Box pt={0} pb={2}>
                <Typography variant="h4" gutterBottom color="white">
                    Personal Bests
                </Typography>
            </Box>

            {contentOptions.map((content) => {
                const relevantFights = fightGroups
                    .filter(f => f.leaderboardName === content.value)
                    .sort((a, b) => a.playerCount - b.playerCount);

                if (relevantFights.length === 0) return null;

                return (
                    <Box key={content.value} mb={3}>
                        <Typography variant="h6" gutterBottom color="white">
                            {content.label}
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{color: 'white'}}>Players</TableCell>
                                        <TableCell sx={{color: 'white'}}>Duration</TableCell>
                                        <TableCell sx={{color: 'white'}}>Rank</TableCell>
                                        <TableCell sx={{color: 'white'}}>Id</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {content.playerCounts.map((count) => {
                                        const match = relevantFights.find(f => f.playerCount === count);

                                        return (
                                            <TableRow key={count}>
                                                <TableCell sx={{color: 'white'}}>{count}</TableCell>
                                                <TableCell sx={{color: 'white'}}>
                                                    {match ? ticksToTime(match.officialDurationTicks) : '-'}
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}}>
                                                    {match?.rank ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography
                                                                sx={{
                                                                    color: getRankColor(match.rank),
                                                                    fontWeight: 'bold',
                                                                }}
                                                            >
                                                                {match.rank}
                                                            </Typography>
                                                            {match.rank === 1 && <CrownIcon />}
                                                            {match.rank === 2 && <MedalIcon color={colors.medal.silver} />}
                                                            {match.rank === 3 && <MedalIcon color={colors.medal.bronze} />}
                                                        </Box>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}}>
                                                    {match ? (
                                                        <Link
                                                            component={RouterLink}
                                                            to={`/encounter/${match.id}`}
                                                            underline="hover"
                                                        >
                                                            {isMobile ? `${match.id.slice(0, 8)}...` : match.id}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
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
