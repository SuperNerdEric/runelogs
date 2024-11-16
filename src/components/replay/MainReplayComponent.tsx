import React, {useEffect, useMemo, useState} from 'react';
import MapComponent from './MapComponent';
import PlaybackControls from './PlaybackControls';
import {Fight} from '../../models/Fight';
import {LogTypes, NPCDespawned, PositionLog} from '../../models/LogLine';

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

    const [npcPositions, setNpcPositions] = useState<{
        [npcKey: string]: { x: number; y: number; plane: number };
    }>({});
    const [initialNpcPositions, setInitialNpcPositions] = useState<{
        [npcKey: string]: { x: number; y: number; plane: number };
    }>({});

    // Calculate max time based on fight length
    const maxTick = Math.max(...fight.data.map((log) => log.tick || 0));
    const maxTime = (maxTick - (fight.data[0].tick || 0)) * 0.6;

    // Preprocess position logs and collect despawn times
    const {playerPositionLogs, npcPositionLogs, npcDespawnTimes} = useMemo(() => {
        const logs = {
            playerLogs: {} as { [playerName: string]: PositionLog[] },
            npcLogs: {} as { [npcKey: string]: PositionLog[] },
            npcDespawnTimes: {} as { [npcKey: string]: number }
        };

        fight.data.forEach((logLine) => {
            if (logLine.type === LogTypes.POSITION) {
                const positionLog = logLine as PositionLog;
                const source = positionLog.source;
                const key = source.id !== undefined
                    ? `${source.name}-${source.id}-${source.index}`
                    : source.name;

                if (source.id !== undefined) {
                    if (!logs.npcLogs[key]) logs.npcLogs[key] = [];
                    logs.npcLogs[key].push(positionLog);
                } else {
                    if (!logs.playerLogs[key]) logs.playerLogs[key] = [];
                    logs.playerLogs[key].push(positionLog);
                }
            } else if (logLine.type === LogTypes.NPC_DESPAWNED) {
                const npcDespawnLog = logLine as NPCDespawned;
                const npc = npcDespawnLog.source;
                const key = `${npc.name}-${npc.id}-${npc.index}`;
                logs.npcDespawnTimes[key] = (logLine.tick! - fight.data[0].tick!) * 0.6;
            }
        });

        Object.values(logs.playerLogs).forEach((positionLogs) => {
            positionLogs.sort((a, b) => (a.tick || 0) - (b.tick || 0));
        });
        Object.values(logs.npcLogs).forEach((positionLogs) => {
            positionLogs.sort((a, b) => (a.tick || 0) - (b.tick || 0));
        });

        return {
            playerPositionLogs: logs.playerLogs,
            npcPositionLogs: logs.npcLogs,
            npcDespawnTimes: logs.npcDespawnTimes,
        };
    }, [fight.data]);

    const extractInitialPositions = (logs: { [key: string]: PositionLog[] }) => {
        const initialPositions: { [key: string]: { x: number; y: number; plane: number } } = {};
        Object.entries(logs).forEach(([key, positionLogs]) => {
            if (positionLogs.length > 0) {
                initialPositions[key] = positionLogs[0].position;
            }
        });
        return initialPositions;
    };

    useEffect(() => {
        setInitialPlayerPositions(extractInitialPositions(playerPositionLogs));
    }, [playerPositionLogs]);

    useEffect(() => {
        setInitialNpcPositions(extractInitialPositions(npcPositionLogs));
    }, [npcPositionLogs]);

    // Update player positions based on current time
    useEffect(() => {
        const positions: { [playerName: string]: { x: number; y: number; plane: number } } = {};
        Object.entries(playerPositionLogs).forEach(([playerName, positionLogs]) => {
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

    // Update NPC positions based on current time and despawn times
    useEffect(() => {
        const positions: { [npcKey: string]: { x: number; y: number; plane: number } } = {};
        Object.entries(npcPositionLogs).forEach(([npcKey, positionLogs]) => {
            let lastPositionLog: PositionLog | null = null;
            const despawnTime = npcDespawnTimes[npcKey];

            for (const log of positionLogs) {
                const logTime = (log.tick! - fight.data[0].tick!) * 0.6;
                if (logTime <= currentTime) {
                    lastPositionLog = log;
                } else {
                    break;
                }
            }

            if (lastPositionLog) {
                if (despawnTime !== undefined && currentTime >= despawnTime) {
                    // NPC has despawned; exclude from positions
                    return;
                }
                positions[npcKey] = lastPositionLog.position;
            }
        });
        setNpcPositions(positions);
    }, [currentTime, npcPositionLogs, fight.data, npcDespawnTimes]);

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
                npcPositions={npcPositions}
                initialNpcPositions={initialNpcPositions}
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
