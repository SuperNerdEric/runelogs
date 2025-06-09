import React from 'react';

interface PlayerSelectorProps {
    players: string[];
    selectedPlayer: string | undefined;
    onSelectPlayer: (playerName: string | undefined) => void;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({ players, selectedPlayer, onSelectPlayer }) => {
    const maxPerRow = 5;
    const tileWidth = 140;
    const tileGap = 5;
    const maxPlayers = maxPerRow * 8;
    const displayedPlayers = players.slice(0, maxPlayers);

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '5px 10px',
                pointerEvents: 'none',
                marginBottom: 'clamp(30px, 5vw, 50px)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: `${tileGap}px`,
                    maxWidth: `${maxPerRow * tileWidth + (maxPerRow - 1) * (tileGap * 2)}px`,
                    justifyContent: 'flex-end',
                    pointerEvents: 'auto',
                    userSelect: 'none',
                }}
            >
                {displayedPlayers.map((playerName) => (
                    <div
                        key={playerName}
                        onClick={() =>
                            onSelectPlayer(selectedPlayer === playerName ? undefined : playerName)
                        }
                        style={{
                            backgroundColor: '#262a2e',
                            color: '#b4bdff',
                            padding: '5px 0',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '16px',
                            width: `${tileWidth}px`,
                            border: selectedPlayer === playerName ? '2px solid white' : '2px solid black',
                        }}
                    >
                        {playerName}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerSelector;
