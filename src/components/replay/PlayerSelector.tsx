import React from 'react';

interface PlayerSelectorProps {
    players: string[];
    selectedPlayer: string | undefined;
    onSelectPlayer: (playerName: string | undefined) => void;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({players, selectedPlayer, onSelectPlayer}) => {
    const maxPlayersPerRow = 5;
    const maxRows = 8;
    const displayedPlayers = players.slice(0, maxPlayersPerRow * maxRows);

    return (
        <div
            style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: `repeat(${maxPlayersPerRow}, auto)`,
                gap: '5px',
                backgroundColor: 'transparent',
                userSelect: 'none',
            }}
        >
            {displayedPlayers.map((playerName) => (
                <div
                    key={playerName}
                    onClick={() => {
                        if (selectedPlayer === playerName) {
                            onSelectPlayer(undefined);
                        } else {
                            onSelectPlayer(playerName);
                        }
                    }}
                    style={{
                        backgroundColor: '#262a2e',
                        color: '#b4bdff',
                        padding: '5px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '20px',
                        border: selectedPlayer === playerName ? '2px solid white' : '2px solid black',
                    }}
                >
                    {playerName}
                </div>
            ))}
        </div>
    );
};

export default PlayerSelector;
