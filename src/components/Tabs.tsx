import React from "react";
import DamageDone from "./sections/DamageDone";
import Boosts from "./charts/Boosts";
import EventsTable from "./EventsTable";
import {Fight} from "../models/Fight";
import MainReplayComponent from "./replay/MainReplayComponent";

export enum TabsEnum {
    DAMAGE_DONE = 'Damage Done',
    DAMAGE_TAKEN = 'Damage Taken',
    BOOSTS = 'Boosts',
    EVENTS = 'Events',
    REPLAY = 'Replay',
}

export const DamageDoneTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <DamageDone
        fight={selectedLogs}
        type={"damage-done"}
    />;
};

export const DamageTakenTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <DamageDone
        fight={selectedLogs}
        type={"damage-taken"}
    />;
};

export const BoostsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <Boosts fight={selectedLogs}/>;
};

export const EventsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <EventsTable fight={selectedLogs} maxHeight={'80vh'} showSource={true}/>;
};

export const ReplayTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <MainReplayComponent key={selectedLogs.name + "-" + selectedLogs.startTime} fight={selectedLogs}/>;
};
