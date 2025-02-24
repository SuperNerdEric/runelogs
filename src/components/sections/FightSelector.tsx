import React, {useEffect, useState} from 'react';
import {FightMetaData} from "../../models/Fight";
import {formatHHmmss} from "../../utils/utils";
import {isRaidMetaData} from "../../models/Raid";
import { isWaveMetaData, WaveMetaData, WavesMetaData } from '../../models/Waves';
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
    const formattedDuration = formatHHmmss(fight.fightLengthMs, false);

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

interface WaveProps {
    wave: WaveMetaData;
    index: number;
    waveIndex: number;
    onSelectFight: (index: number, waveIndex: number, fightIndex: number) => void;
    isShortest: boolean;
}


const Wave: React.FC<WaveProps> = ({wave, index, waveIndex, onSelectFight}) => {
    const nameColor = wave.success ? 'rgb(128, 230, 102)' : 'rgb(230, 128, 102)';
    const handleClick = (fightIndex: number) => {
        onSelectFight(index, waveIndex, fightIndex);
        
    };
    return (
        <div className="damage-done-container">
            <div className="fight-title">
                <p style={{color: nameColor}}>{wave.name}</p>
            </div>
            <div className="fight-list">
                {wave.fights.map((fight, index) => {
                    return <Fight fight={fight} index={index} title={fight.name} onSelectFight={handleClick} isShortest={false} />;
                })}
            </div>
        </div>
    );
};

interface FightSelectorProps {
    fights: (EncounterMetaData)[];
    onSelectFight: (index: number, raidIndex?: number) => void;
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

type FightGroup = {
    [name: string]: {
        isRaid: boolean;
        wavesMetaData: WavesMetaData | null;
        fights: {
            fight: FightMetaData,
            index: number,
            raidIndex?: number
        }[];
        waves: {
            wave: WaveMetaData,
            index: number,
            waveIndex?: number
        }[];
    }
}

const FightSelector: React.FC<FightSelectorProps> = ({ fights, onSelectFight, onSelectAggregateFight }) => {
    // Group fights by name and record shortest fight time for each group
    const [groupedFights, setGroupedFights] = useState<FightGroup>({});

    useEffect(() => {
        const tempGroupedFights: FightGroup = {};

        fights.forEach((fight, index) => {
            if (isRaidMetaData(fight)) {
                tempGroupedFights[fight.name] = {isRaid: true, wavesMetaData: null, fights: fight.fights.map((f, i) => ({fight: f, index: index, raidIndex: i})), waves: []};
            } else if (isWaveMetaData(fight)) {
                tempGroupedFights[fight.name] = {isRaid: false, wavesMetaData: fight, fights: [], waves: fight.waves.map((f, i) => ({wave: f, index: index, waveIndex: i}))};
            } else {
                if (!tempGroupedFights[fight.name]) {
                    tempGroupedFights[fight.name] = {isRaid: false, wavesMetaData: null, fights: [], waves: []};
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
                } else if (fightGroup.wavesMetaData) {
                    return (
                        <div className="damage-done-container" key={name}>
                            <Banner name={name}/>
                            <div className="fight-list">
                                {fightGroup.waves.map((wave, index) => (
                                    <Wave
                                        key={index}
                                        wave={wave.wave}
                                        index={wave.index}
                                        waveIndex={wave.waveIndex!}
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
                            if (!shortestTime || fight.fight.fightLengthMs < shortestTime) {
                                shortestTime = fight.fight.fightLengthMs;
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
                                        isShortest={fight.fight.fightLengthMs === shortestTime}
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
