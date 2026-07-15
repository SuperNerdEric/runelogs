import { describe, expect, it } from "vitest";
import {
  formatDisplayUsername,
  usernamesEqual,
  usernameToPathSegment,
} from "../utils/utils";

describe("formatDisplayUsername", () => {
  it("capitalizes and replaces underscores", () => {
    expect(formatDisplayUsername("honorable")).toBe("Honorable");
    expect(formatDisplayUsername("iron_man")).toBe("Iron Man");
  });
});

describe("usernameToPathSegment", () => {
  it("converts display spaces back to underscores", () => {
    expect(usernameToPathSegment("Iron Man")).toBe("Iron_Man");
  });
});

describe("usernamesEqual", () => {
  it("compares case-insensitively and treats space and underscore as equal", () => {
    expect(usernamesEqual("honorable", "Honorable")).toBe(true);
    expect(usernamesEqual("iron_man", "Iron Man")).toBe(true);
    expect(usernamesEqual("alice", "bob")).toBe(false);
  });
});
