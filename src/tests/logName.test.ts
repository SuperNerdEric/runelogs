import { describe, expect, it } from "vitest";
import { isLiveEmptyLogName, NO_ENCOUNTERS_LOG_NAME } from "../utils/logName";

describe("isLiveEmptyLogName", () => {
  it("returns true only for live logs named No encounters", () => {
    expect(isLiveEmptyLogName(NO_ENCOUNTERS_LOG_NAME, true)).toBe(true);
  });

  it("returns false for stopped logs named No encounters", () => {
    expect(isLiveEmptyLogName(NO_ENCOUNTERS_LOG_NAME, false)).toBe(false);
  });

  it("returns false for other live log names", () => {
    expect(isLiveEmptyLogName("ToB (1)", true)).toBe(false);
    expect(isLiveEmptyLogName(null, true)).toBe(false);
  });
});
