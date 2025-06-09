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
import TickChart from './TickChart';
import {useMediaQuery} from "@mui/material";
import theme from "../../theme";
import EquipmentIcon from "../../assets/replay-icons/equipment.png";
import PrayerIcon from "../../assets/replay-icons/prayer.png";
import StatsIcon from "../../assets/replay-icons/stats.png";

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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeTab, setActiveTab] = useState<'levels' | 'equipment' | 'prayers'>('levels');

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

    const getTabButtonStyle = (tab: 'levels' | 'equipment' | 'prayers'): React.CSSProperties => ({
        backgroundColor: activeTab === tab ? 'rgb(183, 157, 126)' : 'rgb(115, 101, 89)',
        border: '1px solid black',
        padding: '6px',
        borderRadius: '4px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        transition: 'background-color 0.2s ease',
    });


    // @ts-ignore
    return (
        <div style={{position: 'relative', maxWidth: '1500px', width: '98vw', border: '3px solid grey'}}>
            <TickChart
                fight={fight}
                currentTime={currentTime}
                setCurrentTime={(newTime) => {
                    setCurrentTime(newTime);
                    setIsPlaying(false);
                }}
                initialTick={initialTick}
                maxTick={maxTick}
                activePlayers={Object.keys(currentGameState?.players || {})}
            />
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
                        graphicsObjectPositions={currentGameState.graphicsObjects}
                        gameObjectPositions={currentGameState.gameObjects}
                        groundObjectPositions={currentGameState.groundObjects}
                        plane={0}
                        selectedPlayerName={selectedPlayerName}
                        currentTick={currentGameState.tick}
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
                                currentGameState.players[selectedPlayerName] && (() => {
                                    const selectedPlayer = currentGameState.players[selectedPlayerName];

                                    return (
                                        isMobile ? (
                                            <div style={{zIndex: 10, marginBottom: '15px',}}>
                                                {/* Tab buttons for mobile view */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    gap: '4px',
                                                    marginRight: '10px',
                                                    marginBottom: '4px'
                                                }}>
                                                    <button onClick={() => setActiveTab('levels')}
                                                            style={getTabButtonStyle('levels')}>
                                                        <img src={StatsIcon} alt="Stats" width={24} height={24}/>
                                                    </button>
                                                    <button onClick={() => setActiveTab('equipment')}
                                                            style={getTabButtonStyle('equipment')}>
                                                        <img src={EquipmentIcon} alt="Equipment" width={24}
                                                             height={24}/>
                                                    </button>
                                                    <button onClick={() => setActiveTab('prayers')}
                                                            style={getTabButtonStyle('prayers')}>
                                                        <img src={PrayerIcon} alt="Prayers" width={24} height={24}/>
                                                    </button>
                                                </div>

                                                {activeTab === 'levels' &&
                                                    selectedPlayer.baseLevels &&
                                                    selectedPlayer.boostedLevels && (
                                                        <CombatLevels
                                                            baseLevels={selectedPlayer.baseLevels}
                                                            boostedLevels={selectedPlayer.boostedLevels}
                                                        />
                                                    )}

                                                {activeTab === 'equipment' &&
                                                    selectedPlayer.equipment && (
                                                        <PlayerEquipment
                                                            equipment={selectedPlayer.equipment}
                                                        />
                                                    )}

                                                {activeTab === 'prayers' && (
                                                    <Prayers
                                                        prayers={selectedPlayer.prayers}
                                                        overhead={selectedPlayer.overhead}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-end',
                                                zIndex: 10,
                                                marginBottom: '45px',
                                            }}>
                                                {/* Stacked for desktop view */}
                                                {selectedPlayer.baseLevels && selectedPlayer.boostedLevels && (
                                                    <CombatLevels
                                                        baseLevels={selectedPlayer.baseLevels}
                                                        boostedLevels={selectedPlayer.boostedLevels}
                                                        height={'120px'}
                                                    />
                                                )}
                                                {selectedPlayer.equipment && (
                                                    <PlayerEquipment
                                                        equipment={selectedPlayer.equipment}
                                                    />
                                                )}
                                                {(selectedPlayer.prayers || selectedPlayer.overhead) && (
                                                    <Prayers
                                                        prayers={selectedPlayer.prayers}
                                                        overhead={selectedPlayer.overhead}
                                                    />
                                                )}
                                            </div>
                                        )
                                    );
                                })()}
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

