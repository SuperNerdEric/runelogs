import React from 'react';

import AttackImage from '../../assets/levels/Attack.png';
import StrengthImage from '../../assets/levels/Strength.png';
import DefenceImage from '../../assets/levels/Defence.png';
import RangedImage from '../../assets/levels/Ranged.png';
import MagicImage from '../../assets/levels/Magic.png';
import HitpointsImage from '../../assets/levels/Hitpoints.png';
import PrayerImage from '../../assets/levels/Prayer.png';
import { Levels } from '../../models/Levels';

interface CombatLevelsProps {
    baseLevels: Levels;
    boostedLevels: Levels;
}

const skillImages: { [key in keyof Levels]: string } = {
    attack: AttackImage,
    strength: StrengthImage,
    defence: DefenceImage,
    ranged: RangedImage,
    magic: MagicImage,
    hitpoints: HitpointsImage,
    prayer: PrayerImage,
};

const skillRows: (keyof Levels)[][] = [
    ['hitpoints', 'prayer'],            // First row
    ['attack', 'strength', 'defence'],  // Second row
    ['ranged', 'magic'],                // Third row
];


const CombatLevels: React.FC<CombatLevelsProps> = ({ baseLevels, boostedLevels }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'grey',
                width: '239px',
                border: '4px solid grey',
                marginRight: '10px',
                marginBottom: '5px',
            }}
        >
            {skillRows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    style={{
                        display: 'flex',
                    }}
                >
                    {row.map((skill) => (
                        <div
                            key={skill}
                            style={{
                                position: 'relative',
                            }}
                        >
                            {/* Skill Image */}
                            <img
                                src={skillImages[skill]}
                                alt={skill}
                                style={{
                                    width: '80px',
                                    height: '40px',
                                    display: 'block',
                                    margin: '0px',
                                }}
                            />
                            {/* Boosted/Base Level Text */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    left: '0',
                                    right: '19px',
                                    textAlign: 'right',
                                    color: 'yellow',
                                    fontSize: '15px',
                                }}
                            >
                                {boostedLevels[skill]}
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    left: '0',
                                    right: '5px',
                                    textAlign: 'right',
                                    color: 'yellow',
                                    fontSize: '15px',
                                }}
                            >
                                {baseLevels[skill]}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default CombatLevels;
