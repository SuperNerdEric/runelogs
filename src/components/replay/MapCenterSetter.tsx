import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Position } from '../../utils/Position';

interface MapCenterSetterProps {
    initialPlayerPositions: { [playerName: string]: { x: number; y: number; plane: number } };
}

const MapCenterSetter: React.FC<MapCenterSetterProps> = ({ initialPlayerPositions }) => {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (!hasCentered.current && Object.keys(initialPlayerPositions).length > 0) {
            hasCentered.current = true;

            const firstPlayerName = Object.keys(initialPlayerPositions)[0];
            const positionData = initialPlayerPositions[firstPlayerName];
            const centerLatLng = Position.toLatLng(map, positionData.x, positionData.y);
            map.setView(centerLatLng, map.getZoom());
        }
    }, [map, initialPlayerPositions]);

    return null;
};

export default MapCenterSetter;
