import { describe, expect, it } from "vitest";
import { isFightGroupMetadata } from "../models/FightGroup";
import {
  FIGHT_IN_PROGRESS_COLOR,
  resolveFightOutcomeColor,
} from "../utils/fightDisplayStatus";
import { colors } from "../theme";
import { mapLogPageEncountersToMetadata } from "../components/Log/mapLogPageEncounters";

describe("mapLogPageEncountersToMetadata", () => {
  it("marks a live unfinished standalone fight as in-progress, not failure", () => {
    const [meta] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fight",
          id: "yama-live",
          name: "Yama",
          mainEnemyName: "Yama",
          startTime: "2026-07-11T03:06:00.000Z",
          fightDurationTicks: 120,
          success: false,
          order: 0,
        },
      ],
      {
        receivingData: true,
        liveActiveFightId: "yama-live",
      },
    );

    expect(meta.inProgress).toBe(true);
    expect(meta.success).toBe(false);
    expect(resolveFightOutcomeColor(meta.success, meta.inProgress)).toBe(
      FIGHT_IN_PROGRESS_COLOR,
    );
  });

  it("keeps an earlier standalone wipe as failure while a later fight is live", () => {
    const [wipe, live] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fight",
          id: "yama-wipe",
          name: "Yama",
          mainEnemyName: "Yama",
          startTime: "2026-07-11T03:00:00.000Z",
          fightDurationTicks: 80,
          success: false,
          order: 0,
        },
        {
          type: "fight",
          id: "yama-live",
          name: "Yama",
          mainEnemyName: "Yama",
          startTime: "2026-07-11T03:06:00.000Z",
          fightDurationTicks: 40,
          success: false,
          order: 1,
        },
      ],
      {
        receivingData: true,
        liveActiveFightId: "yama-live",
      },
    );

    expect(wipe.inProgress).toBe(false);
    expect(resolveFightOutcomeColor(wipe.success, wipe.inProgress)).toBe(
      colors.fight.failure,
    );
    expect(live.inProgress).toBe(true);
    expect(resolveFightOutcomeColor(live.success, live.inProgress)).toBe(
      FIGHT_IN_PROGRESS_COLOR,
    );
  });

  it("does not mark a finished clear as in-progress after the log stops receiving", () => {
    const [meta] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fight",
          id: "yama-clear",
          name: "Yama",
          mainEnemyName: "Yama",
          startTime: "2026-07-11T02:50:00.000Z",
          fightDurationTicks: 200,
          success: true,
          order: 0,
        },
      ],
      {
        receivingData: false,
        liveActiveFightId: null,
      },
    );

    expect(meta.inProgress).toBe(false);
    expect(meta.success).toBe(true);
    expect(resolveFightOutcomeColor(meta.success, meta.inProgress)).toBe(
      colors.fight.success,
    );
  });

  it("uses mainEnemyName for standalone tile labels", () => {
    const [meta] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fight",
          id: "f1",
          name: "Yama (1)",
          mainEnemyName: "Yama",
          startTime: "2026-07-11T03:00:00.000Z",
          fightDurationTicks: 10,
          success: true,
          order: 0,
        },
      ],
      {},
    );

    expect(meta.name).toBe("Yama");
  });

  it("does not keep an earlier wiped run in-progress when another group is active", () => {
    // Reproduction: two Mokhaiotl wipe trips (success=false, last delve unfinished)
    // while the log stays live for a later run. Old annotation painted receivingData
    // onto every fight group, so both wiped trips stayed blue/in-progress.
    const [wipe1, wipe2] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fightGroup",
          id: "dom-1",
          name: "Doom of Mokhaiotl - 1",
          leaderboardName: "Doom of Mokhaiotl",
          success: false,
          receivingData: true,
          order: 0,
          fights: [
            {
              id: "d6",
              name: "Delve 6",
              mainEnemyName: "Doom of Mokhaiotl",
              startTime: "2026-07-14T18:49:00.000Z",
              fightDurationTicks: 248,
              success: true,
              order: 5,
            },
            {
              id: "d7",
              name: "Delve 7",
              mainEnemyName: "Doom of Mokhaiotl",
              startTime: "2026-07-14T18:50:00.000Z",
              fightDurationTicks: 71,
              success: false,
              order: 6,
            },
          ],
        },
        {
          type: "fightGroup",
          id: "dom-2",
          name: "Doom of Mokhaiotl - 2",
          leaderboardName: "Doom of Mokhaiotl",
          success: false,
          receivingData: true,
          order: 1,
          fights: [
            {
              id: "d5b",
              name: "Delve 5",
              mainEnemyName: "Doom of Mokhaiotl",
              startTime: "2026-07-14T19:00:00.000Z",
              fightDurationTicks: 198,
              success: true,
              order: 4,
            },
            {
              id: "d6b",
              name: "Delve 6",
              mainEnemyName: "Doom of Mokhaiotl",
              startTime: "2026-07-14T19:02:00.000Z",
              fightDurationTicks: 120,
              success: false,
              order: 5,
            },
          ],
        },
      ],
      {
        receivingData: true,
        liveActiveFightGroupId: "dom-2",
        liveActiveFightId: "d6b",
      },
    );

    expect(isFightGroupMetadata(wipe1)).toBe(true);
    expect(isFightGroupMetadata(wipe2)).toBe(true);
    if (!isFightGroupMetadata(wipe1) || !isFightGroupMetadata(wipe2)) {
      return;
    }

    expect(wipe1.inProgress).toBe(false);
    expect(wipe1.fights.find((f) => f.name === "Delve 7")?.inProgress).toBe(
      false,
    );
    expect(wipe2.inProgress).toBe(true);
    expect(wipe2.fights.find((f) => f.name === "Delve 6")?.inProgress).toBe(
      true,
    );
  });

  it("keeps annotation fallback when there is no active group pointer yet", () => {
    const [meta] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fightGroup",
          id: "tob-1",
          name: "Theatre of Blood",
          leaderboardName: "Theatre of Blood",
          success: false,
          receivingData: true,
          order: 0,
          fights: [
            {
              id: "maiden",
              name: "The Maiden of Sugadinti",
              mainEnemyName: "The Maiden of Sugadinti",
              startTime: "2026-07-11T03:00:00.000Z",
              fightDurationTicks: 100,
              success: true,
              order: 0,
            },
            {
              id: "bloat",
              name: "Pestilent Bloat",
              mainEnemyName: "Pestilent Bloat",
              startTime: "2026-07-11T03:05:00.000Z",
              fightDurationTicks: 50,
              success: false,
              order: 1,
            },
          ],
        },
      ],
      {
        receivingData: true,
        liveActiveFightGroupId: null,
        liveActiveFightId: null,
      },
    );

    expect(isFightGroupMetadata(meta)).toBe(true);
    if (!isFightGroupMetadata(meta)) {
      return;
    }

    expect(meta.inProgress).toBe(true);
  });

  it("marks the active nested fight blue during a live run", () => {
    const [meta] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fightGroup",
          id: "tob-1",
          name: "Theatre of Blood",
          leaderboardName: "Theatre of Blood",
          success: false,
          order: 0,
          fights: [
            {
              id: "maiden",
              name: "The Maiden of Sugadinti",
              mainEnemyName: "The Maiden of Sugadinti",
              startTime: "2026-07-11T03:00:00.000Z",
              fightDurationTicks: 100,
              success: true,
              order: 0,
            },
            {
              id: "bloat",
              name: "Pestilent Bloat",
              mainEnemyName: "Pestilent Bloat",
              startTime: "2026-07-11T03:05:00.000Z",
              fightDurationTicks: 50,
              success: false,
              order: 1,
            },
          ],
        },
      ],
      {
        receivingData: true,
        liveActiveFightGroupId: "tob-1",
        liveActiveFightId: "bloat",
      },
    );

    expect(isFightGroupMetadata(meta)).toBe(true);
    if (!isFightGroupMetadata(meta)) {
      return;
    }

    expect(meta.inProgress).toBe(true);
    expect(meta.fights[0]?.inProgress).toBe(false);
    expect(meta.fights[1]?.inProgress).toBe(true);
    expect(
      resolveFightOutcomeColor(
        meta.fights[1]!.success,
        meta.fights[1]!.inProgress,
      ),
    ).toBe(FIGHT_IN_PROGRESS_COLOR);
  });

  it("sorts nested fights by order before mapping tiles", () => {
    const [meta] = mapLogPageEncountersToMetadata(
      [
        {
          type: "fightGroup",
          id: "tob-1",
          name: "Theatre of Blood",
          leaderboardName: "Theatre of Blood",
          success: true,
          order: 0,
          fights: [
            {
              id: "bloat",
              name: "Pestilent Bloat",
              mainEnemyName: "Pestilent Bloat",
              startTime: "2026-07-11T03:05:00.000Z",
              fightDurationTicks: 50,
              success: true,
              order: 1,
            },
            {
              id: "maiden",
              name: "The Maiden of Sugadinti",
              mainEnemyName: "The Maiden of Sugadinti",
              startTime: "2026-07-11T03:00:00.000Z",
              fightDurationTicks: 100,
              success: true,
              order: 0,
            },
          ],
        },
      ],
      { receivingData: false },
    );

    expect(isFightGroupMetadata(meta)).toBe(true);
    if (!isFightGroupMetadata(meta)) {
      return;
    }

    expect(meta.fights.map((f) => f.name)).toEqual([
      "The Maiden of Sugadinti",
      "Pestilent Bloat",
    ]);
  });
});
