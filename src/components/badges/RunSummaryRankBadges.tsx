import React from 'react';
import PercentileRankBadge from './PercentileRankBadge';
import RankBadgeCallout from './RankBadgeCallout';
import {buildPlayerRankLeaderboardHref} from '../../utils/leaderboardContent';
import {
    PlayerRankEntry,
    PlayerRankPercentileContext,
    resolvePlayerRankPercentile,
} from './playerRankPercentile';
import {RankBadgeCategory} from './RankBadgeCategoryIcon';

interface RunSummaryRankBadgesProps {
    entries: PlayerRankEntry[];
    percentileContext: PlayerRankPercentileContext;
    leaderboardName: string | null;
    playerCount: number;
    labelForEntry: (entry: PlayerRankEntry) => string;
}

function categoryForEntry(entry: PlayerRankEntry): RankBadgeCategory {
    return entry.category === 'Duration' ? 'duration' : 'dps';
}

const RunSummaryRankBadges: React.FC<RunSummaryRankBadgesProps> = ({
    entries,
    percentileContext,
    leaderboardName,
    playerCount,
    labelForEntry,
}) => {
    if (entries.length === 0) {
        return null;
    }

    return (
        <RankBadgeCallout sx={{mb: 2}}>
            {entries.map((entry, index) => (
                <PercentileRankBadge
                    key={`${entry.category}-${entry.playerId}-${index}`}
                    rank={entry.rank}
                    category={categoryForEntry(entry)}
                    percentile={resolvePlayerRankPercentile(entry, percentileContext)}
                    label={labelForEntry(entry)}
                    href={buildPlayerRankLeaderboardHref(entry, leaderboardName, playerCount)}
                />
            ))}
        </RankBadgeCallout>
    );
};

export default RunSummaryRankBadges;
