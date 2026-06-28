import { describe, expect, it } from "vitest";
import { tokenHasAdminPermission } from "../utils/authToken";

function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.signature`;
}

describe("tokenHasAdminPermission", () => {
  it("returns true when token includes admin permission", () => {
    const token = buildToken({ permissions: ["admin"] });
    expect(tokenHasAdminPermission(token)).toBe(true);
  });

  it("returns false when admin permission is missing", () => {
    const token = buildToken({ permissions: ["create:logs"] });
    expect(tokenHasAdminPermission(token)).toBe(false);
  });
});
