import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import PersonalBests from './PersonalBests';
import RecentEncounters from "./RecentEncounters";
import { contentColumnSx } from '../theme';
import { displayUsername } from '../utils/utils';

const Player: React.FC = () => {
    const { playerName } = useParams<{ playerName: string }>();

    return (
        <Box sx={{...contentColumnSx, mt: 1, px: 2, pb: 0, textAlign: 'left'}}>
            <Box pb={0} pt={0}>
                <Typography variant="h4" color="white" gutterBottom sx={{textTransform: 'capitalize'}}>
                    {displayUsername(playerName)}
                </Typography>
            </Box>
            {playerName && <RecentEncounters />}
            {playerName && <PersonalBests />}
        </Box>
    );
};

export default Player;
