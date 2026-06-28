import React from 'react';
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
        <div className="fight-tile-rank-badges">
            {badges.map((badge) => (
                <PercentileRankBadge
                    key={badge.playerId}
                    rank={badge.rank}
                    category="dps"
                    percentile={badge.percentile}
                    label={displayUsername(badge.playerId)}
                    compact
                />
            ))}
        </div>
    );
};

export default FightTileRankBadges;
