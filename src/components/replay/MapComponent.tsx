import React from 'react';
import {MapContainer, Pane, TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapMarkers from './MapMarkers';
import MouseHover from './MouseHover';
import MapCenterSetter from './MapCenterSetter';
import {GameObjectState, GamePosition, GraphicsObjectState} from "./GameState";

interface MapComponentProps {
    playerPositions: { [playerName: string]: GamePosition };
    initialPlayerPosition: GamePosition;
    npcPositions: { [npcKey: string]: GamePosition };
    graphicsObjectPositions: { [key: string]: GraphicsObjectState };
    gameObjectPositions: { [key: string]: GameObjectState };
    groundObjectPositions: { [key: string]: GameObjectState };
    plane: number;
    selectedPlayerName?: string;
    currentTick: number;
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
                                                       currentTick
                                                   }) => {
    return (
        <MapContainer
            center={[-79, -137]} // Use default center; MapCenterSetter will adjust it
            zoom={10}
            minZoom={8}
            maxZoom={11}
            style={{height: '60vh'}}
            attributionControl={false}
        >
            <TileLayer
                url={`https://raw.githubusercontent.com/SuperNerdEric/osrs_map_tiles/refs/heads/master/${plane}/{z}/{x}/{y}.png`}
                minZoom={4}
                maxZoom={11}
                noWrap={true}
                tms={true}
            />
            <MapCenterSetter initialPlayerPosition={initialPlayerPosition}/>
            <Pane name="players" style={{ zIndex: 400 }} />
            <Pane name="objects" style={{ zIndex: 500 }} />
            <MapMarkers playerPositions={playerPositions} npcPositions={npcPositions}
                        graphicsObjectPositions={graphicsObjectPositions}
                        gameObjectPositions={gameObjectPositions}
                        groundObjectPositions={groundObjectPositions}
                        selectedPlayerName={selectedPlayerName}
                        currentTick={currentTick}
            />
            <MouseHover plane={plane}/>
        </MapContainer>
    );
};

export default MapComponent;
