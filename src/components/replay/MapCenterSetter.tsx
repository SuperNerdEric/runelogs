import {useEffect, useRef} from 'react';
import {useMap} from 'react-leaflet';
import {Position} from '../../utils/Position';
import {GamePosition} from "./GameState";

interface MapCenterSetterProps {
    initialPlayerPosition: GamePosition;
}

const MapCenterSetter: React.FC<MapCenterSetterProps> = ({initialPlayerPosition}) => {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (!hasCentered.current && Object.keys(initialPlayerPosition).length > 0) {
            hasCentered.current = true;
            const centerLatLng = Position.toLatLng(map, initialPlayerPosition.x, initialPlayerPosition.y);
            map.setView(centerLatLng, map.getZoom());
        }
    }, [map, initialPlayerPosition]);

    return null;
};

export default MapCenterSetter;
