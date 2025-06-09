import React from 'react';
import {Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import {Fight} from "../models/Fight";
import {LogLine, LogTypes} from "../models/LogLine";
import {Levels} from "../models/Levels";
import attackImage from '../assets/Attack.webp';
import strengthImage from '../assets/Strength.webp';
import defenceImage from '../assets/Defence.webp';
import hitpointsImage from '../assets/Hitpoints.webp';
import magicImage from '../assets/Magic.webp';
import rangedImage from '../assets/Ranged.webp';
import prayerImage from '../assets/Prayer.webp';
import {formatHHmmss} from "../utils/utils";
import {BOSS_IDS} from "../utils/constants";
import {Actor} from "../models/Actor";
import ThickSkin from "../assets/prayers/inactive/ThickSkin.png";
import BurstOfStrength from "../assets/prayers/inactive/BurstOfStrength.png";
import ClarityOfThought from "../assets/prayers/inactive/ClarityOfThought.png";
import SharpEye from "../assets/prayers/inactive/SharpEye.png";
import MysticWill from "../assets/prayers/inactive/MysticWill.png";
import RockSkin from "../assets/prayers/inactive/RockSkin.png";
import SuperhumanStrength from "../assets/prayers/inactive/SuperhumanStrength.png";
import ImprovedReflexes from "../assets/prayers/inactive/ImprovedReflexes.png";
import RapidRestore from "../assets/prayers/inactive/RapidRestore.png";
import RapidHeal from "../assets/prayers/inactive/RapidHeal.png";
import ProtectItem from "../assets/prayers/inactive/ProtectItem.png";
import HawkEye from "../assets/prayers/inactive/HawkEye.png";
import MysticLore from "../assets/prayers/inactive/MysticLore.png";
import SteelSkin from "../assets/prayers/inactive/SteelSkin.png";
import UltimateStrength from "../assets/prayers/inactive/UltimateStrength.png";
import IncredibleReflexes from "../assets/prayers/inactive/IncredibleReflexes.png";
import ProtectFromMagic from "../assets/prayers/inactive/ProtectFromMagic.png";
import ProtectFromMissiles from "../assets/prayers/inactive/ProtectFromMissiles.png";
import ProtectFromMelee from "../assets/prayers/inactive/ProtectFromMelee.png";
import EagleEye from "../assets/prayers/inactive/EagleEye.png";
import MysticMight from "../assets/prayers/inactive/MysticMight.png";
import Retribution from "../assets/prayers/inactive/Retribution.png";
import Redemption from "../assets/prayers/inactive/Redemption.png";
import Smite from "../assets/prayers/inactive/Smite.png";
import Chivalry from "../assets/prayers/inactive/Chivalry.png";
import Piety from "../assets/prayers/inactive/Piety.png";
import Preserve from "../assets/prayers/inactive/Preserve.png";
import Rigour from "../assets/prayers/inactive/Rigour.png";
import Augury from "../assets/prayers/inactive/Augury.png";

interface EventsTableProps {
    fight: Fight;
    maxHeight: string;
    showSource?: boolean;
}

const statImages: Record<keyof Levels, string> = {
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
        if (actor && "index" in actor && !BOSS_IDS.includes(actor.id!)) {
            return `${actor.name} - ${actor.index}`;
        } else if (actor) {
            return actor.name;
        }
    }
    return "";
}

const EventsTable: React.FC<EventsTableProps> = ({fight, maxHeight, showSource = false}) => {

    const logs = fight.data;
    const loggedInPlayer = fight.loggedInPlayer;

    const renderStatImages = (levels: Levels) => {
        return (
            <div style={{display: 'flex', alignItems: 'center'}}>
                {Object.entries(levels).map(([stat, value], index) => (
                    <div key={index} style={{display: 'inline-block', marginRight: '10px'}}>
                        <img
                            src={statImages[stat as keyof Levels]}
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

    const renderPrayerImages = (prayers: string[]) => {
        return (
            <div style={{display: 'flex', alignItems: 'center'}}>
                {prayers.map((prayerIdStr, index) => {
                    const prayerId = parseInt(prayerIdStr, 10);
                    const prayerImage = prayerImages[prayerId];
                    if (prayerImage) {
                        return (
                            <div key={index} style={{display: 'inline-block', marginLeft: '0px'}}>
                                <img
                                    key={index}
                                    src={prayerImage}
                                    alt={`Prayer ${prayerId}`}
                                    style={{
                                        scale: '0.75',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '1000px',
                maxHeight: {
                    xs: '70vh',
                    sm: '70vh',
                    md: maxHeight,
                },
                overflowY: 'auto',
            }}
        >
            <TableContainer
                sx={{
                    '& .MuiTableCell-root': {
                        fontSize: '13px',
                        '@media (max-width: 768px)': {
                            fontSize: '12px',
                            padding: '2px 3px',
                        },
                    },
                }}
            >
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
                                        {log.type === LogTypes.BASE_LEVELS ? renderStatImages(log.baseLevels) : ""}
                                        {log.type === LogTypes.BOOSTED_LEVELS ? renderStatImages(log.boostedLevels) : ""}
                                        {log.type === LogTypes.PRAYER ? renderPrayerImages(log.prayers) : ""}
                                        {log.type === LogTypes.OVERHEAD ? renderPrayerImages([log.overhead]) : ""}
                                        {log.type === LogTypes.PLAYER_EQUIPMENT && Array.isArray(log.playerEquipment) ? (
                                            <div style={{display: 'flex'}}>
                                                {log.playerEquipment.map((itemId: string, i: number) => {
                                                    const id = parseInt(itemId);
                                                    return id > 0 ? (
                                                        <div key={i} style={{
                                                            width: '22px',
                                                            overflow: 'hidden',
                                                            marginRight: '5px',
                                                            backgroundColor: '#494945',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}>
                                                            <img src={getItemImageUrl(id)}
                                                                 alt={`Item ${itemId}`}
                                                                 style={{height: '22px'}}/>
                                                        </div>
                                                    ) : null;
                                                })}
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
                                        {log.type === LogTypes.GRAPHICS_OBJECT_SPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GRAPHICS_OBJECT_DESPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GAME_OBJECT_SPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GAME_OBJECT_DESPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GROUND_OBJECT_SPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.GROUND_OBJECT_DESPAWNED ? `${log.id}  (${log.position.x}, ${log.position.y}, ${log.position.plane})` : ""}
                                        {log.type === LogTypes.NPC_CHANGED ? `Changed ID: ${log.oldNpc.id} -> ${log.newNpc.id}` : ""}
                                        {log.type === LogTypes.WAVE_START}
                                        {log.type === LogTypes.WAVE_END}
                                        {log.type === LogTypes.PATH_START ? `${log.pathName}` : ""}
                                        {log.type === LogTypes.PATH_COMPLETE ? `${log.pathName}` : ""}
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
        </Box>
    );
};

export default EventsTable;

const prayerImages: { [prayerId: number]: string } = {
    4104: ThickSkin,
    4105: BurstOfStrength,
    4106: ClarityOfThought,
    4122: SharpEye,
    4123: MysticWill,
    4107: RockSkin,
    4108: SuperhumanStrength,
    4109: ImprovedReflexes,
    4110: RapidRestore,
    4111: RapidHeal,
    4112: ProtectItem,
    4124: HawkEye,
    4125: MysticLore,
    4113: SteelSkin,
    4114: UltimateStrength,
    4115: IncredibleReflexes,
    4116: ProtectFromMagic,
    4117: ProtectFromMissiles,
    4118: ProtectFromMelee,
    4126: EagleEye,
    4127: MysticMight,
    4119: Retribution,
    4120: Redemption,
    4121: Smite,
    4128: Chivalry,
    4129: Piety,
    5466: Preserve,
    5464: Rigour,
    5465: Augury,
};