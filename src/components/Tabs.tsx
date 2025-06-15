import React from "react";
import DamageDone from "./sections/DamageDone";
import BoostsChart from "./charts/BoostsChart";
import EventsTable from "./EventsTable";
import {Fight} from "../models/Fight";
import {filterByType, LogTypes} from "../models/LogLine";
import MainReplayComponent from "./replay/MainReplayComponent";

export enum TabsEnum {
    DAMAGE_DONE = 'Damage Done',
    DAMAGE_TAKEN = 'Damage Taken',
    BOOSTS = 'Boosts',
    EVENTS = 'Events',
    REPLAY = 'Replay',
}

export const DamageDoneTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    const filteredLogs = filterByType(selectedLogs.data, LogTypes.DAMAGE);
    return <DamageDone
        selectedLogs={{
            ...selectedLogs!,
            data: filteredLogs.filter(
                (log) =>
                    log.target.index
            )!,
        }}
        actor={"source"}
    />;
};

export const DamageTakenTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    const filteredLogs = filterByType(selectedLogs.data, LogTypes.DAMAGE);
    return <DamageDone
        selectedLogs={{
            ...selectedLogs!,
            data: filteredLogs.filter(
                (log) =>
                    !log.target.index
            )!,
        }}
        actor={"target"}
    />;
};

export const BoostsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return (
        <div className="damage-done-container">
            <BoostsChart fight={selectedLogs}/>
        </div>
    );
};

export const EventsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <EventsTable fight={selectedLogs} maxHeight={'80vh'} showSource={true}/>;
};

export const ReplayTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <MainReplayComponent key={selectedLogs.name + "-" + selectedLogs.startTime} fight={selectedLogs}/>;
};
