import React from "react";
import DamageDone from "./sections/DamageDone";
import {DamageMaxMeHitsplats, DamageMeHitsplats, DamageOtherHitsplats} from "../HitsplatNames";
import BoostsChart from "./charts/BoostsChart";
import GroupDamagePieChart from "./charts/GroupDamagePieChart";
import EventsTable from "./EventsTable";
import {Fight} from "../models/Fight";
import {BoostedLevelsLog, filterByType, LogTypes} from "../models/LogLine";

export enum TabsEnum {
    DAMAGE_DONE = 'My Damage',
    DAMAGE_TAKEN = 'Damage Taken',
    BOOSTS = 'Boosts',
    GROUP_DAMAGE = 'Group Damage',
    EVENTS = 'Events',
}

export const DamageDoneTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    const filteredLogs = filterByType(selectedLogs.data, LogTypes.DAMAGE);
    return <DamageDone
        selectedLogs={{
            ...selectedLogs!,
            data: filteredLogs?.filter(
                (log) =>
                    (Object.values(DamageMeHitsplats).includes(log.hitsplatName) ||
                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName)) &&
                    log.target !== selectedLogs?.loggedInPlayer
            )!,
        }}
    />;
};

export const DamageTakenTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    const filteredLogs = filterByType(selectedLogs.data, LogTypes.DAMAGE);
    return <DamageDone
        selectedLogs={{
            ...selectedLogs!,
            data: filteredLogs.filter(
                (log) =>
                    (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                        Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!)) &&
                    log.target === selectedLogs?.loggedInPlayer
            )!,
        }}
    />;
};

export const BoostsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return (
        <div className="damage-done-container">
            <BoostsChart fight={selectedLogs}/>
        </div>
    );
};

export const GroupDamageTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    const filteredLogs = filterByType(selectedLogs.data, LogTypes.DAMAGE);
    return (
        <div>
            <div className="damage-done-container">
                <GroupDamagePieChart selectedLogs={{
                    ...selectedLogs!,
                    data: filteredLogs?.filter(
                        (log) =>
                            (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                                Object.values(DamageOtherHitsplats).includes(log.hitsplatName!)) &&
                            selectedLogs.enemies.includes(log.target!)
                    )!,
                }}/>
            </div>
            <DamageDone
                selectedLogs={{
                    ...selectedLogs!,
                    data: filteredLogs?.filter(
                        (log) =>
                            (Object.values(DamageMeHitsplats).includes(log.hitsplatName!) ||
                                Object.values(DamageMaxMeHitsplats).includes(log.hitsplatName!) ||
                                Object.values(DamageOtherHitsplats).includes(log.hitsplatName!)) &&
                            selectedLogs.enemies.includes(log.target!)
                    )!,
                }}
            />
        </div>
    );
};

export const EventsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <EventsTable fight={selectedLogs} height={'80vh'} showSource={true}/>;
};
