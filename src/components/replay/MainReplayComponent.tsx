import React, {useEffect, useState} from 'react';
import MapComponent from './MapComponent';
import PlaybackControls from './PlaybackControls';
import PlayerSelector from './PlayerSelector';
import {Fight} from '../../models/Fight';
import {createGameStates, GamePosition, GameState, getCurrentGameState} from './GameState';
import PlayerEquipment from "./PlayerEquipment";
import * as semver from "semver";
import Prayers from './Prayers';
import CombatLevels from './CombatLevels';

interface MainReplayComponentProps {
    fight: Fight;
}

const MainReplayComponent: React.FC<MainReplayComponentProps> = ({fight}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [initialPlayerPosition, setInitialPlayerPosition] = useState<GamePosition | undefined>(undefined);
    const [gameStates, setGameStates] = useState<GameState[]>([]);
    const [currentGameState, setCurrentGameState] = useState<GameState | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPlayerName, setSelectedPlayerName] = useState<string | undefined>(undefined);

    // Calculate max time based on fight length
    const maxTick = Math.max(...fight.data.map((log) => log.tick || 0));
    const initialTick = fight.data[0].tick || 0;
    const maxTime = (maxTick - initialTick) * 0.6;

    // Preprocess fight data into game states for easier playback
    useEffect(() => {
        setGameStates(createGameStates(fight));
    }, [fight]);

    // Extract initial player position
    useEffect(() => {
        if (gameStates.length > 0) {
            const initialState = gameStates[0];
            const initialPosition = Object.values(initialState.players).find((state) => state.position !== undefined)?.position;
            setInitialPlayerPosition(initialPosition);
        }
    }, [gameStates]);

    // Update currentGameState based on currentTime
    useEffect(() => {
        setCurrentGameState(getCurrentGameState(gameStates, currentTime, initialTick));
    }, [gameStates, currentTime, initialTick]);

    // Handle play/pause functionality
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime((prevTime) => {
                    const newTime = prevTime + 0.6;
                    return newTime >= maxTime ? maxTime : newTime;
                });
            }, 600);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, maxTime]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSliderChange = (value: number) => {
        setCurrentTime(value);
        setIsPlaying(false); // Pause playback when slider is moved
    };

    const handleSelectPlayer = (playerName: string | undefined) => {
        setSelectedPlayerName(playerName);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedPlayerName(undefined);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // @ts-ignore
    return (
        <div style={{position: 'relative', width: '60vw', border: 'white 1px solid'}}>
            {currentGameState && initialPlayerPosition && (
                <>
                    <MapComponent
                        playerPositions={Object.fromEntries(
                            Object.entries(currentGameState.players)
                                .filter(([name, state]) => state.position !== undefined)
                                .map(([name, state]) => [name, state.position as GamePosition])
                        )}
                        initialPlayerPosition={initialPlayerPosition}
                        npcPositions={Object.fromEntries(
                            Object.entries(currentGameState.npcs)
                                .filter(([key, state]) => state.position !== undefined)
                                .map(([key, state]) => [key, state.position as GamePosition])
                        )}
                        plane={0}
                        selectedPlayerName={selectedPlayerName}
                    />
                    {fight.logVersion && semver.gte(fight.logVersion, "1.3.0") &&
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                pointerEvents: 'none', // Or else it blocks clicks on the map, but now we have to add pointerEvents: 'auto', to the children we want to be clickable
                            }}
                        >
                            {selectedPlayerName &&
                                currentGameState &&
                                currentGameState.players[selectedPlayerName] && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {currentGameState.players[selectedPlayerName].baseLevels && currentGameState.players[selectedPlayerName].boostedLevels &&
                                            (
                                            <CombatLevels
                                                // @ts-ignore
                                                baseLevels={currentGameState.players[selectedPlayerName].baseLevels}
                                                // @ts-ignore
                                                boostedLevels={currentGameState.players[selectedPlayerName].boostedLevels}
                                            />
                                        )}
                                        {currentGameState.players[selectedPlayerName].equipment && (
                                            <PlayerEquipment
                                                // @ts-ignore
                                                equipment={currentGameState.players[selectedPlayerName].equipment}
                                            />
                                        )}
                                        {(currentGameState.players[selectedPlayerName].prayers || currentGameState.players[selectedPlayerName].overhead) && (
                                            <Prayers
                                                prayers={currentGameState.players[selectedPlayerName].prayers}
                                                overhead={currentGameState.players[selectedPlayerName].overhead}
                                            />
                                        )}
                                    </div>
                                )}
                            <PlayerSelector
                                players={Object.keys(currentGameState.players)}
                                selectedPlayer={selectedPlayerName}
                                onSelectPlayer={handleSelectPlayer}
                            />
                        </div>
                    }
                </>
            )}
            <PlaybackControls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                currentTime={currentTime}
                maxTime={maxTime}
                onSliderChange={handleSliderChange}
            />
        </div>
    );
};

export default MainReplayComponent;
