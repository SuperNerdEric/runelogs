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

// Equipment slot positions (adjust as needed)
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
                marginBottom: '50px',
            }}
        >
            {equipment.map((itemIdStr, index) => {
                const itemId = parseInt(itemIdStr, 10);
                if (itemId < 0) {
                    return null; // Do not display anything if no equipment in this slot
                }
                const position = equipmentSlotPositions[index];
                const itemImageUrl = getItemImageUrl(itemId);
                const itemName = itemIdMap[itemId] || `Item_${itemId}`;
                const wikiLink = `https://oldschool.runescape.wiki/w/${encodeURIComponent(itemName.replace(/ /g, '_'))}`;

                return (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            left: position.left,
                            top: position.top,
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                        }}
                        onClick={() => window.open(wikiLink, '_blank', 'noopener,noreferrer')}
                        title={itemName}
                    >
                        {/* Background image behind the item */}
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
                                scale: '1.35',
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PlayerEquipment;
