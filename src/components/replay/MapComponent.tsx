import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapMarkers from './MapMarkers';
import MouseHover from './MouseHover';
import MapCenterSetter from './MapCenterSetter';

interface MapComponentProps {
    playerPositions: { [playerName: string]: { x: number; y: number; plane: number } };
    initialPlayerPositions: { [playerName: string]: { x: number; y: number; plane: number } };
    npcPositions: { [npcKey: string]: { x: number; y: number; plane: number } };
    initialNpcPositions: { [npcKey: string]: { x: number; y: number; plane: number } };
    plane: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
                                                       playerPositions,
                                                       initialPlayerPositions,
                                                       npcPositions,
                                                       initialNpcPositions,
                                                       plane,
                                                   }) => {
    return (
        <MapContainer
            center={[-79, -137]} // Use default center; MapCenterSetter will adjust it
            zoom={10}
            minZoom={8}
            maxZoom={11}
            style={{ height: '75vh', width: '60vw' }}
            attributionControl={false}
        >
            <TileLayer
                url={`https://raw.githubusercontent.com/SuperNerdEric/osrs_map_tiles/refs/heads/master/${plane}/{z}/{x}/{y}.png`}
                minZoom={4}
                maxZoom={11}
                noWrap={true}
                tms={true}
            />
            <MapCenterSetter initialPlayerPositions={initialPlayerPositions} />
            <MapMarkers playerPositions={playerPositions} npcPositions={npcPositions} />
            <MouseHover plane={plane} />
        </MapContainer>
    );
};

export default MapComponent;
