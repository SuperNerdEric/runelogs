import {
  getTargetTickFromTime,
  getTickOffsetFromTime,
  getTimeFromTickOffset,
} from "../lib/replayTiming";

describe("replayTiming tick round-trips", () => {
  // Offsets where `n * 0.6 / 0.6` undershoots in IEEE-754 and naive floor snaps back.
  const fragileOffsets = [31, 57, 62, 109, 114, 119, 124];

  it.each(fragileOffsets)(
    "maps click time for offset %i back to the same tick",
    (offset) => {
      const time = getTimeFromTickOffset(offset);
      expect(getTickOffsetFromTime(time)).toBe(offset);
      expect(getTargetTickFromTime(time, 100)).toBe(100 + offset);
    },
  );

  it("keeps mid-tick playback on the current tick", () => {
    const start = getTimeFromTickOffset(62);
    const mid = start + 0.3;
    expect(getTickOffsetFromTime(mid)).toBe(62);
  });

  it("advances at the next tick boundary", () => {
    expect(getTickOffsetFromTime(getTimeFromTickOffset(63))).toBe(63);
  });
});
