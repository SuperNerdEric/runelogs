import React from 'react';
import {FightMetaData} from "../../models/Fight";
import {formatDurationToSeconds} from "../../utils/utils";

interface FightProps {
    fight: FightMetaData;
    index: number;
    fightNumber: number;
    onSelectFight: (index: number) => void;
}

const Fight: React.FC<FightProps> = ({fight, index, fightNumber, onSelectFight}) => {
    const time = new Date(`2000-01-01T${fight.time}`);

    const formattedTime = time.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });

    const nameColor = fight.success ? 'rgb(128, 230, 102)' : 'rgb(230, 128, 102)';

    const handleClick = () => {
        onSelectFight(index);
    };

    const formattedDuration = formatDurationToSeconds(fight.fightLength);

    return (
        <div className="fight-container" onClick={handleClick}>
            <div className="fight-title">
                <div style={{color: nameColor}}>{`${fightNumber} (${formattedDuration})`}</div>
            </div>
            <div>{formattedTime}</div>
        </div>
    );
};

interface FightSelectorProps {
    fights: FightMetaData[];
    onSelectFight: (index: number) => void;
}

interface BannerProps {
    name: string;
}

const Banner: React.FC<BannerProps> = ({name}) => {
    return (
        <div className="banner">
            <p>{name}</p>
        </div>
    );
};

const FightSelector: React.FC<FightSelectorProps> = ({fights, onSelectFight}) => {

    // Group fights by name
    const groupedFights: { [name: string]: { fight: FightMetaData, index: number }[] } = {};
    fights.forEach((fight, index) => {
        if (!groupedFights[fight.name]) {
            groupedFights[fight.name] = [];
        }
        groupedFights[fight.name].push({fight, index});
    });

    return (
        <div style={{marginTop: '20px'}}>
            {Object.keys(groupedFights).map(name => (
                <div className="damage-done-container" key={name}>
                    <Banner name={name}/>
                    <div className="fight-list">
                        {groupedFights[name].map((fight, index) => (
                            <Fight key={index} fight={fight.fight} index={fight.index} fightNumber={index + 1}
                                   onSelectFight={onSelectFight}/>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FightSelector;
