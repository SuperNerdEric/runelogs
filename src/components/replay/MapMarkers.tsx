import React from 'react';
import { Rectangle, Popup, useMap } from 'react-leaflet';
import { Position } from '../../utils/Position';

interface MapMarkersProps {
    playerPositions: { [playerName: string]: { x: number; y: number; plane: number } };
}

const MapMarkers: React.FC<MapMarkersProps> = ({ playerPositions }) => {
    const map = useMap();

    const rectangleOptions = {
        color: '#33b5e5',
        fillColor: '#33b5e5',
        fillOpacity: 1.0,
        weight: 1,
        interactive: true,
    };

    return (
        <>
            {Object.entries(playerPositions).map(([playerName, positionData]) => {
                const playerPosition = new Position(positionData.x, positionData.y, positionData.plane);

                const rectangle = playerPosition.toLeaflet(map, rectangleOptions);

                return (
                    <Rectangle
                        key={playerName}
                        bounds={rectangle.getBounds()}
                        pathOptions={rectangleOptions}
                    >
                        <Popup>{playerName}</Popup>
                    </Rectangle>
                );
            })}
        </>
    );
};

export default MapMarkers;
