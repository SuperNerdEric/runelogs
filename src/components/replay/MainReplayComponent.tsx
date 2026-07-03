import React, { useEffect, useMemo, useRef, useState } from "react";
import MapComponent from "./MapComponent";
import PlaybackControls from "./PlaybackControls";
import PlayerSelector from "./PlayerSelector";
import { Fight } from "../../models/Fight";
import {
  createGameStates,
  GamePosition,
  getGameStateAtTick,
  getTargetTick,
} from "./GameState";
import PlayerEquipment from "./PlayerEquipment";
import * as semver from "semver";
import Prayers from "./Prayers";
import CombatLevels from "./CombatLevels";
import TickChart from "./TickChart";
import { useMediaQuery } from "@mui/material";
import theme from "../../theme";
import { colors } from "../../theme";
import {
  computeFightEpochCycle,
  TICK_DURATION_SECONDS,
} from "../../lib/replayTiming";
import EquipmentIcon from "../../assets/replay-icons/equipment.png";
import PrayerIcon from "../../assets/replay-icons/prayer.png";
import StatsIcon from "../../assets/replay-icons/stats.png";

interface MainReplayComponentProps {
  fight: Fight;
}

const MainReplayComponent: React.FC<MainReplayComponentProps> = ({ fight }) => {
  const replayContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialPlayerPosition, setInitialPlayerPosition] = useState<
    GamePosition | undefined
  >(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlayerName, setSelectedPlayerName] = useState<
    string | undefined
  >(undefined);
  const [highlightObjects, setHighlightObjects] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState<
    "levels" | "equipment" | "prayers"
  >("levels");

  // Calculate max time based on fight length
  const maxTick = Math.max(...fight.data.map((log) => log.tick || 0));
  const initialTick = fight.data[0].tick || 0;
  const maxTime = (maxTick - initialTick) * TICK_DURATION_SECONDS;
  const fightEpochCycle = useMemo(
    () => computeFightEpochCycle(fight.data, initialTick),
    [fight.data, initialTick],
  );
  const gameStates = useMemo(() => createGameStates(fight), [fight]);
  const currentTargetTick = useMemo(
    () => getTargetTick(currentTime, initialTick),
    [currentTime, initialTick],
  );
  const currentGameState = useMemo(
    () => getGameStateAtTick(gameStates, currentTargetTick),
    [gameStates, currentTargetTick],
  );

  // Extract initial player position
  useEffect(() => {
    if (gameStates.length > 0) {
      const initialState = gameStates[0];
      const initialPosition = Object.values(initialState.players).find(
        (state) => state.position !== undefined,
      )?.position;
      setInitialPlayerPosition(initialPosition);
    }
  }, [gameStates]);

  // Handle play/pause functionality
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let rafId = 0;
    let lastTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const elapsedSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setCurrentTime((prevTime) => {
        const newTime = Math.min(prevTime + elapsedSeconds, maxTime);
        if (newTime >= maxTime) {
          setIsPlaying(false);
        }
        return newTime;
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
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
      if (event.key === "Escape") {
        setSelectedPlayerName(undefined);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const container = replayContainerRef.current;
    if (!container) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle replay fullscreen", error);
    }
  };

  const activePlayers = useMemo(
    () => Object.keys(currentGameState?.players || {}),
    [currentGameState],
  );
  const playerPositions = useMemo(() => {
    if (!currentGameState) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(currentGameState.players)
        .filter(([, state]) => state.position !== undefined)
        .map(([name, state]) => [name, state.position as GamePosition]),
    );
  }, [currentGameState]);
  const npcPositions = useMemo(() => {
    if (!currentGameState) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(currentGameState.npcs)
        .filter(([, state]) => state.position !== undefined)
        .map(([key, state]) => [key, state.position as GamePosition]),
    );
  }, [currentGameState]);

  const getTabButtonStyle = (
    tab: "levels" | "equipment" | "prayers",
  ): React.CSSProperties => ({
    backgroundColor:
      activeTab === tab ? colors.replay.tabActive : colors.replay.tabInactive,
    border: "1px solid black",
    padding: "6px",
    borderRadius: "4px",
    cursor: "pointer",
    pointerEvents: "auto",
    transition: "background-color 0.2s ease",
  });

  // @ts-ignore
  return (
    <div ref={replayContainerRef} className="replay-root">
      <TickChart
        fight={fight}
        currentTime={currentTime}
        setCurrentTime={(newTime) => {
          setCurrentTime(newTime);
          setIsPlaying(false);
        }}
        initialTick={initialTick}
        maxTick={maxTick}
        activePlayers={activePlayers}
      />
      {currentGameState && initialPlayerPosition && (
        <>
          <div className="replay-map-section">
            <div className="replay-map-controls">
              <button
                type="button"
                className="replay-fullscreen-button"
                onClick={toggleFullscreen}
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
                    />
                  </svg>
                )}
              </button>
              <label className="replay-highlight-objects-control">
                <input
                  type="checkbox"
                  checked={highlightObjects}
                  onChange={(event) =>
                    setHighlightObjects(event.target.checked)
                  }
                />
                Highlight objects
              </label>
            </div>
            <MapComponent
              playerPositions={playerPositions}
              initialPlayerPosition={initialPlayerPosition}
              npcPositions={npcPositions}
              graphicsObjectPositions={currentGameState.graphicsObjects}
              gameObjectPositions={currentGameState.gameObjects}
              groundObjectPositions={currentGameState.groundObjects}
              plane={initialPlayerPosition?.plane ?? 0}
              selectedPlayerName={selectedPlayerName}
              currentTime={currentTime}
              initialTick={initialTick}
              fightEpochCycle={fightEpochCycle}
              highlightObjects={highlightObjects}
            />
          </div>
          {fight.logVersion && semver.gte(fight.logVersion, "1.3.0") && (
            <div className="replay-player-overlay">
              {selectedPlayerName &&
                currentGameState &&
                currentGameState.players[selectedPlayerName] &&
                (() => {
                  const selectedPlayer =
                    currentGameState.players[selectedPlayerName];

                  return isMobile ? (
                    <div className="replay-player-panel replay-player-panel--mobile">
                      {/* Tab buttons for mobile view */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "4px",
                          marginRight: "10px",
                          marginBottom: "4px",
                        }}
                      >
                        <button
                          onClick={() => setActiveTab("levels")}
                          style={getTabButtonStyle("levels")}
                        >
                          <img
                            src={StatsIcon}
                            alt="Stats"
                            width={24}
                            height={24}
                          />
                        </button>
                        <button
                          onClick={() => setActiveTab("equipment")}
                          style={getTabButtonStyle("equipment")}
                        >
                          <img
                            src={EquipmentIcon}
                            alt="Equipment"
                            width={24}
                            height={24}
                          />
                        </button>
                        <button
                          onClick={() => setActiveTab("prayers")}
                          style={getTabButtonStyle("prayers")}
                        >
                          <img
                            src={PrayerIcon}
                            alt="Prayers"
                            width={24}
                            height={24}
                          />
                        </button>
                      </div>

                      {activeTab === "levels" &&
                        selectedPlayer.baseLevels &&
                        selectedPlayer.boostedLevels && (
                          <CombatLevels
                            baseLevels={selectedPlayer.baseLevels}
                            boostedLevels={selectedPlayer.boostedLevels}
                          />
                        )}

                      {activeTab === "equipment" &&
                        selectedPlayer.equipment && (
                          <PlayerEquipment
                            equipment={selectedPlayer.equipment}
                          />
                        )}

                      {activeTab === "prayers" && (
                        <Prayers
                          prayers={selectedPlayer.prayers}
                          overhead={selectedPlayer.overhead}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="replay-player-panel">
                      {/* Stacked for desktop view */}
                      {selectedPlayer.baseLevels &&
                        selectedPlayer.boostedLevels && (
                          <CombatLevels
                            baseLevels={selectedPlayer.baseLevels}
                            boostedLevels={selectedPlayer.boostedLevels}
                            height={"120px"}
                          />
                        )}
                      {selectedPlayer.equipment && (
                        <PlayerEquipment equipment={selectedPlayer.equipment} />
                      )}
                      {(selectedPlayer.prayers || selectedPlayer.overhead) && (
                        <Prayers
                          prayers={selectedPlayer.prayers}
                          overhead={selectedPlayer.overhead}
                        />
                      )}
                    </div>
                  );
                })()}
              <PlayerSelector
                players={Object.keys(currentGameState.players)}
                selectedPlayer={selectedPlayerName}
                onSelectPlayer={handleSelectPlayer}
              />
            </div>
          )}
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
