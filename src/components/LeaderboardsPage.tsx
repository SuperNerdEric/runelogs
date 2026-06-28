import React from 'react';
import Leaderboard from './Leaderboard';
import TrophyIcon from './TrophyIcon';
import {
    pageHeaderClass,
    pageHeaderIconClass,
    pageHeaderTitleClass,
} from './pageHeaderStyles';
import {contentColumnClass} from '../theme';
import {cn} from '@/lib/utils';

const LeaderboardsPage: React.FC = () => {
    return (
        <div className={cn(contentColumnClass, 'mt-2 px-2 pb-4 max-[1279px]:px-1')}>
            <div className={pageHeaderClass}>
                <div className={pageHeaderIconClass}>
                    <TrophyIcon size={32}/>
                </div>
                <h1 className={pageHeaderTitleClass}>Leaderboards</h1>
            </div>

            <Leaderboard entriesPerPage={50}/>
        </div>
    );
};

export default LeaderboardsPage;
