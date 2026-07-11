import React from "react";
import {
  DamageDoneTab,
  DamageTakenTab,
  EventsTab,
  ReplayTab,
  SummaryTab,
  TabsEnum,
} from "./Tabs";
import { Fight } from "../models/Fight";
import { ActorFilter } from "../utils/actorFilter";
import { EquipmentFilter } from "../utils/equipmentFilter";
import { HitsplatFilter } from "../utils/hitsplatFilter";
import { HitsplatTypeFilter } from "../utils/hitsplatTypeFilter";
import { PrayerFilter } from "../utils/prayerFilter";

export interface EncounterTabContentProps {
  renderedTab: TabsEnum;
  fight: Fight;
  receivingData?: boolean;
  dpsPercentiles: Record<string, number>;
  dpsRanks: Record<string, number>;
  leaderboardName: string | null;
  playerCount: number;
  dpsLeaderboardKey: string | null;
  sourceFilter: ActorFilter | null;
  targetFilter: ActorFilter | null;
  equipmentFilter: EquipmentFilter | null;
  prayerFilter: PrayerFilter | null;
  hitsplatFilter: HitsplatFilter | null;
  hitsplatTypeFilter: HitsplatTypeFilter | null;
  eventTypeFilter: string | null;
  eventTimeFilter: number | null;
  animationIdFilter: number | null;
  dataSourceFilter: ActorFilter | null;
  dataTargetFilter: ActorFilter | null;
  dataEquipmentFilter: EquipmentFilter | null;
  dataPrayerFilter: PrayerFilter | null;
  dataHitsplatFilter: HitsplatFilter | null;
  dataHitsplatTypeFilter: HitsplatTypeFilter | null;
  dataEventTypeFilter: string | null;
  dataEventTimeFilter: number | null;
  dataAnimationIdFilter: number | null;
  onSelectSourceFilter: (filter: ActorFilter) => void;
  onSelectTargetFilter: (filter: ActorFilter) => void;
  onSelectEquipmentFilter: (filter: EquipmentFilter) => void;
  onSelectPrayerFilter: (filter: PrayerFilter) => void;
  onSelectHitsplatFilter: (filter: HitsplatFilter) => void;
  onSelectHitsplatTypeFilter: (filter: HitsplatTypeFilter) => void;
  onClearSourceFilter: () => void;
  onClearTargetFilter: () => void;
  onClearEquipmentFilter: () => void;
  onClearPrayerFilter: () => void;
  onClearHitsplatFilter: () => void;
  onClearHitsplatTypeFilter: () => void;
  onSelectEventTypeFilter: (eventType: string) => void;
  onClearEventTypeFilter: () => void;
  onClearEventTimeFilter: () => void;
  onClearAnimationIdFilter: () => void;
}

const EncounterTabContent: React.FC<EncounterTabContentProps> = ({
  renderedTab,
  fight,
  receivingData = false,
  dpsPercentiles,
  dpsRanks,
  leaderboardName,
  playerCount,
  dpsLeaderboardKey,
  sourceFilter,
  targetFilter,
  equipmentFilter,
  prayerFilter,
  hitsplatFilter,
  hitsplatTypeFilter: _hitsplatTypeFilter,
  eventTypeFilter,
  eventTimeFilter,
  animationIdFilter,
  dataSourceFilter,
  dataTargetFilter,
  dataEquipmentFilter,
  dataPrayerFilter,
  dataHitsplatFilter,
  dataHitsplatTypeFilter,
  dataEventTypeFilter,
  dataEventTimeFilter,
  dataAnimationIdFilter,
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
  onSelectEventTypeFilter,
  onClearEventTypeFilter,
  onClearEventTimeFilter,
  onClearAnimationIdFilter,
}) => {
  switch (renderedTab) {
    case TabsEnum.SUMMARY:
      return (
        <SummaryTab
          selectedLogs={fight}
          receivingData={receivingData}
          dpsPercentiles={dpsPercentiles}
          dpsRanks={dpsRanks}
          leaderboardName={leaderboardName}
          playerCount={playerCount}
          dpsLeaderboardKey={dpsLeaderboardKey}
        />
      );
    case TabsEnum.DAMAGE_DONE:
      return (
        <DamageDoneTab
          selectedLogs={fight}
          dpsPercentiles={dpsPercentiles}
          showPercentile={dpsLeaderboardKey != null}
          sourceFilter={dataSourceFilter}
          targetFilter={dataTargetFilter}
          equipmentFilter={dataEquipmentFilter}
          prayerFilter={dataPrayerFilter}
          hitsplatFilter={dataHitsplatFilter}
          hitsplatTypeFilter={dataHitsplatTypeFilter}
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
    case TabsEnum.DAMAGE_TAKEN:
      return (
        <DamageTakenTab
          selectedLogs={fight}
          sourceFilter={dataSourceFilter}
          targetFilter={dataTargetFilter}
          equipmentFilter={dataEquipmentFilter}
          prayerFilter={dataPrayerFilter}
          hitsplatFilter={dataHitsplatFilter}
          hitsplatTypeFilter={dataHitsplatTypeFilter}
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
    case TabsEnum.EVENTS:
      return (
        <EventsTab
          selectedLogs={fight}
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
          dataEventTimeFilter={dataEventTimeFilter}
          dataAnimationIdFilter={dataAnimationIdFilter}
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
          eventTimeFilter={eventTimeFilter}
          animationIdFilter={animationIdFilter}
          onSelectEventTypeFilter={onSelectEventTypeFilter}
          onClearEventTypeFilter={onClearEventTypeFilter}
          onClearEventTimeFilter={onClearEventTimeFilter}
          onClearAnimationIdFilter={onClearAnimationIdFilter}
        />
      );
    case TabsEnum.REPLAY:
      return <ReplayTab selectedLogs={fight} />;
    default:
      return null;
  }
};

export default React.memo(EncounterTabContent);
