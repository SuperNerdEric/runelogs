import React from 'react';
import {Box} from '@mui/material';
import PercentileRankBadge from './PercentileRankBadge';
import {displayUsername} from '../../utils/utils';

export interface FightTileRankBadge {
    playerId: string;
    rank: number;
    percentile?: number;
}

interface FightTileRankBadgesProps {
    badges: FightTileRankBadge[];
}

const FightTileRankBadges: React.FC<FightTileRankBadgesProps> = ({badges}) => {
    if (badges.length === 0) {
        return null;
    }

    return (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, justifyContent: 'center'}}>
            {badges.map((badge) => (
                <PercentileRankBadge
                    key={badge.playerId}
                    rank={badge.rank}
                    percentile={badge.percentile}
                    label={displayUsername(badge.playerId)}
                    compact
                />
            ))}
        </Box>
    );
};

export default FightTileRankBadges;
