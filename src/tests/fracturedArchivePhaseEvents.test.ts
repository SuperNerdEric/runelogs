import { describe, expect, it } from "vitest";
import {
  getArchiveGuardianGroundedWindows,
  getFracturedArchivePhaseMarkers,
} from "../utils/fracturedArchivePhaseEvents";
import { Fight } from "../models/Fight";
import { LogLine, LogTypes } from "../models/LogLine";

const TICK_MS = 600;
const BASE = {
  date: "11-04-2026",
  time: "12:00:00",
  timezone: "Z-0600",
};
const PLAYER = { name: "Player", isPlayer: true };

function npc(id: number, index = 1) {
  return { name: `NPC ${id}`, id, index };
}

function hit(
  tick: number,
  targetId: number,
  ratio?: number,
  scale = 100,
): LogLine {
  return {
    ...BASE,
    type: LogTypes.DAMAGE,
    tick,
    fightTimeMs: tick * TICK_MS,
    source: PLAYER,
    target: npc(targetId),
    hitsplatName: "DAMAGE_ME",
    damageAmount: 5,
    targetHealthRatio: ratio,
    targetHealthScale: ratio == null ? undefined : scale,
  } as LogLine;
}

function changed(tick: number, oldId: number, newId: number): LogLine {
  return {
    ...BASE,
    type: LogTypes.NPC_CHANGED,
    tick,
    fightTimeMs: tick * TICK_MS,
    oldNpc: npc(oldId),
    newNpc: npc(newId),
  } as LogLine;
}

function death(tick: number, id: number): LogLine {
  return {
    ...BASE,
    type: LogTypes.DEATH,
    tick,
    fightTimeMs: tick * TICK_MS,
    target: npc(id),
  } as LogLine;
}

function pillar(tick: number, index: number): LogLine {
  return {
    ...BASE,
    type: LogTypes.DAMAGE,
    tick,
    fightTimeMs: tick * TICK_MS,
    source: { name: "Unknown" },
    target: npc(16686, index),
    hitsplatName: "DAMAGE_OTHER",
    damageAmount: 100,
  } as LogLine;
}

function makeFight(data: LogLine[], lastTick = 500): Fight {
  const last = hit(lastTick, 1);
  return {
    data,
    lastLine: last,
    firstLine: data[0] ?? last,
  } as unknown as Fight;
}

function summary(fight: Fight) {
  return getFracturedArchivePhaseMarkers(fight).map((marker) => [
    marker.title,
    marker.tick,
  ]);
}

describe("Ocellus", () => {
  it("marks Phase 1-4 from NPC ids and 25% of the final health bar", () => {
    const markers = getFracturedArchivePhaseMarkers(
      makeFight([
        changed(0, 16671, 16674),
        hit(6, 16674, 99),
        hit(210, 16674, 4),
        changed(228, 16674, 16675),
        changed(359, 16675, 16677),
        hit(372, 16677, 94),
        hit(753, 16677, 26),
        hit(811, 16677, 25),
        hit(830, 16677, 20),
      ]),
    );

    expect(markers.map((m) => [m.label, m.tick, m.fightTimeMs])).toEqual([
      ["Phase 1", 0, 0],
      ["Phase 2", 228, 228 * TICK_MS],
      ["Phase 3", 359, 359 * TICK_MS],
      ["Phase 4", 811, 811 * TICK_MS],
    ]);
  });

  it("ignores low shield readings from Phase 1 for Phase 4", () => {
    expect(
      summary(
        makeFight([
          changed(0, 16671, 16674),
          hit(210, 16674, 4),
          changed(228, 16674, 16675),
          changed(359, 16675, 16677),
          hit(372, 16677, 90),
        ]),
      ),
    ).toEqual([
      ["Phase 1", 0],
      ["Phase 2", 228],
      ["Phase 3", 359],
    ]);
  });

  it("only marks phases the fight reached", () => {
    expect(
      summary(makeFight([changed(0, 16671, 16674), hit(6, 16674, 99)])),
    ).toEqual([["Phase 1", 0]]);
  });

  it("does not mark Phase 4 when hits have no health data", () => {
    expect(
      summary(
        makeFight([
          changed(228, 16674, 16675),
          changed(359, 16675, 16677),
          hit(372, 16677),
        ]),
      ),
    ).toEqual([
      ["Phase 1", 228],
      ["Phase 2", 228],
      ["Phase 3", 359],
    ]);
  });
});

describe("Archive Guardian", () => {
  const grounded = (start: number, end: number, lastHp: number) => [
    changed(start, 16659, 16660),
    hit(end - 1, 16660, lastHp),
    changed(end, 16660, 16659),
  ];

  it("marks Phase 2 at the last levitation near 33%", () => {
    const fight = makeFight([
      ...grounded(50, 85, 70),
      ...grounded(150, 180, 34),
      ...grounded(250, 264, 15),
      changed(300, 16659, 16660),
      changed(340, 16660, 16658),
    ]);
    expect(summary(fight)).toEqual([["Phase 2", 264]]);
  });

  it("does not mark Phase 2 when a wipe ends on a high levitation", () => {
    expect(summary(makeFight(grounded(50, 85, 70)))).toEqual([]);
  });

  it("does not mark Phase 2 without a grounded health reading", () => {
    const fight = makeFight([
      changed(50, 16659, 16660),
      changed(85, 16660, 16659),
    ]);
    expect(summary(fight)).toEqual([]);
  });

  it("builds grounded windows ending at levitation or death", () => {
    const fight = makeFight([
      changed(5, 16657, 16659),
      ...grounded(50, 85, 70),
      changed(300, 16659, 16660),
      changed(340, 16660, 16658),
    ]);
    expect(getArchiveGuardianGroundedWindows(fight)).toEqual([
      {
        groundedNumber: 1,
        startFightTimeMs: 50 * TICK_MS,
        startTick: 50,
        endFightTimeMs: 85 * TICK_MS,
        endTick: 85,
        endsWithLevitation: true,
      },
      {
        groundedNumber: 2,
        startFightTimeMs: 300 * TICK_MS,
        startTick: 300,
        endFightTimeMs: 340 * TICK_MS,
        endTick: 340,
        endsWithLevitation: false,
      },
    ]);
  });

  it("extends an open grounded window to the end of the fight", () => {
    const [window] = getArchiveGuardianGroundedWindows(
      makeFight([changed(50, 16659, 16660)], 90),
    );
    expect(window.endTick).toBe(90);
    expect(window.endsWithLevitation).toBe(false);
  });
});

describe("Ezekiel", () => {
  it("marks enrage on the first hit below 35%", () => {
    expect(
      summary(
        makeFight([
          hit(10, 16652, 69, 70),
          hit(127, 16652, 25, 70),
          hit(129, 16652, 24, 70),
          hit(140, 16652, 20, 70),
        ]),
      ),
    ).toEqual([["Enrage", 129]]);
  });
});

describe("Bork and the Smorks", () => {
  it("marks enrage when Bork dies with the Smorks still alive", () => {
    expect(
      summary(
        makeFight([
          hit(300, 16640, 1, 30),
          death(305, 16640),
          hit(320, 16641, 5, 40),
        ]),
      ),
    ).toEqual([["Enrage: Bork Dead", 305]]);
  });

  it("marks enrage when the Smorks die first", () => {
    expect(
      summary(
        makeFight([
          hit(300, 16641, 1, 40),
          death(305, 16641),
          hit(320, 16640, 5, 30),
        ]),
      ),
    ).toEqual([["Enrage: Smorks Dead", 305]]);
  });

  it("does not mark a death that ends the fight", () => {
    expect(
      summary(makeFight([hit(300, 16641, 1, 40), death(305, 16640)])),
    ).toEqual([]);
  });
});

describe("Moia", () => {
  it("marks enrage on the first hit at or below 33%", () => {
    expect(
      summary(
        makeFight([
          hit(150, 16667, 38),
          hit(157, 16667, 33),
          hit(158, 16667, 31),
          hit(176, 16667, 0, 30),
        ]),
      ),
    ).toEqual([["Enrage", 157]]);
  });

  it("uses the last normal hit when the threshold first shows on the new bar", () => {
    expect(
      summary(
        makeFight([
          hit(170, 16667, 40),
          hit(185, 16667, 36),
          hit(207, 16667, 0, 30),
        ]),
      ),
    ).toEqual([["Enrage", 185]]);
  });
});

describe("Dreadnoth", () => {
  it("marks each slam threshold and enrage on its first crossing", () => {
    expect(
      summary(
        makeFight([
          hit(10, 16665, 85, 90),
          hit(30, 16665, 76, 90),
          hit(60, 16665, 58, 90),
          hit(100, 16665, 40, 90),
          hit(150, 16665, 22, 90),
          hit(155, 16665, 25, 90),
        ]),
      ),
    ).toEqual([
      ["85% Slam", 30],
      ["65% Slam", 60],
      ["45% Slam", 100],
      ["Enrage", 150],
    ]);
  });

  it("marks one threshold when a single hit crosses two", () => {
    expect(
      summary(makeFight([hit(10, 16665, 88, 90), hit(30, 16665, 58, 90)])),
    ).toEqual([
      ["85% Slam", 30],
      ["65% Slam", 30],
    ]);
  });
});

describe("Xarth", () => {
  it("marks Phase 2 at the third destroyed pillar", () => {
    expect(
      summary(
        makeFight([
          hit(10, 16684, 99),
          pillar(32, 1),
          pillar(63, 2),
          pillar(94, 3),
          hit(100, 16684, 70),
        ]),
      ),
    ).toEqual([["Phase 2", 94]]);
  });

  it("counts pillars destroyed on the same tick separately", () => {
    expect(
      summary(makeFight([pillar(32, 1), pillar(63, 2), pillar(63, 3)])),
    ).toEqual([["Phase 2", 63]]);
  });

  it("does not mark Phase 2 before every pillar is gone", () => {
    expect(summary(makeFight([pillar(32, 1), pillar(63, 2)]))).toEqual([]);
  });
});

describe("other fights", () => {
  it("returns nothing for the Dagon'hai Trio and unrelated NPCs", () => {
    const fight = makeFight([
      changed(10, 16643, 16644),
      hit(20, 16644, 10),
      hit(30, 8339, 10),
    ]);
    expect(getFracturedArchivePhaseMarkers(fight)).toEqual([]);
    expect(getArchiveGuardianGroundedWindows(fight)).toEqual([]);
  });

  it("skips log lines without timing", () => {
    const untimed = { ...hit(20, 16652, 10, 70), fightTimeMs: undefined };
    expect(summary(makeFight([untimed as LogLine]))).toEqual([]);
  });
});
