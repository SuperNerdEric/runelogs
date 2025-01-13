import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapMarkers from './MapMarkers';
import MouseHover from './MouseHover';
import MapCenterSetter from './MapCenterSetter';
import {GamePosition} from "./GameState";

interface MapComponentProps {
    playerPositions: { [playerName: string]: GamePosition };
    initialPlayerPosition: GamePosition;
    npcPositions: { [npcKey: string]: GamePosition };
    plane: number;
    selectedPlayerName?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
                                                       playerPositions,
                                                       initialPlayerPosition,
                                                       npcPositions,
                                                       plane,
                                                       selectedPlayerName,
                                                   }) => {
    return (
        <MapContainer
            center={[-79, -137]} // Use default center; MapCenterSetter will adjust it
            zoom={10}
            minZoom={8}
            maxZoom={11}
            style={{ height: '75vh' }}
            attributionControl={false}
        >
            <TileLayer
                url={`https://raw.githubusercontent.com/SuperNerdEric/osrs_map_tiles/refs/heads/master/${plane}/{z}/{x}/{y}.png`}
                minZoom={4}
                maxZoom={11}
                noWrap={true}
                tms={true}
            />
            <MapCenterSetter initialPlayerPosition={initialPlayerPosition} />
            <MapMarkers playerPositions={playerPositions} npcPositions={npcPositions} selectedPlayerName={selectedPlayerName}/>
            <MouseHover plane={plane} />
        </MapContainer>
    );
};

export default MapComponent;
