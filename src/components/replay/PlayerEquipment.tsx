import React from 'react';
import backgroundImageUrl from '../../assets/WornEquipment.png';
import blankEquipmentBackground from '../../assets/BlankEquipmentBackground.png';
import { itemIdMap } from "../../lib/itemIdMap";

interface PlayerEquipmentProps {
    equipment: string[];
}

const getItemImageUrl = (itemId: number): string => {
    return `https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemId}.png`;
};

const equipmentSlotPositions = [
    { left: '78px', top: '1px' },   // Head
    { left: '16px', top: '54px' },  // Cape
    { left: '78px', top: '54px' },  // Neck
    { left: '-6px', top: '108px' },   // Mainhand
    { left: '78px', top: '108px' },  // Chest
    { left: '162px', top: '108px' },  // Offhand
    { left: '-6px', top: '272px' },   // ??
    { left: '78px', top: '162px' },  // Legs
    { left: '78px', top: '272px' },      // ??
    { left: '-6px', top: '217px' },   // Gloves
    { left: '78px', top: '217px' },  // Boots
    { left: '162px', top: '272px' },      // ??
    { left: '162px', top: '217px' },  // Ring
    { left: '139px', top: '54px' },  // Ammo
    { left: '139px', top: '1px' },    // Quiver
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
                border: '4px solid grey',
                marginRight: '10px',
                marginBottom: '5px',
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
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                };

                if (itemId === -2) {
                    return (
                        <div key={index} style={slotStyle} title="Unknown">
                            <div
                                style={{
                                    position: 'absolute',
                                    userSelect: 'none',
                                    top: '7px',
                                    left: '24px',
                                    width: '38px',
                                    height: '35px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transform: 'scale(1.35)',
                                }}
                            >
                                <span style={{ color: 'white', fontSize: '8px' }}>Unknown</span>
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
                                cursor: 'pointer',
                            }}
                            onClick={() => window.open(wikiLink, '_blank', 'noopener,noreferrer')}
                            title={itemName}
                        >
                            <img
                                src={blankEquipmentBackground}
                                alt={`Equipment Slot Background ${index}`}
                                style={{
                                    position: 'absolute',
                                    width: '54px',
                                    height: '50px',
                                }}
                            />
                            {/* Item image */}
                            <img
                                src={itemImageUrl}
                                alt={itemName}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '30px',
                                    transform: 'scale(1.35)',
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
