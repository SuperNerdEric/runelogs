import React from "react";
import DamageDone from "./sections/DamageDone";
import EncounterSummary from "./sections/EncounterSummary";
import EventsTable from "./EventsTable";
import { Fight } from "../models/Fight";
import MainReplayComponent from "./replay/MainReplayComponent";
import { ActorFilter } from "../utils/actorFilter";
import { EquipmentFilter } from "../utils/equipmentFilter";
import { PrayerFilter } from "../utils/prayerFilter";
import { HitsplatFilter } from "../utils/hitsplatFilter";
import { HitsplatTypeFilter } from "../utils/hitsplatTypeFilter";

export enum TabsEnum {
  SUMMARY = "Summary",
  DAMAGE_DONE = "Damage Done",
  DAMAGE_TAKEN = "Damage Taken",
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
  eventTimeFilter?: number | null;
  dataEventTimeFilter?: number | null;
  onClearEventTimeFilter?: () => void;
  animationIdFilter?: number | null;
  dataAnimationIdFilter?: number | null;
  onClearAnimationIdFilter?: () => void;
  dpsPercentiles?: Record<string, number>;
  showPercentile?: boolean;
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
  showPercentile,
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
      showPercentile={showPercentile}
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

export const SummaryTab: React.FC<{
  selectedLogs: Fight;
  receivingData?: boolean;
  dpsPercentiles?: Record<string, number>;
  dpsRanks?: Record<string, number>;
  leaderboardName?: string | null;
  playerCount?: number;
  dpsLeaderboardKey?: string | null;
}> = ({
  selectedLogs,
  receivingData = false,
  dpsPercentiles,
  dpsRanks = {},
  leaderboardName = null,
  playerCount = 0,
  dpsLeaderboardKey = null,
}) => {
  return (
    <EncounterSummary
      fight={selectedLogs}
      receivingData={receivingData}
      dpsPercentiles={dpsPercentiles}
      dpsRanks={dpsRanks}
      leaderboardName={leaderboardName}
      playerCount={playerCount}
      dpsLeaderboardKey={dpsLeaderboardKey}
    />
  );
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
  eventTimeFilter,
  dataEventTimeFilter,
  onClearEventTimeFilter,
  animationIdFilter,
  dataAnimationIdFilter,
  onClearAnimationIdFilter,
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
      eventTimeFilter={eventTimeFilter}
      dataEventTimeFilter={dataEventTimeFilter}
      onClearEventTimeFilter={onClearEventTimeFilter}
      animationIdFilter={animationIdFilter}
      dataAnimationIdFilter={dataAnimationIdFilter}
      onClearAnimationIdFilter={onClearAnimationIdFilter}
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
