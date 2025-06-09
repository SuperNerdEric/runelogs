import React from 'react';
import prayersImage from '../../assets/Prayers.png';

import ThickSkin from '../../assets/prayers/active/ThickSkin.png';
import BurstOfStrength from '../../assets/prayers/active/BurstOfStrength.png';
import ClarityOfThought from '../../assets/prayers/active/ClarityOfThought.png';
import SharpEye from '../../assets/prayers/active/SharpEye.png';
import MysticWill from '../../assets/prayers/active/MysticWill.png';
import RockSkin from '../../assets/prayers/active/RockSkin.png';
import SuperhumanStrength from '../../assets/prayers/active/SuperhumanStrength.png';
import ImprovedReflexes from '../../assets/prayers/active/ImprovedReflexes.png';
import RapidRestore from '../../assets/prayers/active/RapidRestore.png';
import RapidHeal from '../../assets/prayers/active/RapidHeal.png';
import ProtectItem from '../../assets/prayers/active/ProtectItem.png';
import HawkEye from '../../assets/prayers/active/HawkEye.png';
import MysticLore from '../../assets/prayers/active/MysticLore.png';
import SteelSkin from '../../assets/prayers/active/SteelSkin.png';
import UltimateStrength from '../../assets/prayers/active/UltimateStrength.png';
import IncredibleReflexes from '../../assets/prayers/active/IncredibleReflexes.png';
import ProtectFromMagic from '../../assets/prayers/active/ProtectFromMagic.png';
import ProtectFromMissiles from '../../assets/prayers/active/ProtectFromMissiles.png';
import ProtectFromMelee from '../../assets/prayers/active/ProtectFromMelee.png';
import EagleEye from '../../assets/prayers/active/EagleEye.png';
import MysticMight from '../../assets/prayers/active/MysticMight.png';
import Retribution from '../../assets/prayers/active/Retribution.png';
import Redemption from '../../assets/prayers/active/Redemption.png';
import Smite from '../../assets/prayers/active/Smite.png';
import Chivalry from '../../assets/prayers/active/Chivalry.png';
import Piety from '../../assets/prayers/active/Piety.png';
import Preserve from '../../assets/prayers/active/Preserve.png';
import Rigour from '../../assets/prayers/active/Rigour.png';
import Augury from '../../assets/prayers/active/Augury.png';

interface PrayersProps {
    prayers?: string[];
    overhead?: string;
}

const Prayers: React.FC<PrayersProps> = ({prayers, overhead}) => {
    const prayerPositions: { [prayerId: number]: { left: string; top: string } } = {
        // First row
        4104: {left: `0px`, top: `6px`}, // THICK_SKIN
        4105: {left: `48px`, top: `6px`}, // BURST_OF_STRENGTH
        4106: {left: `96px`, top: `6px`}, // CLARITY_OF_THOUGHT
        4122: {left: `144px`, top: `6px`}, // SHARP_EYE
        4123: {left: `192px`, top: `6px`}, // MYSTIC_WILL

        // Second row
        4107: {left: `0px`, top: `50px`}, // ROCK_SKIN
        4108: {left: `48px`, top: `50px`}, // SUPERHUMAN_STRENGTH
        4109: {left: `96px`, top: `50px`}, // IMPROVED_REFLEXES
        4110: {left: `144px`, top: `50px`}, // RAPID_RESTORE
        4111: {left: `192px`, top: `50px`}, // RAPID_HEAL

        // Third row
        4112: {left: `0px`, top: `94px`}, // PROTECT_ITEM
        4124: {left: `48px`, top: `94px`}, // HAWK_EYE
        4125: {left: `96px`, top: `94px`}, // MYSTIC_LORE
        4113: {left: `144px`, top: `94px`}, // STEEL_SKIN
        4114: {left: `192px`, top: `94px`}, // ULTIMATE_STRENGTH

        // Fourth row
        4115: {left: `0px`, top: `138px`}, // INCREDIBLE_REFLEXES
        4116: {left: `48px`, top: `138px`}, // PROTECT_FROM_MAGIC
        4117: {left: `96px`, top: `138px`}, // PROTECT_FROM_MISSILES
        4118: {left: `144px`, top: `138px`}, // PROTECT_FROM_MELEE
        4126: {left: `192px`, top: `138px`}, // EAGLE_EYE

        // Fifth row
        4127: {left: `0px`, top: `182px`}, // MYSTIC_MIGHT
        4119: {left: `48px`, top: `182px`}, // RETRIBUTION
        4120: {left: `96px`, top: `182px`}, // REDEMPTION
        4121: {left: `144px`, top: `182px`}, // SMITE
        5466: {left: `192px`, top: `182px`}, // PRESERVE

        // Sixth row
        4128: {left: `0px`, top: `226px`}, // CHIVALRY
        4129: {left: `48px`, top: `226px`}, // PIETY
        5464: {left: `96px`, top: `226px`}, // RIGOUR
        5465: {left: `144px`, top: `226px`}, // AUGURY
    };

    // Map of prayer IDs to their active images
    const prayerImages: { [prayerId: number]: string } = {
        4104: ThickSkin,
        4105: BurstOfStrength,
        4106: ClarityOfThought,
        4122: SharpEye,
        4123: MysticWill,
        4107: RockSkin,
        4108: SuperhumanStrength,
        4109: ImprovedReflexes,
        4110: RapidRestore,
        4111: RapidHeal,
        4112: ProtectItem,
        4124: HawkEye,
        4125: MysticLore,
        4113: SteelSkin,
        4114: UltimateStrength,
        4115: IncredibleReflexes,
        4116: ProtectFromMagic,
        4117: ProtectFromMissiles,
        4118: ProtectFromMelee,
        4126: EagleEye,
        4127: MysticMight,
        4119: Retribution,
        4120: Redemption,
        4121: Smite,
        4128: Chivalry,
        4129: Piety,
        5466: Preserve,
        5464: Rigour,
        5465: Augury,
    };

    // Set of overhead prayer IDs
    const overheadPrayerIds = new Set<number>([
        4116, // ProtectFromMagic
        4117, // ProtectFromMissiles
        4118, // ProtectFromMelee
        4119, // Retribution
        4120, // Redemption
        4121, // Smite
    ]);

    // Determine active prayers
    let activePrayers = new Set<number>();
    if (prayers && prayers.length > 0) {
        activePrayers = new Set(prayers.map(prayerIdStr => parseInt(prayerIdStr, 10)));
        console.log(activePrayers);
    } else if (overhead) {
        const overheadId = parseInt(overhead, 10);
        console.log(overheadId);
        activePrayers.add(overheadId);
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '239px',
                height: '270px',
                backgroundImage: `url(${prayersImage})`,
                backgroundSize: 'cover',
                border: '3px solid grey',
                marginRight: '10px',
                marginBottom: '5px',
            }}
        >
            {Object.entries(prayerPositions).map(([prayerIdStr, position]) => {
                const prayerId = parseInt(prayerIdStr, 10);
                const isActive = activePrayers.has(prayerId);
                const prayerImage = prayerImages[prayerId];

                if (overhead && !overheadPrayerIds.has(prayerId)) {
                    return (
                        <div
                            key={prayerId}
                            style={{
                                position: 'absolute',
                                left: position.left,
                                top: position.top,
                                width: `48px`,
                                height: `44px`,
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                }}
                            />
                        </div>
                    );
                }

                if (!isActive || !prayerImage) {
                    return null;
                }

                return (
                    <div
                        key={prayerId}
                        style={{
                            position: 'absolute',
                            left: position.left,
                            top: position.top,
                            width: `46px`,
                            height: `43px`,
                        }}
                    >
                        <img
                            src={prayerImage}
                            alt={`Prayer ${prayerId}`}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default Prayers;
