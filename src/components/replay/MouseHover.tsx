import React, { useRef, useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import L, { Rectangle, PolylineOptions } from 'leaflet';
import { Position } from '../../utils/Position';

interface MouseHoverProps {
    plane: number;
}

const MouseHover: React.FC<MouseHoverProps> = ({ plane }) => {
    const rectangleRef = useRef<Rectangle | null>(null);
    const [tooltipPos, setTooltipPos] = useState<L.Point | null>(null);
    const [tileCoordinates, setTileCoordinates] = useState<{ x: number; y: number } | null>(null);

    const map = useMapEvents({
        mousemove(e) {
            const latLng = e.latlng;
            const containerPoint = map.latLngToContainerPoint(latLng);

            // Convert latLng to a Position instance
            const position = Position.fromLatLng(map, latLng, plane);

            // Define rectangle options for hover effect
            const rectangleOptions: PolylineOptions = {
                color: '#3b3b3b',
                fillColor: '#3b3b3b',
                fillOpacity: 1,
                weight: 1,
                interactive: false,
            };

            // Create or update the rectangle using toLeaflet
            if (rectangleRef.current) {
                rectangleRef.current.setBounds(position.toLeaflet(map).getBounds());
            } else {
                rectangleRef.current = position.toLeaflet(map, rectangleOptions).addTo(map);
            }

            setTooltipPos(containerPoint);
            setTileCoordinates({ x: position.x, y: position.y });
        },
        mouseout() {
            if (rectangleRef.current) {
                map.removeLayer(rectangleRef.current);
                rectangleRef.current = null;
            }
            setTooltipPos(null);
            setTileCoordinates(null);
        },
    });

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            if (rectangleRef.current) {
                map.removeLayer(rectangleRef.current);
                rectangleRef.current = null;
            }
        };
    }, [map]);

    if (!tooltipPos || !tileCoordinates) {
        return null;
    }

    return (
        <div
            className="mouse-hover-tooltip"
            style={{
                left: tooltipPos.x + 10,
                top: tooltipPos.y + 10,
            }}
        >
            ({tileCoordinates.x}, {tileCoordinates.y}, {plane})
        </div>
    );
};

export default MouseHover;
