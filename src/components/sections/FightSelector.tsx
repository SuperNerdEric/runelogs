import React, {useEffect, useState} from 'react';
import {FightMetaData} from "../../models/Fight";
import {formatHHmmss} from "../../utils/utils";
import {isFightGroupMetadata} from "../../models/FightGroup";
import { EncounterMetaData } from '../../models/LogLine';

interface FightProps {
    fight: FightMetaData;
    index: number;
    title: string;
    onSelectFight: (index: number) => void;
    onSelectFightAggregate?: (indices: number[]) => void;
    isShortest: boolean;
}

const Fight: React.FC<FightProps> = ({fight, index, title, onSelectFight, isShortest}) => {
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
    const fightLengthMs = (fight.fightDurationTicks ?? 0) * 600;
    const formattedDuration = formatHHmmss(fightLengthMs, false);

    return (
        <div className="fight-container" onClick={handleClick}>
            <div className="fight-title">
                <div style={{color: nameColor}}>{`${title} (${formattedDuration})`}</div>
            </div>
            <div>{formattedTime}</div>
            {isShortest && (
                <div className="gold-star">&#9733;</div>
            )}
        </div>
    );
};

interface FightGroupProps {
    fight: FightMetaData;
    index: number;
    fightGroupIndex: number;
    fightName: string;
    onSelectFight: (index: number, fightGroupIndex: number) => void;
    isShortest: boolean;
}

/**
 * A fight group is a collection of fights such as a Raid (CoX, ToB, ToA) or a Wave based fight (Inferno, Colosseum).
 */
const FightGroup: React.FC<FightGroupProps> = ({fight, index, fightGroupIndex, fightName, onSelectFight}) => {
    const time = new Date(`2000-01-01T${fight.time}`);

    const formattedTime = time.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });

    const nameColor = fight.success ? 'rgb(128, 230, 102)' : 'rgb(230, 128, 102)';

    const handleClick = () => {
        onSelectFight(index, fightGroupIndex);
    };
    const fightLengthMs = (fight.fightDurationTicks ?? 0) * 600;
    const formattedDuration = formatHHmmss(fightLengthMs, false);

    return (
        <div className="fight-group-container" onClick={handleClick}>
            <div className="fight-title">
                <div style={{color: nameColor}}>{`${fightName} (${formattedDuration})`}</div>
            </div>
            <div>{formattedTime}</div>
        </div>
    );
};

interface FightSelectorProps {
    fights: (EncounterMetaData)[];
    onSelectFight: (index: number, fightGroupIndex?: number) => void;
    onSelectAggregateFight?: (indices: number[]) => void;
}

interface BannerProps {
    name: string;
    onClick?: () => void;
}

const Banner: React.FC<BannerProps> = ({ name, onClick }) => {
    return (
        <div className="banner" onClick={onClick}>
            <p>{name}</p>
        </div>
    );
};

type FightGroupMap = {
    [name: string]: {
        isRaid: boolean;
        fights: {
            fight: FightMetaData,
            index: number,
            fightGroupIndex?: number
        }[];
    }
}

const FightSelector: React.FC<FightSelectorProps> = ({ fights, onSelectFight, onSelectAggregateFight }) => {
    // Group fights by name and record shortest fight time for each group
    const [groupedFights, setGroupedFights] = useState<FightGroupMap>({});

    useEffect(() => {
        const tempGroupedFights: FightGroupMap = {};

        fights.forEach((fight, index) => {
            if (isFightGroupMetadata(fight)) {
                tempGroupedFights[fight.name] = {isRaid: true, fights: fight.fights.map((f, i) => ({fight: f, index: index, fightGroupIndex: i}))};
            } else {
                if (!tempGroupedFights[fight.name]) {
                    tempGroupedFights[fight.name] = {isRaid: false, fights: []};
                }
                tempGroupedFights[fight.name].fights.push({fight, index});
            }
        });

        setGroupedFights(tempGroupedFights);
    }, [fights]);

    return (
        <div style={{marginTop: '20px'}}>
            {Object.keys(groupedFights).map(name => {
                const fightGroup = groupedFights[name];

                if (fightGroup.isRaid) {
                    return (
                        <div className="damage-done-container" key={name}>
                            <Banner name={name}/>
                            <div className="fight-list">
                                {fightGroup.fights.map((fight, index) => (
                                    <FightGroup
                                        key={index}
                                        fight={fight.fight}
                                        index={fight.index}
                                        fightGroupIndex={fight.fightGroupIndex!}
                                        fightName={fight.fight.name}
                                        onSelectFight={onSelectFight}
                                        isShortest={false}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                } else {
                    let shortestTime: number;

                    fightGroup.fights.forEach(fight => {
                        if (fight.fight.success) {
                            if (!shortestTime || fight.fight.fightDurationTicks < shortestTime) {
                                shortestTime = fight.fight.fightDurationTicks;
                            }
                        }
                    })

                    const handleBannerClick = () => {
                        if (onSelectAggregateFight) {
                            onSelectAggregateFight(fightGroup.fights.map(fight => fight.index));
                        }
                    };


                    return (
                        <div className="damage-done-container" key={name}>
                            <Banner name={name} onClick={handleBannerClick} />
                            <div className="fight-list">
                                {fightGroup.fights.map((fight, index) => (
                                    <Fight
                                        key={index}
                                        fight={fight.fight}
                                        index={fight.index}
                                        title={(index + 1).toString()}
                                        onSelectFight={onSelectFight}
                                        isShortest={fight.fight.fightDurationTicks === shortestTime}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                }

            })}
        </div>
    );
};

export default FightSelector;
