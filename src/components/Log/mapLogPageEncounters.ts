import { FightMetaData } from "../../models/Fight";
import { EncounterMetaData } from "../../models/LogLine";
import { inferLeaderboardFightGroupName } from "../../utils/leaderboardContent";
import {
  isFightGroupRunInProgress,
  isFightLiveInProgress,
  resolveLiveFightTileState,
} from "../../utils/fightDisplayStatus";

export interface LogPageApiFight {
  id: string;
  name: string;
  mainEnemyName: string;
  startTime: string;
  fightDurationTicks: number;
  success: boolean;
  order: number;
}

export interface LogPageApiFightGroup {
  type: "fightGroup";
  id: string;
  name: string;
  leaderboardName: string;
  displayDurationTicks?: number | null;
  success: boolean;
  receivingData?: boolean;
  order: number;
  fights: LogPageApiFight[];
}

export interface LogPageApiFightOnly {
  type: "fight";
  id: string;
  name: string;
  mainEnemyName: string;
  startTime: string;
  fightDurationTicks: number;
  success: boolean;
  order: number;
}

export type LogPageApiEncounter = LogPageApiFightOnly | LogPageApiFightGroup;

export function mapLogPageEncountersToMetadata(
  encounters: LogPageApiEncounter[],
  live: {
    receivingData?: boolean;
    liveActiveFightGroupId?: string | null;
    liveActiveFightId?: string | null;
  },
): EncounterMetaData[] {
  const receivingData = Boolean(live.receivingData);
  const out: EncounterMetaData[] = [];

  for (const enc of encounters) {
    if (enc.type === "fightGroup") {
      const sortedFights = enc.fights.slice().sort((a, b) => a.order - b.order);
      // Prefer the log-page annotation: while the log is receiving,
      // incomplete runs stay in-progress even when live pointers lag.
      const groupInProgress =
        typeof enc.receivingData === "boolean"
          ? enc.receivingData && !enc.success
          : isFightGroupRunInProgress(
              receivingData,
              enc.success,
              enc.id,
              sortedFights.map((f) => f.id),
              live.liveActiveFightGroupId,
              live.liveActiveFightId,
            );

      const fightStates = sortedFights.map((f) => ({
        id: f.id,
        success: f.success,
        order: f.order,
      }));

      const childFights: FightMetaData[] = sortedFights.map((f) => {
        const tileState = resolveLiveFightTileState(
          receivingData,
          enc.success,
          fightStates,
          {
            id: f.id,
            success: f.success,
            order: f.order,
          },
          live.liveActiveFightId,
        );

        return {
          name: f.name,
          startTime: f.startTime,
          fightDurationTicks: f.fightDurationTicks,
          success: tileState.displaySuccess,
          inProgress: tileState.inProgress,
        };
      });

      out.push({
        name: enc.name,
        officialDurationTicks: enc.displayDurationTicks ?? undefined,
        success: enc.success,
        inProgress: groupInProgress,
        fights: childFights,
        id: enc.id,
        leaderboardName:
          enc.leaderboardName ?? inferLeaderboardFightGroupName(enc.name),
      });
    } else {
      out.push({
        name: enc.mainEnemyName ?? enc.name,
        startTime: enc.startTime,
        fightDurationTicks: enc.fightDurationTicks,
        success: enc.success,
        inProgress: isFightLiveInProgress(
          receivingData,
          enc.id,
          live.liveActiveFightId,
        ),
      });
    }
  }

  return out;
}
