import { describe, expect, it, vi } from "vitest";
import {
  createEncounterBreadcrumbLinkState,
  createRunBreadcrumbLinkState,
  getEncounterBreadcrumbSegments,
  getRunBreadcrumbSegments,
  readEncounterBreadcrumbInfo,
  readRunBreadcrumbInfo,
} from "../components/breadcrumbLinkState";

const info = {
  logId: "log-1",
  logName: "My log",
  isLive: false,
  runName: "The Fractured Archive - 1",
  leaderboardName: null,
};

describe("run breadcrumb link state", () => {
  it("round-trips through serialized router state", () => {
    const state = structuredClone(createRunBreadcrumbLinkState(info));
    expect(readRunBreadcrumbInfo(state)).toEqual(info);
  });

  it.each([null, undefined, {}, { runBreadcrumb: { logId: "log-1" } }])(
    "ignores unusable state: %j",
    (state) => {
      expect(readRunBreadcrumbInfo(state)).toBeNull();
    },
  );

  it("links the log and leaves the run as the current page", () => {
    const [log, run] = getRunBreadcrumbSegments(info);
    expect(log.href).toBe("/log/log-1");
    expect(run.label).toBe(info.runName);
    expect(run.href).toBeUndefined();
  });
});

describe("encounter breadcrumb link state", () => {
  const encounter = {
    logId: "log-1",
    logName: "My log",
    isLive: false,
    run: { id: "run-1", name: "Run", leaderboardName: null },
    fightId: "fight-2",
    fightName: "Second",
    fights: [
      { id: "fight-1", name: "First" },
      { id: "fight-2", name: "Second" },
    ],
  };

  it("only applies to the fight it was created for", () => {
    const state = structuredClone(
      createEncounterBreadcrumbLinkState(encounter),
    );
    expect(readEncounterBreadcrumbInfo(state, "fight-2")).toEqual(encounter);
    expect(readEncounterBreadcrumbInfo(state, "fight-1")).toBeNull();
    expect(readEncounterBreadcrumbInfo(null, "fight-2")).toBeNull();
  });

  it("selects the current fight and links the next fight's state", () => {
    const onSelect = vi.fn();
    const select = getEncounterBreadcrumbSegments(encounter, onSelect)[2]
      .select;
    expect(select?.value).toBe(1);
    select?.onChange(0);
    expect(onSelect.mock.calls[0][0]).toBe("fight-1");
    expect(
      readEncounterBreadcrumbInfo(onSelect.mock.calls[0][1], "fight-1")
        ?.fightName,
    ).toBe("First");
  });

  it("uses plain labels without a run or with a single fight", () => {
    const noRun = getEncounterBreadcrumbSegments(
      { ...encounter, run: null },
      vi.fn(),
    );
    expect(noRun).toHaveLength(2);
    expect(noRun[1].select).toBeUndefined();
    const single = getEncounterBreadcrumbSegments(
      { ...encounter, fights: [encounter.fights[1]] },
      vi.fn(),
    );
    expect(single[2].select).toBeUndefined();
  });
});
