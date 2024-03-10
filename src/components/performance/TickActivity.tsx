import React, {useEffect, useState} from 'react';
import {Fight} from "../../models/Fight";
import {LogTypes} from "../../models/LogLine";
import {weaponMap} from "../../models/WeaponMap";
import {COX_MONSTERS, SECONDS_PER_TICK, TOA_MONSTERS} from "../../models/Constants";
import {CombatClass, Weapon} from "../../models/Weapon";
import {BoostedLevels} from "../../models/BoostedLevels";
import {Tooltip} from '@mui/material';

interface TickActivityProps {
    selectedLogs: Fight;
}

export interface FightPerformance {
    activeTime: number;
    actualWeaponHits: number;
    boostedHits: number;
    expectedWeaponHits: number;
}

/**
 * Calculates the boosted hit weight based on the weapon combat class
 * 0 means they had no active boost
 * 1 means they are boosted fully with the best possible boosted (e.g. 99 -> 118 with super combat)
 * Interpolated between
 */
function getBoostedHitWeight(fight: Fight, weapon: Weapon, boosts: BoostedLevels): number {
    let boostedHitWeight = 0;

    const baseLevels = 99; // todo assuming user is max right now

    let meleeBoost = 19;
    let rangedBoost = 13;
    let magicBoost = 13;

    // todo maybe make it so user can select if they want to use salts / overloads
    let toa = fight.enemies.some(enemy => TOA_MONSTERS.includes(enemy));
    let cox = fight.enemies.some(enemy => COX_MONSTERS.includes(enemy));

    if (toa) {
        meleeBoost = 26;
        rangedBoost = 26;
        magicBoost = 26;
    } else if (cox) {
        meleeBoost = 21
        rangedBoost = 21;
        magicBoost = 21;
    }

    if (weapon.combatClass === CombatClass.Ranged) {
        boostedHitWeight = (boosts.ranged - baseLevels) / rangedBoost
    } else if (weapon.combatClass === CombatClass.Magic) {
        boostedHitWeight = (boosts.magic - baseLevels) / magicBoost
    } else if (weapon.combatClass === CombatClass.Melee) {
        const levelsBoostedAttack = boosts.attack - baseLevels;
        const levelsBoostedStrength = boosts.strength - baseLevels;
        boostedHitWeight = ((levelsBoostedAttack + levelsBoostedStrength) / 2) / meleeBoost
    }

    return boostedHitWeight;
}

function getWeaponHitsForDuration(durationSeconds: number, currentWeaponSpeed: number, previousWeaponSpeed: number) {
    let timeTaken = 0;
    let newWeaponHits = 0;
    if (previousWeaponSpeed > 0) {
        // Because your next weapon does a single hit at the old weapon speed
        const oneMoreHitTime = previousWeaponSpeed * SECONDS_PER_TICK;
        console.debug(`1 expected hit from last weapon at ${previousWeaponSpeed} speed over ${oneMoreHitTime} seconds`);
        durationSeconds -= oneMoreHitTime;
        timeTaken += oneMoreHitTime * 1000; // Turn to ms
        newWeaponHits += 1;
    }
    const remainingHits = Math.floor(durationSeconds / (SECONDS_PER_TICK * currentWeaponSpeed));
    console.debug(`${remainingHits} expected hits at ${currentWeaponSpeed} speed over ${durationSeconds} seconds`);
    timeTaken += remainingHits * currentWeaponSpeed * SECONDS_PER_TICK * 1000

    newWeaponHits += remainingHits;
    return {newWeaponHits, timeTaken};
}

/**
 * Calculates the maximum number of expected weapon hits, taking weapon speed into account.
 * Assumes ranged weapons are on the rapid style.
 */
export function getFightPerformance(fight: Fight): FightPerformance {
    let expectedWeaponHits = 1; // You get a first hit immediately no matter the weapon speed
    let actualWeaponHits = 0;
    let boostedHits = 0;

    let expectedLastTimestamp = 0;
    let previousWeaponSpeed = 0; // Because your next weapon does a single hit at the old weapon speed
    let currentWeaponSpeed = 0;
    let currentWeapon: Weapon;
    let activeTime = 0;
    let lastBoost: BoostedLevels;

    fight.data.forEach(log => {
        if (log.type === LogTypes.PLAYER_EQUIPMENT) {
            log.playerEquipment.forEach(itemId => {
                const weapon = weaponMap[parseInt(itemId)];
                if (weapon) {
                    // We swapped weapons, see how many hits we should have gotten with the last weapon
                    if (currentWeaponSpeed) {
                        const durationSeconds = (log.fightTimeMs! - expectedLastTimestamp) / 1000;
                        const {
                            newWeaponHits,
                            timeTaken
                        } = getWeaponHitsForDuration(durationSeconds, currentWeaponSpeed, previousWeaponSpeed);
                        expectedWeaponHits += newWeaponHits;

                        // Should end up close to log.fightTimeMs but not always the same, because log.fightTimeMs is just when we swapped weapons, not when we actually hit last
                        expectedLastTimestamp += timeTaken;
                    }

                    previousWeaponSpeed = currentWeaponSpeed;
                    currentWeaponSpeed = weapon.speed;
                    currentWeapon = weapon;
                }
            });
        }
        if (log.type === LogTypes.BOOSTED_LEVELS) {
            lastBoost = log.boostedLevels;
        }
        if (log.type === LogTypes.PLAYER_ATTACK_ANIMATION || log.type === LogTypes.BLOWPIPE_ANIMATION) {
            actualWeaponHits += 1;
            boostedHits += getBoostedHitWeight(fight, currentWeapon, lastBoost);

            let weaponSpeedSeconds = currentWeaponSpeed * SECONDS_PER_TICK;

            // Don't count active time past the end of the fight
            // If you sit idle for 3 ticks and then 1 hit the monster with a 5 tick weapon that shouldn't be 100%
            if (log.fightTimeMs! + weaponSpeedSeconds * 1000 > fight.lastLine.fightTimeMs!) {
                weaponSpeedSeconds = (fight.lastLine.fightTimeMs! - log.fightTimeMs!) / 1000;
            }
            activeTime += weaponSpeedSeconds;
        }
    });

    // Rest of the fight after the last hit
    const durationSeconds = (fight.lastLine.fightTimeMs! - expectedLastTimestamp) / 1000;
    const {newWeaponHits} = getWeaponHitsForDuration(durationSeconds, currentWeaponSpeed, previousWeaponSpeed);
    expectedWeaponHits += newWeaponHits;

    return {activeTime, actualWeaponHits, boostedHits, expectedWeaponHits};
}

interface PerformanceProps {
    metricName: "Activity" | "Boosted Hits";
    fight: Fight;
    performance: FightPerformance;
}

function getPercentColor(percentage: number) {
    let percentColor;

    if (percentage >= 100) {
        percentColor = "#e5cc80";
    } else if (percentage < 100 && percentage >= 99) {
        percentColor = "#f48cba";
    } else if (percentage < 99 && percentage >= 95) {
        percentColor = "#ff8000";
    } else if (percentage < 95 && percentage >= 75) {
        percentColor = "#a335ee";
    } else if (percentage < 90 && percentage >= 75) {
        percentColor = "#0070dd";
    } else if (percentage < 75 && percentage >= 60) {
        percentColor = "#1eff00";
    } else if (percentage < 60) {
        percentColor = "#9d9d9d";
    }
    return percentColor;
}

const Performance: React.FC<PerformanceProps> = ({metricName, fight, performance}) => {
    let percentage: number = 0;

    if (metricName === "Activity") {
        percentage = (performance.activeTime / (fight.metaData.fightLengthMs / 1000)) * 100;
    } else if (metricName === "Boosted Hits") {
        percentage = performance.boostedHits / performance.actualWeaponHits * 100;
    }

    if (percentage > 100) {
        console.warn(`Past 100% performance for ${metricName} ${percentage}`);
        percentage = 100;
    } else if (percentage < 0) {
        console.warn(`Under 0% performance for ${metricName} ${percentage}`);
        percentage = 0;
    }

    // Round to the nearest 0.01
    const roundedPercentage = Math.round(percentage * 100) / 100;
    let percentColor = getPercentColor(roundedPercentage);
    const formattedPercentage = roundedPercentage % 1 === 0 ? roundedPercentage.toFixed(0) : roundedPercentage.toFixed(2);

    const tooltipContent = metricName === "Activity" ? (
        <div>
            <div>Active Time: {performance.activeTime.toFixed(3)} seconds</div>
            <div>Actual Hits: {performance.actualWeaponHits}</div>
            <div>Expected Hits: {performance.expectedWeaponHits}</div>
        </div>
    ) : null;

    return (
        <div className="performance-container">
            <div className="fight-title">
                <div>{metricName}</div>
            </div>
            {tooltipContent && (
                <Tooltip title={tooltipContent} arrow>
                    <div className="performance-percent" style={{color: percentColor}}>{formattedPercentage}%</div>
                </Tooltip>
            )}
            {!tooltipContent && (
                <div className="performance-percent" style={{color: percentColor}}>{formattedPercentage}%</div>
            )}
        </div>
    );
};

const TickActivity: React.FC<TickActivityProps> = ({selectedLogs}) => {
    const [fightPerformance, setFightPerformance] = useState<FightPerformance>();

    useEffect(() => {
        const hits = getFightPerformance(selectedLogs);
        setFightPerformance(hits);
    }, [selectedLogs]);

    return (
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
            {fightPerformance &&
                <Performance metricName="Activity" fight={selectedLogs} performance={fightPerformance}/>}
            {fightPerformance &&
                <Performance metricName="Boosted Hits" fight={selectedLogs} performance={fightPerformance}/>}
        </div>
    );
};

export default TickActivity;
