import React, {useMemo} from 'react';
import {ImageOverlay, Popup, Rectangle, useMap} from 'react-leaflet';
import {Position} from "../../utils/Position";
import {NPC, npcIdMap} from "../../lib/npcIdMap";
import {graphicObjectIdMap, getGraphicObjectFrameIndex, getGraphicObjectTotalCycles} from "../../lib/graphicObjectIdMap";
import {gameObjectIdMap, getGameObjectAnchorOffset, getGameObjectTileSize} from "../../lib/gameObjectIdMap";
import {GameObjectState, GamePosition, GraphicsObjectState} from "./GameState";
import {groundObjectIdMap} from "../../lib/groundObjectIdMap";
import {computeSolLaserBeams, isSolLaserGraphic, SolLaserBeam} from "../../lib/solLaserBeams";
import {
    getYamaShadowWallFadeOpacity,
    getYamaShadowWallImageUrl,
    getYamaShadowWallPhase,
    getYamaShadowWallTileBounds,
    getYamaShadowWallTileCyclesElapsed,
    getYamaWallDiagonal,
    isYamaShadowWallGraphic,
    isYamaShadowWallVisible,
} from "../../lib/yamaShadowWall";
import {
    getGraphicObjectAnimationCyclesElapsed,
    isGraphicObjectVisible,
} from "../../lib/replayTiming";
import L, {LatLngBounds} from "leaflet";
import {colors} from "../../theme";
import NpcImageOverlay from './NpcImageOverlay';

interface MapMarkersProps {
    playerPositions: { [playerName: string]: GamePosition };
    npcPositions: { [npcKey: string]: GamePosition };
    graphicsObjectPositions: { [key: string]: GraphicsObjectState };
    gameObjectPositions: { [key: string]: GameObjectState };
    groundObjectPositions: { [key: string]: GameObjectState };
    selectedPlayerName?: string;
    currentTime: number;
    initialTick: number;
    fightEpochCycle?: number;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
                                                   playerPositions,
                                                   npcPositions,
                                                   graphicsObjectPositions,
                                                   gameObjectPositions,
                                                   groundObjectPositions,
                                                   selectedPlayerName,
                                                   currentTime,
                                                   initialTick,
                                                   fightEpochCycle,
                                               }) => {
    const map = useMap();
    const solLaserBeams = useMemo(
        () => computeSolLaserBeams(graphicsObjectPositions),
        [graphicsObjectPositions],
    );

    const npcRectangleOptions = {
        color: colors.replay.marker,
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
                    color: colors.text.primary,
                    fillColor: colors.text.primary,
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

                return (
                    <React.Fragment key={`npc-${npcKey}`}>
                        <NpcImageOverlay
                            npcId={npcId}
                            x={positionData.x}
                            y={positionData.y}
                            size={size}
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
            {/* Render Sol laser beams as stretched overlays (per-tile segments do not align). */}
            {solLaserBeams.map((beam, index) => {
                const definition = graphicObjectIdMap[beam.textureId];
                if (!definition) {
                    return null;
                }

                const cyclesElapsed = getGraphicObjectAnimationCyclesElapsed(
                    currentTime,
                    {spawnTick: beam.spawnTick},
                    initialTick,
                    fightEpochCycle,
                );
                let displayImage = definition.imageUrl;
                if (definition.frames && definition.frames.length > 0) {
                    const frameIndex = getGraphicObjectFrameIndex(cyclesElapsed, definition);
                    displayImage = definition.frames[frameIndex];
                }

                return (
                    <ImageOverlay
                        key={`sol-laser-${beam.spawnTick}-${beam.orientation}-${beam.fixedCoord}-${index}`}
                        url={displayImage!}
                        bounds={solLaserBeamToBounds(map, beam)}
                        opacity={beam.phase === 'shot' ? 1 : 0.85}
                        interactive={false}
                        pane="objects"
                    />
                );
            })}

            {/* Yama shadow walls — see yamaShadowWall.ts for wave/phase timing. */}
            {Object.entries(graphicsObjectPositions).map(([objectKey, positionData]) => {
                if (!isYamaShadowWallGraphic(positionData.id)) {
                    return null;
                }

                const spawnTick = positionData.spawnTick ?? 0;
                const cycleTiming = {
                    startCycle: positionData.startCycle,
                    endCycle: positionData.endCycle,
                    spawnTick,
                };
                if (!isYamaShadowWallVisible(currentTime, cycleTiming, initialTick, fightEpochCycle)) {
                    return null;
                }

                const cyclesElapsed = getYamaShadowWallTileCyclesElapsed(
                    currentTime,
                    positionData,
                    initialTick,
                    fightEpochCycle,
                );
                const phase = getYamaShadowWallPhase(cyclesElapsed);
                if (!phase) {
                    return null;
                }

                const diagonal = getYamaWallDiagonal(positionData.id);
                const displayImage = getYamaShadowWallImageUrl(phase, diagonal);
                const opacity = phase === 'active' ? 1 : getYamaShadowWallFadeOpacity(cyclesElapsed);

                return (
                    <ImageOverlay
                        key={`yama-shadow-wall-${objectKey}`}
                        url={displayImage}
                        bounds={getYamaShadowWallTileBounds(
                            map,
                            positionData.position.x,
                            positionData.position.y,
                            diagonal,
                        )}
                        opacity={opacity}
                        interactive={false}
                        pane="objects"
                    />
                );
            })}

            {/* Render Graphics Object Markers */}
            {Object.entries(graphicsObjectPositions).map(([objectKey, positionData]) => {
                if (isSolLaserGraphic(positionData.id)) {
                    return null;
                }
                if (isYamaShadowWallGraphic(positionData.id)) {
                    return null;
                }

                const objectPosition = new Position(positionData.position.x, positionData.position.y, positionData.position.plane);
                const rectangle = objectPosition.toLeaflet(map, npcRectangleOptions);

                // 1. Get the definition from graphicObjectIdMap
                const definition = graphicObjectIdMap[positionData.id];
                if (!definition) {
                    // If we have no definition, skip or fallback
                    return null;
                }

                // 2. Determine animation age in client cycles
                const spawnTick = positionData.spawnTick ?? 0;
                const cycleTiming = {
                    startCycle: positionData.startCycle,
                    endCycle: positionData.endCycle,
                    spawnTick,
                };
                const totalCycles = getGraphicObjectTotalCycles(definition);
                if (!isGraphicObjectVisible(currentTime, cycleTiming, initialTick, fightEpochCycle, totalCycles)) {
                    return null;
                }

                const cyclesElapsed = getGraphicObjectAnimationCyclesElapsed(
                    currentTime,
                    cycleTiming,
                    initialTick,
                    fightEpochCycle,
                );

                // 3. If multiple frames exist, pick the correct frame
                let displayImage = definition.imageUrl;
                if (definition.frames && definition.frames.length > 0) {
                    const frameIndex = getGraphicObjectFrameIndex(cyclesElapsed, definition);
                    displayImage = definition.frames[frameIndex];
                }

                // 4. Render the overlay with the chosen frame
                return (
                    <ImageOverlay
                        key={`graphics-object-${objectKey}`}
                        url={displayImage!}
                        bounds={rectangle.getBounds()}
                        opacity={1}
                        interactive={false}
                        pane="objects"
                    />
                );
            })}

            {/* Render Game Object Markers */}
            {Object.entries(gameObjectPositions).map(([objectKey, positionData]) => {
                const tileSize = getGameObjectTileSize(positionData.id);
                const anchorOffset = getGameObjectAnchorOffset(positionData.id);
                const objectPosition = new Position(
                    positionData.position.x - anchorOffset,
                    positionData.position.y - anchorOffset,
                    positionData.position.plane,
                );
                const rectangle = objectPosition.toLeaflet(map, npcRectangleOptions, tileSize);
                const definition = gameObjectIdMap[positionData.id];

                return definition ? (
                    <ImageOverlay
                        key={`game-object-${objectKey}`}
                        url={definition.imageUrl}
                        bounds={rectangle.getBounds()}
                        opacity={1}
                        interactive={false}
                        pane="objects"
                    />
                ) : null;
            })}

            {/* Render Ground Object Markers */}
            {Object.entries(groundObjectPositions).map(([objectKey, positionData]) => {
                const objectPosition = new Position(
                    positionData.position.x,
                    positionData.position.y,
                    positionData.position.plane
                );
                const rectangle = objectPosition.toLeaflet(map, npcRectangleOptions);
                const definition = groundObjectIdMap[positionData.id];

                return definition ? (
                    <ImageOverlay
                        key={`ground-object-${objectKey}`}
                        url={definition.imageUrl}
                        bounds={rectangle.getBounds()}
                        opacity={1}
                        interactive={false}
                        pane="objects"
                    />
                ) : null;
            })}

        </>
    );
};

function solLaserBeamToBounds(map: L.Map, beam: SolLaserBeam): LatLngBounds {
    if (beam.orientation === 'horizontal') {
        const southWest = Position.toLatLng(map, beam.startVar, beam.fixedCoord);
        const northEast = Position.toLatLng(map, beam.endVar + 1, beam.fixedCoord + 1);
        return L.latLngBounds(southWest, northEast);
    }

    const southWest = Position.toLatLng(map, beam.fixedCoord, beam.startVar);
    const northEast = Position.toLatLng(map, beam.fixedCoord + 1, beam.endVar + 1);
    return L.latLngBounds(southWest, northEast);
}

export function formatActorKey(key: string): string {
    const parts = key.split('|');
    if (parts.length < 3) return key;

    const [name, id, index] = parts;
    return `${name} ${id}-${index}`;
}


export default MapMarkers;
