import React from 'react';
import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import {
    isLiveEmptyLogName,
    LIVE_LOG_WAITING_SUFFIX,
} from '../utils/logName';

interface LogNameDisplayProps {
    name: string | null | undefined;
    isLive: boolean;
    fallback?: string;
    sx?: SxProps<Theme>;
    waitingSuffixSx?: SxProps<Theme>;
}

const LogNameDisplay: React.FC<LogNameDisplayProps> = ({
    name,
    isLive,
    fallback = 'Unnamed',
    sx,
    waitingSuffixSx,
}) => {
    const displayName = name ?? fallback;
    const showWaitingSuffix = isLiveEmptyLogName(name, isLive);

    return (
        <Typography
            component="span"
            sx={{
                ...(sx
                    ? {}
                    : {
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          lineHeight: 'inherit',
                      }),
                ...sx,
            }}
        >
            {displayName}
            {showWaitingSuffix && (
                <Box
                    component="span"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.75em',
                        fontWeight: 400,
                        ml: 0.5,
                        ...waitingSuffixSx,
                    }}
                >
                    {LIVE_LOG_WAITING_SUFFIX}
                </Box>
            )}
        </Typography>
    );
};

export default LogNameDisplay;
