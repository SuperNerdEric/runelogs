import React from "react";
import DamageDone from "./sections/DamageDone";
import Boosts from "./charts/Boosts";
import EventsTable from "./EventsTable";
import { Fight } from "../models/Fight";
import MainReplayComponent from "./replay/MainReplayComponent";
import { ActorFilter } from "../utils/actorFilter";
import { EquipmentFilter } from "../utils/equipmentFilter";
import { PrayerFilter } from "../utils/prayerFilter";
import { HitsplatFilter } from "../utils/hitsplatFilter";
import { HitsplatTypeFilter } from "../utils/hitsplatTypeFilter";

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
  hitsplatFilter?: HitsplatFilter | null;
  hitsplatTypeFilter?: HitsplatTypeFilter | null;
  onSelectSourceFilter: (filter: ActorFilter) => void;
  onSelectTargetFilter: (filter: ActorFilter) => void;
  onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
  onSelectPrayerFilter?: (filter: PrayerFilter) => void;
  onSelectHitsplatFilter?: (filter: HitsplatFilter) => void;
  onSelectHitsplatTypeFilter?: (filter: HitsplatTypeFilter) => void;
  onClearSourceFilter: () => void;
  onClearTargetFilter: () => void;
  onClearEquipmentFilter?: () => void;
  onClearPrayerFilter?: () => void;
  onClearHitsplatFilter?: () => void;
  onClearHitsplatTypeFilter?: () => void;
  eventTypeFilter?: string | null;
  dataSourceFilter?: ActorFilter | null;
  dataTargetFilter?: ActorFilter | null;
  dataEquipmentFilter?: EquipmentFilter | null;
  dataPrayerFilter?: PrayerFilter | null;
  dataHitsplatFilter?: HitsplatFilter | null;
  dataEventTypeFilter?: string | null;
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
  hitsplatFilter,
  hitsplatTypeFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onSelectHitsplatFilter,
  onSelectHitsplatTypeFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  onClearHitsplatFilter,
  onClearHitsplatTypeFilter,
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
      hitsplatFilter={hitsplatFilter}
      hitsplatTypeFilter={hitsplatTypeFilter}
      dpsPercentiles={dpsPercentiles}
      onSelectSourceFilter={onSelectSourceFilter}
      onSelectTargetFilter={onSelectTargetFilter}
      onSelectEquipmentFilter={onSelectEquipmentFilter}
      onSelectPrayerFilter={onSelectPrayerFilter}
      onSelectHitsplatFilter={onSelectHitsplatFilter}
      onSelectHitsplatTypeFilter={onSelectHitsplatTypeFilter}
      onClearSourceFilter={onClearSourceFilter}
      onClearTargetFilter={onClearTargetFilter}
      onClearEquipmentFilter={onClearEquipmentFilter}
      onClearPrayerFilter={onClearPrayerFilter}
      onClearHitsplatFilter={onClearHitsplatFilter}
      onClearHitsplatTypeFilter={onClearHitsplatTypeFilter}
    />
  );
};

export const DamageTakenTab: React.FC<FilterableTabProps> = ({
  selectedLogs,
  sourceFilter,
  targetFilter,
  equipmentFilter,
  prayerFilter,
  hitsplatFilter,
  hitsplatTypeFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onSelectHitsplatFilter,
  onSelectHitsplatTypeFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  onClearHitsplatFilter,
  onClearHitsplatTypeFilter,
}) => {
  return (
    <DamageDone
      fight={selectedLogs}
      type={"damage-taken"}
      sourceFilter={sourceFilter}
      targetFilter={targetFilter}
      equipmentFilter={equipmentFilter}
      prayerFilter={prayerFilter}
      hitsplatFilter={hitsplatFilter}
      hitsplatTypeFilter={hitsplatTypeFilter}
      onSelectSourceFilter={onSelectSourceFilter}
      onSelectTargetFilter={onSelectTargetFilter}
      onSelectEquipmentFilter={onSelectEquipmentFilter}
      onSelectPrayerFilter={onSelectPrayerFilter}
      onSelectHitsplatFilter={onSelectHitsplatFilter}
      onSelectHitsplatTypeFilter={onSelectHitsplatTypeFilter}
      onClearSourceFilter={onClearSourceFilter}
      onClearTargetFilter={onClearTargetFilter}
      onClearEquipmentFilter={onClearEquipmentFilter}
      onClearPrayerFilter={onClearPrayerFilter}
      onClearHitsplatFilter={onClearHitsplatFilter}
      onClearHitsplatTypeFilter={onClearHitsplatTypeFilter}
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
  hitsplatFilter,
  dataSourceFilter,
  dataTargetFilter,
  dataEquipmentFilter,
  dataPrayerFilter,
  dataHitsplatFilter,
  dataEventTypeFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onSelectHitsplatFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  onClearHitsplatFilter,
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
      hitsplatFilter={hitsplatFilter}
      dataSourceFilter={dataSourceFilter}
      dataTargetFilter={dataTargetFilter}
      dataEquipmentFilter={dataEquipmentFilter}
      dataPrayerFilter={dataPrayerFilter}
      dataHitsplatFilter={dataHitsplatFilter}
      dataEventTypeFilter={dataEventTypeFilter}
      onSelectSourceFilter={onSelectSourceFilter}
      onSelectTargetFilter={onSelectTargetFilter}
      onSelectEquipmentFilter={onSelectEquipmentFilter}
      onSelectPrayerFilter={onSelectPrayerFilter}
      onSelectHitsplatFilter={onSelectHitsplatFilter}
      onClearSourceFilter={onClearSourceFilter}
      onClearTargetFilter={onClearTargetFilter}
      onClearEquipmentFilter={onClearEquipmentFilter}
      onClearPrayerFilter={onClearPrayerFilter}
      onClearHitsplatFilter={onClearHitsplatFilter}
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
