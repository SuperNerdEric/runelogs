import React from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";
import {BoostedLevels} from "../models/BoostedLevels";
import attackImage from '../assets/Attack.webp';
import strengthImage from '../assets/Strength.webp';
import defenceImage from '../assets/Defence.webp';
import hitpointsImage from '../assets/Hitpoints.webp';
import magicImage from '../assets/Magic.webp';
import rangedImage from '../assets/Ranged.webp';
import prayerImage from '../assets/Prayer.webp';
import {formatHHmmss} from "../utils/utils";
import {BOSS_NAMES} from "../utils/constants";
import {Actor} from "../models/Actor";

interface EventsTableProps {
    fight: Fight;
    height?: string;
    showSource?: boolean;
}

const statImages: Record<keyof BoostedLevels, string> = {
    attack: attackImage,
    defence: defenceImage,
    hitpoints: hitpointsImage,
    magic: magicImage,
    prayer: prayerImage,
    ranged: rangedImage,
    strength: strengthImage
};

const getItemImageUrl = (itemId: number): string => {
    return `https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemId}.png`;
};

const getActorName = (log: LogLine, key: 'source' | 'target'): string => {
    if (key in log) {
        // @ts-ignore https://github.com/microsoft/TypeScript/issues/56389
        const actor: Actor = log[key];
        if (actor && "index" in actor && !BOSS_NAMES.includes(actor.name)) {
            return `${actor.name} - ${actor.index}`;
        } else if (actor) {
            return actor.name;
        }
    }
    return "";
}

const EventsTable: React.FC<EventsTableProps> = ({fight, height = '500px', showSource = false}) => {

    const logs = fight.data;
    const loggedInPlayer = fight.loggedInPlayer;

    const renderStatImages = (boostedLevels: BoostedLevels) => {
        return (
            <div style={{display: 'flex', alignItems: 'center'}}>
                {Object.entries(boostedLevels).map(([stat, value], index) => (
                    <div key={index} style={{display: 'inline-block', marginRight: '10px'}}>
                        <img
                            src={statImages[stat as keyof BoostedLevels]}
                            alt={stat}
                            style={{
                                marginRight: '5px',
                                height: '18px',
                                verticalAlign: 'middle',
                            }}
                        />
                        <span style={{verticalAlign: 'middle'}}>{value}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="logs-box" style={{maxHeight: height, overflowY: 'auto'}}>
            <TableContainer>
                <Table style={{tableLayout: 'auto'}}>
                    <TableHead style={{backgroundColor: '#494949'}}>
                        <TableRow>
                            <TableCell style={{width: '50px', textAlign: 'center'}}>Time</TableCell>
                            <TableCell
                                style={{width: '120px', textAlign: 'right', paddingBottom: '2px'}}>Type</TableCell>
                            <TableCell style={{textAlign: 'center'}}>Event</TableCell>
                            <TableCell style={{width: '100px', textAlign: 'center'}}>Source</TableCell>
                            <TableCell style={{width: '100px', textAlign: 'center'}}>Target</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log, index) => {
                            let source = getActorName(log, 'source');
                            let target = getActorName(log, 'target');
                            return (
                                <TableRow key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                          style={{cursor: 'default'}}
                                          onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                          onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}>
                                    <TableCell>{formatHHmmss(log.fightTimeMs!, true)}</TableCell>
                                    <TableCell style={{width: '120px', textAlign: 'right'}}>{log.type}</TableCell>
                                    <TableCell>
                                        {log.type === LogTypes.LOG_VERSION ? `Log version ${log.logVersion}` : ""}
                                        {log.type === LogTypes.LOGGED_IN_PLAYER ? `Logged in player ${log.loggedInPlayer}` : ""}
                                        {log.type === LogTypes.PLAYER_REGION ? `${log.playerRegion}` : ""}
                                        {log.type === LogTypes.BOOSTED_LEVELS ? renderStatImages(log.boostedLevels) : ""}
                                        {log.type === LogTypes.PLAYER_EQUIPMENT && Array.isArray(log.playerEquipment) ? (
                                            <div style={{display: 'flex'}}>
                                                {log.playerEquipment.map((itemId: string, i: number) => (
                                                    <div key={i} style={{
                                                        width: '22px',
                                                        overflow: 'hidden',
                                                        marginRight: '5px',
                                                        backgroundColor: '#494945',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}>
                                                        <img src={getItemImageUrl(parseInt(itemId))}
                                                             alt={`Item ${itemId}`}
                                                             style={{height: '22px'}}/>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : ""}
                                        {log.type === LogTypes.DAMAGE ? (
                                            <>
                                                <span className="hitsplat-name">{log.hitsplatName} </span>
                                                <span className="damage-amount">{log.damageAmount}</span>
                                            </>
                                        ) : ""}
                                        {log.type === LogTypes.HEAL ? (
                                            <>
                                                <span className="hitsplat-name">{log.hitsplatName} </span>
                                                <span className="heal-amount">{log.healAmount}</span>
                                            </>
                                        ) : ""}
                                        {log.type === LogTypes.PLAYER_ATTACK_ANIMATION ? (
                                            <>
                                                <span className="attack-animation-text">{log.animationId} </span>
                                            </>
                                        ) : ""}
                                        {log.type === LogTypes.POSITION ? `(${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                    </TableCell>
                                    <TableCell
                                        className={source === loggedInPlayer ? 'logged-in-player-text' : 'other-text'}>
                                        {source}
                                    </TableCell>
                                    <TableCell
                                        className={target === loggedInPlayer ? 'logged-in-player-text' : 'other-text'}>
                                        {target}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>

                </Table>
            </TableContainer>
        </div>
    );
};

export default EventsTable;
