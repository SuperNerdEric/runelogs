import React from 'react';
import {ImageOverlay, Popup, Rectangle, useMap} from 'react-leaflet';
import {Position} from "../../utils/Position";
import {NPC, npcIdMap} from "../../lib/npcIdMap";

interface MapMarkersProps {
    playerPositions: { [playerName: string]: { x: number; y: number; plane: number } };
    npcPositions: { [npcKey: string]: { x: number; y: number; plane: number } };
}

const MapMarkers: React.FC<MapMarkersProps> = ({playerPositions, npcPositions}) => {
    const map = useMap();

    const playerRectangleOptions = {
        color: '#33b5e5',
        fillColor: '#33b5e5',
        fillOpacity: 1.0,
        weight: 1,
        interactive: true,
    };

    const npcRectangleOptions = {
        color: '#e53333',
        fillOpacity: 0.0,
        weight: 2,
        interactive: true,
    };

    return (
        <>
            {/* Render Player Markers */}
            {Object.entries(playerPositions).map(([playerName, positionData]) => {
                const playerPosition = new Position(positionData.x, positionData.y, positionData.plane);
                const rectangle = playerPosition.toLeaflet(map, playerRectangleOptions);

                return (
                    <Rectangle
                        key={`player-${playerName}`}
                        bounds={rectangle.getBounds()}
                        pathOptions={playerRectangleOptions}
                    >
                        <Popup>{playerName}</Popup>
                    </Rectangle>
                );
            })}

            {/* Render NPC Markers */}
            {Object.entries(npcPositions).map(([npcKey, positionData]) => {
                // Extract NPC ID from npcKey (format: 'name-id-index')
                const parts = npcKey.split('-');
                if (parts.length < 3) {
                    console.error(`Invalid npcKey format: ${npcKey}`);
                    return null;
                }
                const npcId = Number(parts[1]);

                // Retrieve NPC details from npcIdMap
                const npc: NPC | undefined = npcIdMap[npcId];
                if (!npc) {
                    console.error(`NPC ID ${npcId} not found in npcIdMap`);
                    return null;
                }

                const size = npc.size;

                const npcPosition = new Position(positionData.x, positionData.y, positionData.plane);
                const rectangle = npcPosition.toLeaflet(map, npcRectangleOptions, size);

                const imageUrl = `https://chisel.weirdgloop.org/static/img/osrs-npc/${npcId}_128.png`;

                return (
                    <React.Fragment key={`npc-${npcKey}`}>
                        {/* Render the image overlay representing the full size of the NPC */}
                        <ImageOverlay
                            url={imageUrl}
                            bounds={rectangle.getBounds()}
                            opacity={1}
                            interactive={false} // Set to false if you don't want the image to be clickable
                        />

                        <Rectangle
                            bounds={rectangle.getBounds()}
                            pathOptions={npcRectangleOptions}
                        >
                            <Popup>{npcKey}</Popup>
                        </Rectangle>
                    </React.Fragment>
                );


            })}
        </>
    );
};

export default MapMarkers;
