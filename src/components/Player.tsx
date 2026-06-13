import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import PersonalBests from './PersonalBests';
import RecentEncounters from "./RecentEncounters";
import { contentColumnSx, colors } from '../theme';
import { displayUsername } from '../utils/utils';
import playerAvatar from '../assets/player-avatar.png';

const Player: React.FC = () => {
    const { playerName } = useParams<{ playerName: string }>();

    return (
        <Box sx={{...contentColumnSx, mt: 1, px: 2, pb: 0, textAlign: 'left'}}>
            <Box pb={0} pt={0} display="flex" alignItems="center" gap={1.5}>
                <Box
                    component="img"
                    src={playerAvatar}
                    alt={playerName ? `${displayUsername(playerName)} avatar` : 'Player avatar'}
                    sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        objectFit: 'cover',
                        borderRadius: '4px',
                    }}
                />
                <Typography variant="h4" gutterBottom sx={{textTransform: 'capitalize', color: colors.text.player, m: 0}}>
                    {displayUsername(playerName)}
                </Typography>
            </Box>
            {playerName && <RecentEncounters />}
            {playerName && <PersonalBests />}
        </Box>
    );
};

export default Player;
