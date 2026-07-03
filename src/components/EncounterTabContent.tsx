import React from "react";
import {
  BoostsTab,
  DamageDoneTab,
  DamageTakenTab,
  EventsTab,
  ReplayTab,
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
  dpsPercentiles: Record<string, number>;
  sourceFilter: ActorFilter | null;
  targetFilter: ActorFilter | null;
  equipmentFilter: EquipmentFilter | null;
  prayerFilter: PrayerFilter | null;
  hitsplatFilter: HitsplatFilter | null;
  hitsplatTypeFilter: HitsplatTypeFilter | null;
  eventTypeFilter: string | null;
  dataSourceFilter: ActorFilter | null;
  dataTargetFilter: ActorFilter | null;
  dataEquipmentFilter: EquipmentFilter | null;
  dataPrayerFilter: PrayerFilter | null;
  dataHitsplatFilter: HitsplatFilter | null;
  dataHitsplatTypeFilter: HitsplatTypeFilter | null;
  dataEventTypeFilter: string | null;
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
}

const EncounterTabContent: React.FC<EncounterTabContentProps> = ({
  renderedTab,
  fight,
  dpsPercentiles,
  sourceFilter,
  targetFilter,
  equipmentFilter,
  prayerFilter,
  hitsplatFilter,
  hitsplatTypeFilter: _hitsplatTypeFilter,
  eventTypeFilter,
  dataSourceFilter,
  dataTargetFilter,
  dataEquipmentFilter,
  dataPrayerFilter,
  dataHitsplatFilter,
  dataHitsplatTypeFilter,
  dataEventTypeFilter,
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
}) => {
  switch (renderedTab) {
    case TabsEnum.DAMAGE_DONE:
      return (
        <DamageDoneTab
          selectedLogs={fight}
          dpsPercentiles={dpsPercentiles}
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
    case TabsEnum.BOOSTS:
      return <BoostsTab selectedLogs={fight} />;
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
    case TabsEnum.REPLAY:
      return <ReplayTab selectedLogs={fight} />;
    default:
      return null;
  }
};

export default React.memo(EncounterTabContent);
