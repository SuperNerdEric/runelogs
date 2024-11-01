import React, {useEffect, useMemo, useState} from 'react';
import MapComponent from './MapComponent';
import PlaybackControls from './PlaybackControls';
import {Fight} from '../../models/Fight';
import {LogTypes, PositionLog} from '../../models/LogLine';

interface MainReplayComponentProps {
    fight: Fight;
}

const MainReplayComponent: React.FC<MainReplayComponentProps> = ({fight}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playerPositions, setPlayerPositions] = useState<{
        [playerName: string]: { x: number; y: number; plane: number };
    }>({});
    const [initialPlayerPositions, setInitialPlayerPositions] = useState<{
        [playerName: string]: { x: number; y: number; plane: number };
    }>({});

    // Calculate max time based on fight length
    const maxTick = Math.max(...fight.data.map((log) => log.tick || 0));
    const maxTime = (maxTick - (fight.data[0].tick || 0)) * 0.6;

    // Preprocess position logs
    const playerPositionLogs = useMemo(() => {
        const logs: { [playerName: string]: PositionLog[] } = {};
        fight.data.forEach((logLine) => {
            if (logLine.type === LogTypes.PLAYER_POSITION) {
                const positionLog = logLine as PositionLog;
                const playerName = positionLog.source.name;
                if (!logs[playerName]) {
                    logs[playerName] = [];
                }
                logs[playerName].push(positionLog);
            }
        });
        // Sort logs by tick
        Object.values(logs).forEach((positionLogs) => {
            positionLogs.sort((a, b) => (a.tick || 0) - (b.tick || 0));
        });
        return logs;
    }, [fight.data]);

    // Extract initial player positions
    useEffect(() => {
        const initialPositions: { [playerName: string]: { x: number; y: number; plane: number } } = {};
        Object.entries(playerPositionLogs).forEach(([playerName, positionLogs]) => {
            if (positionLogs.length > 0) {
                initialPositions[playerName] = positionLogs[0].position;
            }
        });
        setInitialPlayerPositions(initialPositions);
    }, [playerPositionLogs]);

    // Update positions based on current time
    useEffect(() => {
        const positions: { [playerName: string]: { x: number; y: number; plane: number } } = {};
        Object.entries(playerPositionLogs).forEach(([playerName, positionLogs]) => {
            // Find the last position log where logTime <= currentTime
            let lastPositionLog: PositionLog | null = null;
            for (const log of positionLogs) {
                const logTime = (log.tick! - fight.data[0].tick!) * 0.6;
                if (logTime <= currentTime) {
                    lastPositionLog = log;
                } else {
                    break;
                }
            }
            if (lastPositionLog) {
                positions[playerName] = lastPositionLog.position;
            }
        });
        setPlayerPositions(positions);
    }, [currentTime, playerPositionLogs, fight.data]);

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

    return (
        <div>
            <MapComponent
                playerPositions={playerPositions}
                initialPlayerPositions={initialPlayerPositions}
                plane={0}
            />
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
