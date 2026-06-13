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
import {format} from 'date-fns';
import {encounterTableRowProps, stopRowClick} from '../utils/encounterTableRow';
import {media} from "../theme";
import {colors} from "../theme";
import {getRankColor, ticksToTime} from "../utils/utils";
import {CrownIcon} from "./CrownIcon";
import MedalIcon from "./MedalIcon";
import TrophyIcon from "./TrophyIcon";

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

const partySizeColumnSx = {
    color: 'white',
    whiteSpace: 'nowrap',
    [media.mobileDown]: {
        minWidth: 32,
    },
} as const;

interface FightGroup {
    id: string;
    name: string;
    leaderboardName: string;
    officialDurationTicks: number;
    playerCount: number;
    rank?: number;
    startTime?: string;
    players?: string[];
}

interface PersonalBestsResponse {
    player: string;
    personalBests: {
        fights: unknown[];
        fightGroups: FightGroup[];
    };
}

const PersonalBests: React.FC = () => {
    const navigate = useNavigate();
    const {playerName} = useParams<{ playerName: string }>();
    const [data, setData] = useState<PersonalBestsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                <Box pt={0} pb={2} display="flex" alignItems="center" gap={1}>
                    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                        <TrophyIcon size={34}/>
                    </Box>
                    <Typography variant="h4" color="white" sx={{m: 0, lineHeight: 1.2}}>
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
            <Box pt={0} pb={2} display="flex" alignItems="center" gap={1}>
                <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', lineHeight: 0}}>
                    <TrophyIcon size={34}/>
                </Box>
                <Typography variant="h4" color="white" sx={{m: 0, lineHeight: 1.2}}>
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
                                        <TableCell sx={partySizeColumnSx}>#</TableCell>
                                        <TableCell sx={{color: 'white'}}>Rank</TableCell>
                                        <TableCell sx={{color: 'white'}}>Duration</TableCell>
                                        <TableCell sx={{color: 'white'}}>Players</TableCell>
                                        <TableCell sx={{color: 'white', whiteSpace: 'nowrap', [media.mobileDown]: { display: 'none' }}}>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {content.playerCounts.map((count) => {
                                        const match = relevantFights.find(f => f.playerCount === count);

                                        return (
                                            <TableRow key={count} {...encounterTableRowProps(navigate, match?.id)}>
                                                <TableCell sx={partySizeColumnSx}>
                                                    {match ? (
                                                        <Link
                                                            component={RouterLink}
                                                            to={`/encounter/${match.id}`}
                                                            underline="hover"
                                                            onClick={stopRowClick}
                                                        >
                                                            {count}
                                                        </Link>
                                                    ) : (
                                                        count
                                                    )}
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
                                                    {match ? ticksToTime(match.officialDurationTicks) : '-'}
                                                </TableCell>
                                                <TableCell sx={{color: 'white'}}>
                                                    {match?.players?.length ? match.players.map((p, i) => (
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
                                                            {i < match.players!.length - 1 ? ', ' : ''}
                                                        </React.Fragment>
                                                    )) : '-'}
                                                </TableCell>
                                                <TableCell sx={{color: 'white', whiteSpace: 'nowrap', [media.mobileDown]: { display: 'none' }}}>
                                                    {match?.startTime ? (
                                                        <>
                                                            <Box component="span" sx={{ [media.desktopUp]: { display: 'none' } }}>
                                                                {format(new Date(match.startTime), 'MMM d, yyyy')}
                                                            </Box>
                                                            <Box component="span" sx={{ display: 'none', [media.desktopUp]: { display: 'inline' } }}>
                                                                {format(new Date(match.startTime), 'PPp')}
                                                            </Box>
                                                        </>
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
