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
import { PrayerFilter } from "../utils/prayerFilter";

export interface EncounterTabContentProps {
  renderedTab: TabsEnum;
  fight: Fight;
  dpsPercentiles: Record<string, number>;
  sourceFilter: ActorFilter | null;
  targetFilter: ActorFilter | null;
  equipmentFilter: EquipmentFilter | null;
  prayerFilter: PrayerFilter | null;
  eventTypeFilter: string | null;
  onSelectSourceFilter: (filter: ActorFilter) => void;
  onSelectTargetFilter: (filter: ActorFilter) => void;
  onSelectEquipmentFilter: (filter: EquipmentFilter) => void;
  onSelectPrayerFilter: (filter: PrayerFilter) => void;
  onClearSourceFilter: () => void;
  onClearTargetFilter: () => void;
  onClearEquipmentFilter: () => void;
  onClearPrayerFilter: () => void;
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
  eventTypeFilter,
  onSelectSourceFilter,
  onSelectTargetFilter,
  onSelectEquipmentFilter,
  onSelectPrayerFilter,
  onClearSourceFilter,
  onClearTargetFilter,
  onClearEquipmentFilter,
  onClearPrayerFilter,
  onSelectEventTypeFilter,
  onClearEventTypeFilter,
}) => {
  switch (renderedTab) {
    case TabsEnum.DAMAGE_DONE:
      return (
        <DamageDoneTab
          selectedLogs={fight}
          dpsPercentiles={dpsPercentiles}
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
    case TabsEnum.DAMAGE_TAKEN:
      return (
        <DamageTakenTab
          selectedLogs={fight}
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
    case TabsEnum.REPLAY:
      return <ReplayTab selectedLogs={fight} />;
    default:
      return null;
  }
};

export default React.memo(EncounterTabContent);
