import { describe, expect, it } from "vitest";
import {
  FIGHT_IN_PROGRESS_COLOR,
  isFightGroupRunInProgress,
  isFightLiveInProgress,
  isLiveFightOutcomePending,
  isStaleLiveSyncedFight,
  resolveFightOutcomeColor,
  resolveLiveFightDisplaySuccess,
  resolveLiveFightTileInProgress,
  resolveLiveFightTileState,
} from "../utils/fightDisplayStatus";
import { colors } from "../theme";

describe("fightDisplayStatus", () => {
  it("uses blue for in-progress fights regardless of success flag", () => {
    expect(resolveFightOutcomeColor(false, true)).toBe(FIGHT_IN_PROGRESS_COLOR);
    expect(resolveFightOutcomeColor(true, true)).toBe(FIGHT_IN_PROGRESS_COLOR);
  });

  it("uses success and failure colors when not in progress", () => {
    expect(resolveFightOutcomeColor(true, false)).toBe(colors.fight.success);
    expect(resolveFightOutcomeColor(false, false)).toBe(colors.fight.failure);
  });

  it("detects a standalone fight from the top-level active encounter id", () => {
    expect(isFightLiveInProgress(true, "maiden-1", "maiden-1")).toBe(true);
    expect(isFightLiveInProgress(true, "maiden-1", "group-1")).toBe(false);
    expect(isFightLiveInProgress(false, "maiden-1", "maiden-1")).toBe(false);
  });

  it("marks a run in progress from the group id or nested fight id", () => {
    expect(
      isFightGroupRunInProgress(true, false, "group-1", ["f1"], "group-1"),
    ).toBe(true);
    expect(
      isFightGroupRunInProgress(
        true,
        false,
        "group-1",
        ["maiden-1"],
        "other-group",
        "maiden-1",
      ),
    ).toBe(true);
    expect(
      isFightGroupRunInProgress(true, false, "trip-1", ["d1"], "trip-2"),
    ).toBe(false);
    expect(
      isFightGroupRunInProgress(true, true, "group-1", ["f1"], "group-1"),
    ).toBe(false);
    expect(
      isFightGroupRunInProgress(false, false, "group-1", ["f1"], "group-1"),
    ).toBe(false);
  });

  it("treats a live unfinished raid as in progress when pointers match", () => {
    const receivingData = true;
    const groupSuccess = false;
    const dbGroupId = "ee930771-c75c-4f8a-a400-086a89a12fc5";
    const checkpointGroupId = "aab4addd-3e44-4c24-b429-acb84e937413";
    const fightIds = ["b2363fc8-b926-4b64-8296-a731d36e69fb"];

    // Divergent checkpoint group UUID alone is not enough on the client —
    // the API should send the published group id or liveActiveFightId.
    expect(
      isFightGroupRunInProgress(
        receivingData,
        groupSuccess,
        dbGroupId,
        fightIds,
        checkpointGroupId,
      ),
    ).toBe(false);
    expect(
      isFightGroupRunInProgress(
        receivingData,
        groupSuccess,
        dbGroupId,
        fightIds,
        checkpointGroupId,
        fightIds[0],
      ),
    ).toBe(true);
    expect(
      isFightGroupRunInProgress(
        receivingData,
        groupSuccess,
        dbGroupId,
        fightIds,
        dbGroupId,
      ),
    ).toBe(true);
    expect(
      resolveFightOutcomeColor(
        groupSuccess,
        isFightGroupRunInProgress(
          receivingData,
          groupSuccess,
          dbGroupId,
          fightIds,
          dbGroupId,
        ),
      ),
    ).toBe(FIGHT_IN_PROGRESS_COLOR);
  });

  it("marks the current unfinished fight during a live run when active ids mismatch", () => {
    const fights = [
      { id: "maiden-db", success: true, order: 0 },
      { id: "bloat-db", success: true, order: 1 },
      { id: "nylo-db", success: false, order: 2 },
      { id: "sote-db", success: false, order: 3 },
    ];

    expect(
      resolveLiveFightTileInProgress(true, false, fights, fights[2], null),
    ).toBe(false);
    expect(
      resolveLiveFightTileInProgress(true, false, fights, fights[3], null),
    ).toBe(true);
    expect(
      resolveLiveFightTileInProgress(true, false, fights, fights[3], "nylo-db"),
    ).toBe(false);
  });

  it("prefers liveActiveFightId from the checkpoint over a later stale unfinished row", () => {
    const fights = [
      { id: "maiden-db", success: true, order: 0 },
      { id: "bloat-db", success: true, order: 1 },
      { id: "nylo-db", success: true, order: 2 },
      { id: "sote-db", success: false, order: 3 },
      { id: "xarpus-stale", success: false, order: 4 },
    ];

    const soteState = resolveLiveFightTileState(
      true,
      false,
      fights,
      fights[3],
      "sote-db",
    );
    expect(soteState.inProgress).toBe(true);
    expect(soteState.displaySuccess).toBe(false);
    expect(
      resolveFightOutcomeColor(soteState.displaySuccess, soteState.inProgress),
    ).toBe(FIGHT_IN_PROGRESS_COLOR);

    const nyloState = resolveLiveFightTileState(
      true,
      false,
      fights,
      fights[2],
      "sote-db",
    );
    expect(nyloState.inProgress).toBe(false);
    expect(nyloState.displaySuccess).toBe(true);
    expect(
      resolveFightOutcomeColor(nyloState.displaySuccess, nyloState.inProgress),
    ).toBe(colors.fight.success);
  });

  it("never shows failure red for any unfinished row while the log is live", () => {
    const fights = [
      { id: "maiden", success: true, order: 0 },
      { id: "bloat", success: false, order: 1 },
      { id: "nylo", success: false, order: 2 },
      { id: "sote", success: false, order: 3 },
    ];

    for (const fight of fights) {
      const tileState = resolveLiveFightTileState(
        true,
        false,
        fights,
        fight,
        "sote",
      );
      const color = resolveFightOutcomeColor(
        tileState.displaySuccess,
        tileState.inProgress,
      );
      expect(color).not.toBe(colors.fight.failure);
    }

    const soteState = resolveLiveFightTileState(
      true,
      false,
      fights,
      fights[3],
      "sote",
    );
    expect(soteState.inProgress).toBe(true);
    expect(
      resolveFightOutcomeColor(soteState.displaySuccess, soteState.inProgress),
    ).toBe(FIGHT_IN_PROGRESS_COLOR);
  });

  it("keeps real failures red when the log is no longer live", () => {
    const fights = [
      { id: "maiden", success: true, order: 0 },
      { id: "nylo", success: false, order: 1 },
    ];

    expect(isLiveFightOutcomePending(false, false, false)).toBe(false);
    expect(isStaleLiveSyncedFight(false, false, fights[1], fights[1])).toBe(
      false,
    );
    expect(resolveLiveFightDisplaySuccess(fights[1], false, false)).toBe(false);

    const nyloState = resolveLiveFightTileState(
      false,
      false,
      fights,
      fights[1],
      null,
    );
    expect(nyloState.inProgress).toBe(false);
    expect(nyloState.displaySuccess).toBe(false);
    expect(
      resolveFightOutcomeColor(nyloState.displaySuccess, nyloState.inProgress),
    ).toBe(colors.fight.failure);
  });
});
