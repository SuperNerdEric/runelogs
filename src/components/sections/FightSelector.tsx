import React, {useEffect, useState} from 'react';
import {FightMetaData} from "../../models/Fight";
import {formatHHmmss} from "../../utils/utils";
import {isRaidMetaData, RaidMetaData} from "../../models/Raid";

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

interface RaidFightProps {
    fight: FightMetaData;
    index: number;
    raidIndex: number;
    fightName: string;
    onSelectFight: (index: number, raidIndex: number) => void;
    isShortest: boolean;
}

const RaidFight: React.FC<RaidFightProps> = ({fight, index, raidIndex, fightName, onSelectFight}) => {
    const time = new Date(`2000-01-01T${fight.time}`);

    const formattedTime = time.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });

    const nameColor = fight.success ? 'rgb(128, 230, 102)' : 'rgb(230, 128, 102)';

    const handleClick = () => {
        onSelectFight(index, raidIndex);
    };
    const formattedDuration = formatHHmmss(fight.fightLengthMs, false);

    return (
        <div className="raid-fight-container" onClick={handleClick}>
            <div className="fight-title">
                <div style={{color: nameColor}}>{`${fightName} (${formattedDuration})`}</div>
            </div>
            <div>{formattedTime}</div>
        </div>
    );
};

interface FightSelectorProps {
    fights: (FightMetaData | RaidMetaData)[];
    onSelectFight: (index: number, raidIndex?: number) => void;
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
        [name: string]: { isRaid: boolean, fights: { fight: FightMetaData, index: number, raidIndex?: number }[]}
    }>({});

    useEffect(() => {
        const tempGroupedFights: { [name: string]: { isRaid: boolean, fights: { fight: FightMetaData, index: number }[]}} = {};

        fights.forEach((fight, index) => {
            if(!isRaidMetaData(fight)) {
                if (!tempGroupedFights[fight.name]) {
                    tempGroupedFights[fight.name] = {isRaid: false, fights: []};
                }
                tempGroupedFights[fight.name].fights.push({fight, index});
            } else {
                tempGroupedFights[fight.name] = {isRaid: true, fights: fight.fights.map((f, i) => ({fight: f, index: index, raidIndex: i}))};
            }
        });

        setGroupedFights(tempGroupedFights);
    }, [fights]);

    return (
        <div style={{marginTop: '20px'}}>
            {Object.keys(groupedFights).map(name => {
                const fightGroup = groupedFights[name];

                if(!fightGroup.isRaid) {
                    let shortestTime: number;

                    fightGroup.fights.forEach(fight => {
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
                                {fightGroup.fights.map((fight, index) => (
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
                } else {
                    return (
                        <div className="damage-done-container" key={name}>
                            <Banner name={name}/>
                            <div className="fight-list">
                                {fightGroup.fights.map((fight, index) => (
                                    <RaidFight
                                        key={index}
                                        fight={fight.fight}
                                        index={fight.index}
                                        raidIndex={fight.raidIndex!}
                                        fightName={fight.fight.name}
                                        onSelectFight={onSelectFight}
                                        isShortest={false}
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
