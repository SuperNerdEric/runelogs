import React from 'react';
import {ImageOverlay, Popup, Rectangle, useMap} from 'react-leaflet';
import {Position} from "../../utils/Position";
import {NPC, npcIdMap} from "../../lib/npcIdMap";
import {graphicObjectIdMap} from "../../lib/graphicObjectIdMap";
import {gameObjectIdMap} from "../../lib/gameObjectIdMap";
import {GameObjectState, GamePosition, GraphicsObjectState} from "./GameState";
import {groundObjectIdMap} from "../../lib/groundObjectIdMap";
import L, {LatLngBoundsExpression} from "leaflet";

const TORNADO_IDS = new Set([8386, 10863, 10846]);

interface MapMarkersProps {
    playerPositions: { [playerName: string]: GamePosition };
    npcPositions: { [npcKey: string]: GamePosition };
    graphicsObjectPositions: { [key: string]: GraphicsObjectState };
    gameObjectPositions: { [key: string]: GameObjectState };
    groundObjectPositions: { [key: string]: GameObjectState };
    selectedPlayerName?: string;
    currentTick: number;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
                                                   playerPositions,
                                                   npcPositions,
                                                   graphicsObjectPositions,
                                                   gameObjectPositions,
                                                   groundObjectPositions,
                                                   selectedPlayerName,
                                                    currentTick,
                                               }) => {
    const map = useMap();

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
                const isSelected = playerName === selectedPlayerName;
                const playerRectangleOptions = {
                    color: 'white',
                    fillColor: 'white',
                    fillOpacity: isSelected ? 1.0 : 0.0,
                    weight: 1,
                    interactive: true,
                };

                const playerPosition = new Position(positionData.x, positionData.y, positionData.plane);
                const rectangle = playerPosition.toLeaflet(map, playerRectangleOptions);

                return (
                    <Rectangle
                        key={`player-${playerName}`}
                        bounds={rectangle.getBounds()}
                        pathOptions={playerRectangleOptions}
                        pane="players"
                    >
                        <Popup>{playerName}</Popup>
                    </Rectangle>
                );
            })}

            {/* Render NPC Markers */}
            {Object.entries(npcPositions).map(([npcKey, positionData]) => {
                // Extract NPC ID from npcKey (format: 'name-id-index')
                const parts = npcKey.split('|');
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

                const isTornado = TORNADO_IDS.has(npcId);
                const imageUrl = `https://chisel.weirdgloop.org/static/img/osrs-npc/${npcId}_128.png`;

                const baseBounds = rectangle.getBounds();

                // If it's a tornado, stretch the bounds vertically
                // This is pretty hacky, but it works for now.
                let adjustedBounds: LatLngBoundsExpression = baseBounds;
                if (isTornado) {
                    const height = baseBounds.getNorth() - baseBounds.getSouth();
                    const sw = baseBounds.getSouthWest();
                    const ne = baseBounds.getNorthEast();
                    const stretchedNE = L.latLng(ne.lat + height, ne.lng);
                    adjustedBounds = L.latLngBounds(sw, stretchedNE);
                }

                return (
                    <React.Fragment key={`npc-${npcKey}`}>
                        {/* Render the image overlay representing the full size of the NPC */}
                        <ImageOverlay
                            url={imageUrl}
                            bounds={adjustedBounds}
                            opacity={1}
                            interactive={false} // Set to false if you don't want the image to be clickable
                            pane="npcs"
                        />

                        <Rectangle
                            bounds={rectangle.getBounds()}
                            pathOptions={npcRectangleOptions}
                        >
                            <Popup>{formatActorKey(npcKey)}</Popup>
                        </Rectangle>
                    </React.Fragment>
                );


            })}
            {/* Render Graphics Object Markers */}
            {Object.entries(graphicsObjectPositions).map(([objectKey, positionData]) => {
                const objectPosition = new Position(positionData.position.x, positionData.position.y, positionData.position.plane);
                const rectangle = objectPosition.toLeaflet(map, npcRectangleOptions);

                // 1. Get the definition from graphicObjectIdMap
                const definition = graphicObjectIdMap[positionData.id];
                if (!definition) {
                    // If we have no definition, skip or fallback
                    return null;
                }

                // 2. Determine how many ticks have elapsed since spawn
                const spawnTick = positionData.spawnTick ?? 0;
                const ticksElapsed = currentTick - spawnTick;

                // 3. If multiple frames exist, pick the correct frame
                let displayImage = definition.imageUrl; // default single image
                if (definition.frames && definition.frames.length > 0) {
                    // clamp to the number of frames - 1
                    const frameIndex = Math.min(ticksElapsed, definition.frames.length - 1);
                    displayImage = definition.frames[frameIndex];
                }

                // 4. Render the overlay with the chosen frame
                return (
                    <React.Fragment key={`graphics-object-${objectKey}`}>
                        <ImageOverlay
                            url={displayImage!}
                            bounds={rectangle.getBounds()}
                            opacity={1}
                            interactive={false}
                            pane="objects"
                        />
                    </React.Fragment>
                );
            })}

            {/* Render Game Object Markers */}
            {Object.entries(gameObjectPositions).map(([objectKey, positionData]) => {
                const objectPosition = new Position(positionData.position.x, positionData.position.y, positionData.position.plane);
                const rectangle = objectPosition.toLeaflet(map, npcRectangleOptions);

                return (
                    <React.Fragment key={`game-object-${objectKey}`}>
                        {gameObjectIdMap[positionData.id] && (
                            <ImageOverlay
                                url={gameObjectIdMap[positionData.id].imageUrl}
                                bounds={rectangle.getBounds()}
                                opacity={1}
                                interactive={false}
                                pane="objects"
                            />
                        )}
                    </React.Fragment>
                );
            })}

            {/* Render Ground Object Markers */}
            {Object.entries(groundObjectPositions).map(([objectKey, positionData]) => {
                const objectPosition = new Position(
                    positionData.position.x,
                    positionData.position.y,
                    positionData.position.plane
                );
                const rectangle = objectPosition.toLeaflet(map, npcRectangleOptions);

                return (
                    <React.Fragment key={`ground-object-${objectKey}`}>
                        {groundObjectIdMap[positionData.id] && (
                            <ImageOverlay
                                url={groundObjectIdMap[positionData.id].imageUrl}
                                bounds={rectangle.getBounds()}
                                opacity={1}
                                interactive={false}
                                pane="objects"
                            />
                        )}
                    </React.Fragment>
                );
            })}

        </>
    );
};

export function formatActorKey(key: string): string {
    const parts = key.split('|');
    if (parts.length < 3) return key;

    const [name, id, index] = parts;
    return `${name} ${id}-${index}`;
}


export default MapMarkers;
