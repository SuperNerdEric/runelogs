import React from 'react';
import backgroundImageUrl from '../../assets/WornEquipment.png';
import blankEquipmentBackground from '../../assets/BlankEquipmentBackground.png';
import { itemIdMap } from "../../lib/itemIdMap";

interface PlayerEquipmentProps {
    equipment: string[];
}

export const getItemImageUrl = (itemId: number): string => {
    return `https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemId}.png`;
};

const equipmentSlotPositions = [
    { left: '94px', top: '1px' },   // Head
    { left: '32px', top: '54px' },  // Cape
    { left: '94px', top: '54px' },  // Neck
    { left: '10px', top: '108px' },   // Mainhand
    { left: '94px', top: '108px' },  // Chest
    { left: '178px', top: '108px' },  // Offhand
    { left: '10px', top: '272px' },   // ??
    { left: '94px', top: '162px' },  // Legs
    { left: '94px', top: '272px' },      // ??
    { left: '10px', top: '217px' },   // Gloves
    { left: '94px', top: '217px' },  // Boots
    { left: '178px', top: '272px' },      // ??
    { left: '178px', top: '217px' },  // Ring
    { left: '155px', top: '54px' },  // Ammo
    { left: '155px', top: '1px' },    // Quiver
];

const PlayerEquipment: React.FC<PlayerEquipmentProps> = ({ equipment }) => {
    return (
        <div
            style={{
                position: 'relative',
                width: '239px',
                height: '270px',
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: 'cover',
                border: '3px solid grey',
                marginRight: '10px',
                marginBottom: '5px',
                pointerEvents: 'auto',
            }}
        >
            {equipment.map((itemIdStr, index) => {
                const itemId = parseInt(itemIdStr, 10);
                if (itemId < 0 && itemId !== -2) {
                    return null; // Do not display anything if no equipment in this slot
                }
                const position = equipmentSlotPositions[index];
                const slotStyle = {
                    position: 'absolute' as const,
                    left: position.left,
                    top: position.top,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '54px',
                    height: '50px',
                };

                if (itemId === -2) {
                    return (
                        <div key={index} style={slotStyle} title="Unknown">
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    userSelect: 'none',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <span style={{ color: 'white', fontSize: '12px' }}>Unknown</span>
                            </div>
                        </div>
                    );
                } else {
                    const itemImageUrl = getItemImageUrl(itemId);
                    const itemName = itemIdMap[itemId] || `Item_${itemId}`;
                    const wikiLink = `https://oldschool.runescape.wiki/w/${encodeURIComponent(itemName.replace(/ /g, '_'))}`;

                    return (
                        <div
                            key={index}
                            style={{
                                ...slotStyle,
                            }}
                            onClick={() => window.open(wikiLink, '_blank', 'noopener,noreferrer')}
                            title={itemName}
                        >
                            <img
                                src={blankEquipmentBackground}
                                alt={`Equipment Slot Background ${index}`}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 1
                                }}
                            />
                            {/* Item image */}
                            <img
                                src={itemImageUrl}
                                alt={itemName}
                                style={{
                                    position: 'absolute',
                                    transform: 'scale(1.4)',
                                    zIndex: 2
                                }}
                            />
                        </div>
                    );
                }
            })}
        </div>
    );
};

export default PlayerEquipment;
