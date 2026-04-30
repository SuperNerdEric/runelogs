import React from "react";
import DamageDone from "./sections/DamageDone";
import Boosts from "./charts/Boosts";
import EventsTable from "./EventsTable";
import {Fight} from "../models/Fight";
import MainReplayComponent from "./replay/MainReplayComponent";
import {ActorFilter} from "../utils/actorFilter";

export enum TabsEnum {
    DAMAGE_DONE = 'Damage Done',
    DAMAGE_TAKEN = 'Damage Taken',
    BOOSTS = 'Boosts',
    EVENTS = 'Events',
    REPLAY = 'Replay',
}

interface FilterableTabProps {
    selectedLogs: Fight;
    sourceFilter: ActorFilter | null;
    targetFilter: ActorFilter | null;
    onSelectSourceFilter: (filter: ActorFilter) => void;
    onSelectTargetFilter: (filter: ActorFilter) => void;
    onClearSourceFilter: () => void;
    onClearTargetFilter: () => void;
    eventTypeFilter?: string | null;
    onSelectEventTypeFilter?: (eventType: string) => void;
    onClearEventTypeFilter?: () => void;
}

export const DamageDoneTab: React.FC<FilterableTabProps> = ({
    selectedLogs,
    sourceFilter,
    targetFilter,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onClearSourceFilter,
    onClearTargetFilter,
}) => {
    return <DamageDone
        fight={selectedLogs}
        type={"damage-done"}
        sourceFilter={sourceFilter}
        targetFilter={targetFilter}
        onSelectSourceFilter={onSelectSourceFilter}
        onSelectTargetFilter={onSelectTargetFilter}
        onClearSourceFilter={onClearSourceFilter}
        onClearTargetFilter={onClearTargetFilter}
    />;
};

export const DamageTakenTab: React.FC<FilterableTabProps> = ({
    selectedLogs,
    sourceFilter,
    targetFilter,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onClearSourceFilter,
    onClearTargetFilter,
}) => {
    return <DamageDone
        fight={selectedLogs}
        type={"damage-taken"}
        sourceFilter={sourceFilter}
        targetFilter={targetFilter}
        onSelectSourceFilter={onSelectSourceFilter}
        onSelectTargetFilter={onSelectTargetFilter}
        onClearSourceFilter={onClearSourceFilter}
        onClearTargetFilter={onClearTargetFilter}
    />;
};

export const BoostsTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <Boosts fight={selectedLogs}/>;
};

export const EventsTab: React.FC<FilterableTabProps> = ({
    selectedLogs,
    sourceFilter,
    targetFilter,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onClearSourceFilter,
    onClearTargetFilter,
    eventTypeFilter,
    onSelectEventTypeFilter,
    onClearEventTypeFilter,
}) => {
    return (
        <EventsTable
            fight={selectedLogs}
            maxHeight={'80vh'}
            showSource={true}
            sourceFilter={sourceFilter}
            targetFilter={targetFilter}
            onSelectSourceFilter={onSelectSourceFilter}
            onSelectTargetFilter={onSelectTargetFilter}
            onClearSourceFilter={onClearSourceFilter}
            onClearTargetFilter={onClearTargetFilter}
            eventTypeFilter={eventTypeFilter}
            onSelectEventTypeFilter={onSelectEventTypeFilter}
            onClearEventTypeFilter={onClearEventTypeFilter}
        />
    );
};

export const ReplayTab: React.FC<{ selectedLogs: Fight }> = ({selectedLogs}) => {
    return <MainReplayComponent key={selectedLogs.name + "-" + selectedLogs.startTime} fight={selectedLogs}/>;
};
