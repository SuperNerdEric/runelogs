import React from 'react';

import AttackImage from '../../assets/levels/Attack.png';
import StrengthImage from '../../assets/levels/Strength.png';
import DefenceImage from '../../assets/levels/Defence.png';
import RangedImage from '../../assets/levels/Ranged.png';
import MagicImage from '../../assets/levels/Magic.png';
import HitpointsImage from '../../assets/levels/Hitpoints.png';
import PrayerImage from '../../assets/levels/Prayer.png';
import SailingImage from '../../assets/levels/Sailing.png';
import {Levels} from '../../models/Levels';

interface CombatLevelsProps {
    baseLevels: Levels;
    boostedLevels: Levels;
    height?: string;
    skillLayout?: (keyof Levels)[][];
    imageWidth?: number;
    imageHeight?: number;
}

const skillImages: { [key in keyof Levels]: string } = {
    attack: AttackImage,
    strength: StrengthImage,
    defence: DefenceImage,
    ranged: RangedImage,
    magic: MagicImage,
    hitpoints: HitpointsImage,
    prayer: PrayerImage,
    sailing: SailingImage,
};

const defaultLayout: (keyof Levels)[][] = [
    ['hitpoints', 'prayer'],
    ['attack', 'strength', 'defence'],
    ['ranged', 'magic', 'sailing'],
];

const CombatLevels: React.FC<CombatLevelsProps> = ({
                                                       baseLevels,
                                                       boostedLevels,
                                                       height = '270px',
                                                       skillLayout = defaultLayout,
                                                       imageWidth = 80,
                                                       imageHeight = 40,
                                                   }) => {

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgb(115, 101, 89)',
                width: '239px',
                height: height,
                border: '3px solid grey',
                marginRight: '10px',
                marginBottom: '5px',
            }}
        >
            {skillLayout.map((row, rowIndex) => (
                <div key={rowIndex} style={{display: 'flex'}}>
                    {row.filter((skill) => baseLevels[skill] !== undefined || boostedLevels[skill] !== undefined).map((skill) => (
                        <div key={skill} style={{position: 'relative'}}>
                            <img
                                src={skillImages[skill]}
                                alt={skill}
                                style={{
                                    width: `${imageWidth}px`,
                                    height: `${imageHeight}px`,
                                    display: 'block',
                                    margin: 0,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${imageHeight / 2}px`,
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
