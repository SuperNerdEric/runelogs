import {Fight} from "../models/Fight";
import {LogTypes} from "../models/LogLine";
import {weaponMap} from "../models/WeaponMap";
import {
    COX_MONSTERS,
    MAGE_ANIMATION,
    MELEE_ANIMATIONS,
    RANGED_ANIMATIONS,
    SECONDS_PER_TICK,
    TOA_MONSTERS
} from "../models/Constants";
import {CombatClass, Weapon} from "../models/Weapon";
import {Levels} from "../models/Levels";

export interface FightPerformance {
    activeTime: number;
    activeTicks: number;
    actualWeaponHits: number;
    boostedHits: number;
    expectedWeaponHits: number;
    hasBoostedLevels: boolean;
}

/**
 * Calculates the boosted hit weight based on the weapon combat class
 * 0 means they had no active boost
 * 1 means they are boosted fully with the best possible boosted (e.g. 99 -> 118 with super combat)
 * Interpolated between
 */
function getBoostedHitWeight(fight: Fight, combatClass: CombatClass, weapon: Weapon, boosts: Levels): number {
    let boostedHitWeight = 0;

    const baseLevels = 99; // todo assuming user is max right now

    let meleeBoost = 19;
    let rangedBoost = 13;
    let magicBoost = 13;

    // todo maybe make it so user can select if they want to use salts / overloads
    let toa = fight.enemyNames.some(enemy => TOA_MONSTERS.includes(enemy));
    let cox = fight.enemyNames.some(enemy => COX_MONSTERS.includes(enemy));

    if (toa) {
        meleeBoost = 26;
        rangedBoost = 26;
        magicBoost = 26;
    } else if (cox) {
        meleeBoost = 21
        rangedBoost = 21;
        magicBoost = 21;
    }

    if (combatClass === CombatClass.Ranged) {
        boostedHitWeight = (boosts.ranged - baseLevels) / rangedBoost
    } else if (combatClass === CombatClass.Magic) {
        boostedHitWeight = (boosts.magic - baseLevels) / magicBoost
    } else if (combatClass === CombatClass.Melee) {
        const levelsBoostedAttack = boosts.attack - baseLevels;
        const levelsBoostedStrength = boosts.strength - baseLevels;
        boostedHitWeight = ((levelsBoostedAttack + levelsBoostedStrength) / 2) / meleeBoost;
    }

    return boostedHitWeight;
}

function getWeaponHitsForDuration(durationSeconds: number, currentWeaponSpeed: number, previousWeaponSpeed: number) {
    let timeTaken = 0;
    let newWeaponHits = 0;
    if (previousWeaponSpeed > 0) {
        // Because your next weapon does a single hit at the old weapon speed
        const oneMoreHitTime = previousWeaponSpeed * SECONDS_PER_TICK;
        durationSeconds -= oneMoreHitTime;
        timeTaken += oneMoreHitTime * 1000; // Turn to ms
        newWeaponHits += 1;
    }
    const remainingHits = Math.floor(durationSeconds / (SECONDS_PER_TICK * currentWeaponSpeed));
    timeTaken += remainingHits * currentWeaponSpeed * SECONDS_PER_TICK * 1000

    newWeaponHits += remainingHits;
    return {newWeaponHits, timeTaken};
}

/**
 * Calculates the maximum number of expected weapon hits, taking weapon speed into account.
 * Assumes ranged weapons are on the rapid style.
 */
export function getFightPerformanceByPlayer(fight: Fight): Map<string, FightPerformance> {
    const performanceByPlayer = new Map<string, FightPerformance>();

    const stateByPlayer = new Map<string, {
        activeTime: number;
        actualWeaponHits: number;
        boostedHits: number;
        expectedWeaponHits: number;
        expectedLastTimestamp: number;
        previousWeaponSpeed: number;
        currentWeaponSpeed: number;
        currentWeapon: Weapon | undefined;
        lastBoost: Levels | undefined;
        hasBoostedLevels: boolean;
    }>();

    const fightEndMs = fight.lastLine.fightTimeMs!;

    for (const log of fight.data) {
        const playerName = log.source?.name;
        if (!playerName || !fight.players.includes(playerName)) {
            continue;
        }

        if (log.type === LogTypes.PLAYER_EQUIPMENT || log.type === LogTypes.BOOSTED_LEVELS) {
            if (!stateByPlayer.has(playerName)) {
                stateByPlayer.set(playerName, {
                    activeTime: 0,
                    actualWeaponHits: 0,
                    boostedHits: 0,
                    expectedWeaponHits: 1,
                    expectedLastTimestamp: fight.firstLine.fightTimeMs || 0,
                    previousWeaponSpeed: 0,
                    currentWeaponSpeed: 0,
                    currentWeapon: undefined,
                    lastBoost: undefined,
                    hasBoostedLevels: false
                });
                performanceByPlayer.set(playerName, {
                    activeTime: 0,
                    activeTicks: 0,
                    actualWeaponHits: 0,
                    boostedHits: 0,
                    expectedWeaponHits: 1, // start with 1 initial expected hit
                    hasBoostedLevels: false
                });
            }
        }

        const state = stateByPlayer.get(playerName);

        if (!state) {
            continue;
        }

        if (log.type === LogTypes.BOOSTED_LEVELS) {
            state.lastBoost = log.boostedLevels;
            state.hasBoostedLevels = true;
        }


        if (log.type === LogTypes.PLAYER_EQUIPMENT && log.playerEquipment) {
            for (const itemId of log.playerEquipment) {
                const weapon = weaponMap[parseInt(itemId)];
                console.log("Weapon", weapon);
                if (!weapon) continue;

                if (state.currentWeaponSpeed) {
                    const durationSeconds = (log.fightTimeMs! - state.expectedLastTimestamp) / 1000;
                    const {
                        newWeaponHits,
                        timeTaken
                    } = getWeaponHitsForDuration(durationSeconds, state.currentWeaponSpeed, state.previousWeaponSpeed);
                    state.expectedWeaponHits += newWeaponHits;
                    state.expectedLastTimestamp += timeTaken;
                }

                state.previousWeaponSpeed = state.currentWeaponSpeed;
                state.currentWeaponSpeed = weapon.speed;
                state.currentWeapon = weapon;
            }
        }

        if (log.type === LogTypes.BOOSTED_LEVELS) {
            state.lastBoost = log.boostedLevels;
        }

        if (log.type === LogTypes.PLAYER_ATTACK_ANIMATION) {
            state.actualWeaponHits += 1;

            let combatClass: CombatClass;
            if (MELEE_ANIMATIONS.includes(log.animationId)) {
                combatClass = CombatClass.Melee;
            } else if (RANGED_ANIMATIONS.includes(log.animationId)) {
                combatClass = CombatClass.Ranged;
            } else if (MAGE_ANIMATION.includes(log.animationId)) {
                combatClass = CombatClass.Magic;
            } else {
                console.warn(`Unknown animation ID: ${log.animationId} for player: ${playerName}`);
                combatClass = CombatClass.Melee; // Fallback to Melee
            }

            if (state.currentWeapon && state.lastBoost) {
                state.boostedHits += getBoostedHitWeight(fight, combatClass, state.currentWeapon, state.lastBoost);
            }

            let weaponSpeedSeconds = state.currentWeaponSpeed * SECONDS_PER_TICK;

            // Don't count active time past the end of the fight
            // If you sit idle for 3 ticks and then 1 hit the monster with a 5 tick weapon that shouldn't be 100%
            if (log.fightTimeMs! + weaponSpeedSeconds * 1000 > fightEndMs) {
                weaponSpeedSeconds = (fightEndMs - log.fightTimeMs!) / 1000;
            }
            state.activeTime += weaponSpeedSeconds;
        }
    }

    console.log("State by player:", stateByPlayer);

    // Finalize expected hits after the last event
    for (const [playerName, state] of stateByPlayer.entries()) {
        const durationSeconds = (fightEndMs - state.expectedLastTimestamp) / 1000;
        const {newWeaponHits} = getWeaponHitsForDuration(durationSeconds, state.currentWeaponSpeed, state.previousWeaponSpeed);
        state.expectedWeaponHits += newWeaponHits;

        performanceByPlayer.set(playerName, {
            activeTime: state.activeTime,
            activeTicks: state.activeTime / SECONDS_PER_TICK,
            actualWeaponHits: state.actualWeaponHits,
            boostedHits: state.boostedHits,
            expectedWeaponHits: state.expectedWeaponHits,
            hasBoostedLevels: state.hasBoostedLevels
        });
    }

    return performanceByPlayer;
}

interface PerformanceProps {
    metricName: "Activity" | "Boosted Hits";
    fight: Fight;
    performance: FightPerformance;
}

export function getPercentColor(percentage: number) {
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
