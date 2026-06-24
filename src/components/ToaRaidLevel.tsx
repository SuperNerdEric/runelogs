import React from 'react';
import {Box, Typography} from '@mui/material';
import {ToaExtraInfo} from '../utils/fightGroupExtraInfo';
import {
    formatToaRaidLevel,
    getToaRaidMode,
    getToaRaidModeIconUrl,
    getToaRaidModeLabel,
    hasToaRaidLevelData,
} from '../utils/toaExtraInfo';

interface ToaRaidLevelProps {
    toa: ToaExtraInfo | null | undefined;
}

const ToaRaidLevel: React.FC<ToaRaidLevelProps> = ({toa}) => {
    if (!hasToaRaidLevelData(toa)) {
        return null;
    }

    const mode = getToaRaidMode(toa.raidLevel);

    return (
        <Box className={`toa-raid-level toa-raid-level--${mode}`}>
            <Box className="toa-raid-level__inner">
                <Typography component="p" className="toa-raid-level__mode">
                    {getToaRaidModeLabel(mode)}
                </Typography>
                <img
                    className="toa-raid-level__icon"
                    src={getToaRaidModeIconUrl(mode)}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                />
                <Typography component="p" className="toa-raid-level__level">
                    Raid Level {formatToaRaidLevel(toa.raidLevel)}
                </Typography>
            </Box>
        </Box>
    );
};

export default ToaRaidLevel;
