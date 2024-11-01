import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Position } from '../../utils/Position';

interface MouseCoordinateTooltipProps {
    plane: number;
}

const MouseCoordinateTooltip: React.FC<MouseCoordinateTooltipProps> = ({ plane }) => {
    const [tooltipPos, setTooltipPos] = React.useState<L.Point | null>(null);
    const [tileCoordinates, setTileCoordinates] = React.useState<{ x: number; y: number } | null>(null);

    const map = useMapEvents({
        mousemove(e) {
            const latLng = e.latlng;
            const containerPoint = map.latLngToContainerPoint(latLng);

            // Convert latLng to tile coordinates
            const position = Position.fromLatLng(map, latLng, plane);

            setTooltipPos(containerPoint);
            setTileCoordinates({ x: position.x, y: position.y });
        },
        mouseout() {
            setTooltipPos(null);
            setTileCoordinates(null);
        },
    });

    if (!tooltipPos || !tileCoordinates) {
        return null;
    }

    return (
        <div
            className="mouse-tooltip"
            style={{
                left: tooltipPos.x + 10,
                top: tooltipPos.y + 10,
            }}
        >
            ({tileCoordinates.x}, {tileCoordinates.y}, {plane})
        </div>
    );
};

export default MouseCoordinateTooltip;
