import React, {useMemo} from 'react';
import PercentileRankBadge from './PercentileRankBadge';
import RankBadgeCallout from './RankBadgeCallout';
import {displayUsername} from '../../utils/utils';
import {buildFightDpsRankLeaderboardHref} from '../../utils/leaderboardContent';

interface EncounterDpsRankBadgesProps {
    dpsRanks: Record<string, number>;
    dpsPercentiles: Record<string, number>;
    leaderboardName: string | null;
    playerCount: number;
    dpsLeaderboardKey: string | null;
}

const EncounterDpsRankBadges: React.FC<EncounterDpsRankBadgesProps> = ({
    dpsRanks,
    dpsPercentiles,
    leaderboardName,
    playerCount,
    dpsLeaderboardKey,
}) => {
    const badges = useMemo(
        () =>
            Object.entries(dpsRanks)
                .map(([playerId, rank]) => ({
                    playerId,
                    rank,
                    percentile: dpsPercentiles[playerId],
                    href: buildFightDpsRankLeaderboardHref(
                        rank,
                        leaderboardName,
                        playerCount,
                        dpsLeaderboardKey,
                    ),
                }))
                .sort((a, b) => a.rank - b.rank),
        [dpsRanks, dpsPercentiles, leaderboardName, playerCount, dpsLeaderboardKey],
    );

    if (badges.length === 0) {
        return null;
    }

    return (
        <RankBadgeCallout sx={{mb: 1, alignSelf: 'center'}}>
            {badges.map((badge) => (
                <PercentileRankBadge
                    key={badge.playerId}
                    rank={badge.rank}
                    percentile={badge.percentile}
                    label={displayUsername(badge.playerId)}
                    href={badge.href}
                />
            ))}
        </RankBadgeCallout>
    );
};

export default EncounterDpsRankBadges;
