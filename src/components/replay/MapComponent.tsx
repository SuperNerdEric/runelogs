import React from "react";
import { MapContainer, Pane, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapMarkers from "./MapMarkers";
import MouseHover from "./MouseHover";
import MapCenterSetter from "./MapCenterSetter";
import CombatOverlay from "./CombatOverlay";
import {
  GameObjectState,
  GamePosition,
  GraphicsObjectState,
} from "./GameState";
import { ReplayCombat } from "./replayCombat";

interface MapComponentProps {
  playerPositions: { [playerName: string]: GamePosition };
  initialPlayerPosition: GamePosition;
  npcPositions: { [npcKey: string]: GamePosition };
  graphicsObjectPositions: { [key: string]: GraphicsObjectState };
  gameObjectPositions: { [key: string]: GameObjectState };
  groundObjectPositions: { [key: string]: GameObjectState };
  plane: number;
  selectedPlayerName?: string;
  currentTime: number;
  initialTick: number;
  fightEpochCycle?: number;
  highlightObjects?: boolean;
  combat: ReplayCombat;
}

const MapComponent: React.FC<MapComponentProps> = ({
  playerPositions,
  initialPlayerPosition,
  npcPositions,
  graphicsObjectPositions,
  gameObjectPositions,
  groundObjectPositions,
  plane,
  selectedPlayerName,
  currentTime,
  initialTick,
  fightEpochCycle,
  highlightObjects,
  combat,
}) => {
  return (
    <MapContainer
      center={[-79, -137]} // Use default center; MapCenterSetter will adjust it
      zoom={10}
      minZoom={8}
      maxZoom={12}
      style={{ height: "60vh" }}
      attributionControl={false}
    >
      <TileLayer
        url={`https://raw.githubusercontent.com/SuperNerdEric/osrs_map_tiles/master/${plane}/{z}/{x}/{y}.png`}
        minZoom={4}
        maxZoom={12}
        maxNativeZoom={11}
        noWrap={true}
        tms={true}
      />
      <MapCenterSetter initialPlayerPosition={initialPlayerPosition} />
      <Pane name="players" style={{ zIndex: 400 }} />
      <Pane name="objects" style={{ zIndex: 500 }} />
      <Pane name="objectHighlights" style={{ zIndex: 550 }} />
      <Pane name="npcs" style={{ zIndex: 600 }} />
      <Pane name="healthbars" style={{ zIndex: 650 }} />
      <Pane name="hitsplats" style={{ zIndex: 700 }} />
      <MapMarkers
        playerPositions={playerPositions}
        npcPositions={npcPositions}
        graphicsObjectPositions={graphicsObjectPositions}
        gameObjectPositions={gameObjectPositions}
        groundObjectPositions={groundObjectPositions}
        plane={plane}
        selectedPlayerName={selectedPlayerName}
        currentTime={currentTime}
        initialTick={initialTick}
        fightEpochCycle={fightEpochCycle}
        highlightObjects={highlightObjects}
      />
      <CombatOverlay
        playerPositions={playerPositions}
        npcPositions={npcPositions}
        combat={combat}
      />
      <MouseHover plane={plane} />
    </MapContainer>
  );
};

export default MapComponent;
