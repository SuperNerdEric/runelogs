import React, {useEffect, useState} from 'react';
import {FightMetaData} from "../../models/Fight";
import {formatHHmmss} from "../../utils/utils";

interface FightProps {
    fight: FightMetaData;
    index: number;
    fightNumber: number;
    onSelectFight: (index: number) => void;
    isShortest: boolean;
}

const Fight: React.FC<FightProps> = ({fight, index, fightNumber, onSelectFight, isShortest}) => {
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
    const formattedDuration = formatHHmmss(fight.fightLengthMs, false);

    return (
        <div className="fight-container" onClick={handleClick}>
            <div className="fight-title">
                <div style={{color: nameColor}}>{`${fightNumber} (${formattedDuration})`}</div>
            </div>
            <div>{formattedTime}</div>
            {isShortest && (
                <div className="gold-star">&#9733;</div>
            )}
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
    // Group fights by name and record shortest fight time for each group
    const [groupedFights, setGroupedFights] = useState<{
        [name: string]: { fight: FightMetaData, index: number }[]
    }>({});

    useEffect(() => {
        const tempGroupedFights: { [name: string]: { fight: FightMetaData, index: number }[] } = {};

        fights.forEach((fight, index) => {
            if (!tempGroupedFights[fight.name]) {
                tempGroupedFights[fight.name] = [];
            }
            tempGroupedFights[fight.name].push({fight, index});
        });

        setGroupedFights(tempGroupedFights);
    }, [fights]);

    return (
        <div style={{marginTop: '20px'}}>
            {Object.keys(groupedFights).map(name => {
                const fightsInGroup = groupedFights[name];

                let shortestTime: number;

                fightsInGroup.forEach(fight => {
                    if (fight.fight.success) {
                        if (!shortestTime || fight.fight.fightLengthMs < shortestTime) {
                            shortestTime = fight.fight.fightLengthMs;
                        }
                    }
                })

                return (
                    <div className="damage-done-container" key={name}>
                        <Banner name={name}/>
                        <div className="fight-list">
                            {fightsInGroup.map((fight, index) => (
                                <Fight
                                    key={index}
                                    fight={fight.fight}
                                    index={fight.index}
                                    fightNumber={index + 1}
                                    onSelectFight={onSelectFight}
                                    isShortest={fight.fight.fightLengthMs === shortestTime}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FightSelector;
