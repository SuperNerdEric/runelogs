import React from "react";
import DamageDone from "./sections/DamageDone";
import Boosts from "./charts/Boosts";
import EventsTable from "./EventsTable";
import { Fight } from "../models/Fight";
import MainReplayComponent from "./replay/MainReplayComponent";
import { ActorFilter } from "../utils/actorFilter";
import { EquipmentFilter } from "../utils/equipmentFilter";
import { PrayerFilter } from "../utils/prayerFilter";

export enum TabsEnum {
  DAMAGE_DONE = "Damage Done",
  DAMAGE_TAKEN = "Damage Taken",
  BOOSTS = "Boosts",
  EVENTS = "Events",
  REPLAY = "Replay",
}

interface FilterableTabProps {
  selectedLogs: Fight;
  sourceFilter: ActorFilter | null;
  targetFilter: ActorFilter | null;
  equipmentFilter?: EquipmentFilter | null;
  prayerFilter?: PrayerFilter | null;
  onSelectSourceFilter: (filter: ActorFilter) => void;
  onSelectTargetFilter: (filter: ActorFilter) => void;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onClearSourceFilter: () => void;
  onClearTargetFilter: () => void;
  onClearEquipmentFilter?: () => void;
  onClearPrayerFilter?: () => void;
  eventTypeFilter?: string | null;
  onSelectEventTypeFilter?: (eventType: string) => void;
  onClearEventTypeFilter?: () => void;
  dpsPercentiles?: Record<string, number>;
}

export const DamageDoneTab: React.FC<FilterableTabProps> = ({
  selectedLogs,
  sourceFilter,
  targetFilter,
  equipmentFilter,
  prayerFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  dpsPercentiles,
}) => {
  return (
    <DamageDone
      fight={selectedLogs}
      type={"damage-done"}
      sourceFilter={sourceFilter}
      targetFilter={targetFilter}
      equipmentFilter={equipmentFilter}
      prayerFilter={prayerFilter}
      dpsPercentiles={dpsPercentiles}
      onSelectSourceFilter={onSelectSourceFilter}
      onSelectTargetFilter={onSelectTargetFilter}
      onSelectEquipmentFilter={onSelectEquipmentFilter}
      onSelectPrayerFilter={onSelectPrayerFilter}
      onClearSourceFilter={onClearSourceFilter}
      onClearTargetFilter={onClearTargetFilter}
      onClearEquipmentFilter={onClearEquipmentFilter}
      onClearPrayerFilter={onClearPrayerFilter}
    />
  );
};

export const DamageTakenTab: React.FC<FilterableTabProps> = ({
  selectedLogs,
  sourceFilter,
  targetFilter,
  equipmentFilter,
  prayerFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
}) => {
  return (
    <DamageDone
      fight={selectedLogs}
      type={"damage-taken"}
      sourceFilter={sourceFilter}
      targetFilter={targetFilter}
      equipmentFilter={equipmentFilter}
      prayerFilter={prayerFilter}
      onSelectSourceFilter={onSelectSourceFilter}
      onSelectTargetFilter={onSelectTargetFilter}
      onSelectEquipmentFilter={onSelectEquipmentFilter}
      onSelectPrayerFilter={onSelectPrayerFilter}
      onClearSourceFilter={onClearSourceFilter}
      onClearTargetFilter={onClearTargetFilter}
      onClearEquipmentFilter={onClearEquipmentFilter}
      onClearPrayerFilter={onClearPrayerFilter}
    />
  );
};

export const BoostsTab: React.FC<{ selectedLogs: Fight }> = ({
  selectedLogs,
}) => {
  return <Boosts fight={selectedLogs} />;
};

export const EventsTab: React.FC<FilterableTabProps> = ({
  selectedLogs,
  sourceFilter,
  targetFilter,
  equipmentFilter,
  prayerFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  eventTypeFilter,
  onSelectEventTypeFilter,
  onClearEventTypeFilter,
}) => {
  return (
    <EventsTable
      fight={selectedLogs}
      maxHeight={"80vh"}
      showSource={true}
      sourceFilter={sourceFilter}
      targetFilter={targetFilter}
      equipmentFilter={equipmentFilter}
      prayerFilter={prayerFilter}
      onSelectSourceFilter={onSelectSourceFilter}
      onSelectTargetFilter={onSelectTargetFilter}
      onSelectEquipmentFilter={onSelectEquipmentFilter}
      onSelectPrayerFilter={onSelectPrayerFilter}
      onClearSourceFilter={onClearSourceFilter}
      onClearTargetFilter={onClearTargetFilter}
      onClearEquipmentFilter={onClearEquipmentFilter}
      onClearPrayerFilter={onClearPrayerFilter}
      eventTypeFilter={eventTypeFilter}
      onSelectEventTypeFilter={onSelectEventTypeFilter}
      onClearEventTypeFilter={onClearEventTypeFilter}
    />
  );
};

export const ReplayTab: React.FC<{ selectedLogs: Fight }> = ({
  selectedLogs,
}) => {
  return (
    <MainReplayComponent
      key={selectedLogs.name + "-" + selectedLogs.startTime}
      fight={selectedLogs}
    />
  );
};
