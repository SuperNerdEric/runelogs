import React from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import {Fight} from "../models/Fight";
import {LogTypes} from "../models/LogLine";
import {BoostedLevels} from "../models/BoostedLevels";
import attackImage from '../assets/Attack.webp';
import strengthImage from '../assets/Strength.webp';
import defenceImage from '../assets/Defence.webp';
import hitpointsImage from '../assets/Hitpoints.webp';
import magicImage from '../assets/Magic.webp';
import rangedImage from '../assets/Ranged.webp';
import prayerImage from '../assets/Prayer.webp';

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

// Function to get the image URL for a given item ID
// https://chisel.weirdgloop.org/moid/data_files/itemsmin.js
// https://chisel.weirdgloop.org/moid/data_files/npcsmin.js
const getItemImage = (itemId: number): string => {
    return `https://chisel.weirdgloop.org/static/img/osrs-sprite/${itemId}.png`;
};

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
                            return (
                                <TableRow key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                                          style={{cursor: 'default'}}
                                          onMouseEnter={(e) => e.currentTarget.classList.add('highlighted-row')}
                                          onMouseLeave={(e) => e.currentTarget.classList.remove('highlighted-row')}>
                                    <TableCell>{log.fightTime}</TableCell>
                                    <TableCell style={{width: '120px', textAlign: 'right'}}>{log.type}</TableCell>
                                    <TableCell>
                                        {log.type === LogTypes.LOG_VERSION ? `Log version ${log.logVersion}` : ""}
                                        {log.type === LogTypes.LOGGED_IN_PLAYER ? `Logged in player ${log.loggedInPlayer}` : ""}
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
                                                        <img src={getItemImage(parseInt(itemId))} alt={`Item ${itemId}`}
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
                                    </TableCell>
                                    <TableCell
                                        className={"source" in log && log.source === loggedInPlayer ? 'logged-in-player-text' : 'other-text'}>
                                        {"source" in log ? log.source : ""}
                                    </TableCell>
                                    <TableCell
                                        className={"target" in log && log.target === loggedInPlayer ? 'logged-in-player-text' : 'other-text'}>
                                        {"target" in log ? log.target : ""}
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
