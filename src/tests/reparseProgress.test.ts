import { describe, expect, it } from "vitest";

import {

  combineMultiLogReparseProgress,

  getReparseStatusLabel,

} from "../utils/reparseProgress";



describe("combineMultiLogReparseProgress", () => {

  it("returns log progress for a single log", () => {

    expect(combineMultiLogReparseProgress(1, 1, 50)).toBe(50);

  });



  it("combines progress across multiple logs", () => {

    expect(combineMultiLogReparseProgress(2, 3, 60)).toBeCloseTo(53.333, 2);

  });

});



describe("getReparseStatusLabel", () => {

  it("uses backend phase labels when provided", () => {

    expect(

      getReparseStatusLabel({ phaseLabel: "Saving", progress: 60 }),

    ).toBe("Saving · 60%");

  });



  it("includes log position for bulk reparses", () => {

    expect(

      getReparseStatusLabel({

        phaseLabel: "Parsing",

        progress: 10,

        logIndex: 2,

        logTotal: 3,

      }),

    ).toBe("Parsing · log 2 of 3");

  });



  it("falls back to percent when phase label is missing", () => {

    expect(getReparseStatusLabel({ progress: 25 })).toBe("25%");

  });

});

