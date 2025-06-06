import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import PersonalBests from './PersonalBests';

const Player: React.FC = () => {
    const { playerName } = useParams<{ playerName: string }>();

    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h4" color="white" gutterBottom>
                {playerName}
            </Typography>
            {playerName && <PersonalBests />}
        </Box>
    );
};

export default Player;
