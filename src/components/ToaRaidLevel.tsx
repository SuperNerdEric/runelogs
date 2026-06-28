import React from 'react';
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
        <div className={`toa-raid-level toa-raid-level--${mode}`}>
            <div className="toa-raid-level__inner">
                <p className="toa-raid-level__mode">
                    {getToaRaidModeLabel(mode)}
                </p>
                <img
                    className="toa-raid-level__icon"
                    src={getToaRaidModeIconUrl(mode)}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                />
                <p className="toa-raid-level__level">
                    Raid Level {formatToaRaidLevel(toa.raidLevel)}
                </p>
            </div>
        </div>
    );
};

export default ToaRaidLevel;
