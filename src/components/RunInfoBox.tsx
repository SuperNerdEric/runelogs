import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {format} from 'date-fns';
import {displayUsername} from '../utils/utils';

interface RunInfoBoxProps {
    uploaderId: string;
    startTime: string;
    players: string[];
}

const RunInfoBox: React.FC<RunInfoBoxProps> = ({
    uploaderId,
    startTime,
    players,
}) => {
    return (
        <div className="log-info-box">
            <span className="log-info-label">Uploader</span>
            <RouterLink
                to={`/logs/${uploaderId}`}
                className="link link-account capitalize"
            >
                {displayUsername(uploaderId)}
            </RouterLink>

            <span className="log-info-label">Started</span>
            <span className="log-info-value">
                {format(new Date(startTime), 'PPp')}
            </span>

            <span className="log-info-label">Players</span>
            <div className="log-info-value">
                {players.map((player, i) => (
                    <React.Fragment key={player}>
                        <RouterLink
                            to={`/player/${player}`}
                            className="link"
                        >
                            {displayUsername(player)}
                        </RouterLink>
                        {i < players.length - 1 ? ', ' : ''}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default RunInfoBox;
