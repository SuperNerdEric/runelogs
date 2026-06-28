import React from 'react';
import {useParams} from 'react-router-dom';
import PersonalBests from './PersonalBests';
import RecentEncounters from './RecentEncounters';
import {contentColumnClass} from '../theme';
import {displayUsername} from '../utils/utils';
import playerAvatar from '../assets/player-avatar.png';
import {cn} from '@/lib/utils';

const Player: React.FC = () => {
    const {playerName} = useParams<{playerName: string}>();

    return (
        <div className={cn(contentColumnClass, 'mt-1 px-2 pb-0 text-left')}>
            <div className="flex items-center gap-3 pb-0 pt-0">
                <img
                    src={playerAvatar}
                    alt={playerName ? `${displayUsername(playerName)} avatar` : 'Player avatar'}
                    className="size-10 shrink-0 rounded object-cover"
                />
                <h1 className="text-h4 m-0 capitalize text-[var(--color-text-player,#abd473)]">
                    {displayUsername(playerName)}
                </h1>
            </div>
            {playerName && <RecentEncounters />}
            {playerName && <PersonalBests />}
        </div>
    );
};

export default Player;
