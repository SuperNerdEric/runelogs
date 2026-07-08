import { describe, expect, it } from "vitest";
import { getParentActorFilter } from "../utils/actorFilter";
import { describe, expect, it } from "vitest";
import { getParentActorFilter } from "../utils/actorFilter";
import {
  buildDamageDoneDrillSearch,
  formatDamageDoneDrillLabel,
  getDamageDoneDrillBackAction,
  getDamageDoneDrillSegments,
  isDamageDoneDrilledIn,
} from "../utils/damageDoneDrillDown";
describe("getParentActorFilter", () => {
  it("removes index while keeping id", () => {
    expect(
      getParentActorFilter({ name: "Nechryael", id: 8, index: 1 }),
    ).toEqual({ name: "Nechryael", id: 8 });
  });

  it("removes id at name level", () => {
    expect(getParentActorFilter({ name: "Nechryael", id: 8 })).toEqual({
      name: "Nechryael",
    });
  });

  it("removes index when id is absent", () => {
    expect(getParentActorFilter({ name: "Player1", index: 2 })).toEqual({
      name: "Player1",
    });
  });

  it("returns null for name-only filters", () => {
    expect(getParentActorFilter({ name: "Player1" })).toBeNull();
  });
});

describe("damageDoneDrillDown", () => {
  it("detects when damage done is drilled in", () => {
    expect(isDamageDoneDrilledIn(null)).toBe(false);
    expect(isDamageDoneDrilledIn({ name: "Player1" })).toBe(true);
  });

  it("steps back through target drill levels before source", () => {
    expect(
      getDamageDoneDrillBackAction(
        { name: "Player1" },
        { name: "Nechryael", id: 8, index: 1 },
      ),
    ).toEqual({
      param: "target",
      filter: { name: "Nechryael", id: 8 },
    });

    expect(
      getDamageDoneDrillBackAction(
        { name: "Player1" },
        { name: "Nechryael", id: 8 },
      ),
    ).toEqual({
      param: "target",
      filter: { name: "Nechryael" },
    });

    expect(
      getDamageDoneDrillBackAction({ name: "Player1" }, { name: "Nechryael" }),
    ).toEqual({
      param: "target",
      filter: null,
    });
  });

  it("steps back through source drill levels when target is unset", () => {
    expect(
      getDamageDoneDrillBackAction({ name: "Player1", index: 2 }, null),
    ).toEqual({
      param: "source",
      filter: { name: "Player1" },
    });

    expect(getDamageDoneDrillBackAction({ name: "Player1" }, null)).toEqual({
      param: "source",
      filter: null,
    });
  });

  it("formats breadcrumb labels for source and target drill paths", () => {
    expect(formatDamageDoneDrillLabel({ name: "Player1" }, null)).toBe(
      "Player1",
    );

    expect(
      formatDamageDoneDrillLabel(
        { name: "Player1" },
        { name: "Nechryael", id: 8, index: 1 },
      ),
    ).toBe("Player1 › Nechryael › ID 8 › Index 1");
  });

  it("builds breadcrumb segment filter state for each drill level", () => {
    expect(
      getDamageDoneDrillSegments(
        { name: "Player1" },
        { name: "Nechryael", id: 8, index: 1 },
      ),
    ).toEqual([
      {
        label: "Player1",
        sourceFilter: { name: "Player1" },
        targetFilter: null,
      },
      {
        label: "Nechryael",
        sourceFilter: { name: "Player1" },
        targetFilter: { name: "Nechryael" },
      },
      {
        label: "ID 8",
        sourceFilter: { name: "Player1" },
        targetFilter: { name: "Nechryael", id: 8 },
      },
      {
        label: "Index 1",
        sourceFilter: { name: "Player1" },
        targetFilter: { name: "Nechryael", id: 8, index: 1 },
      },
    ]);
  });

  it("includes source id and index levels before target segments", () => {
    expect(
      getDamageDoneDrillSegments(
        { name: "Player1", id: 2, index: 1 },
        { name: "Nechryael", id: 8 },
      ),
    ).toEqual([
      {
        label: "Player1",
        sourceFilter: { name: "Player1" },
        targetFilter: null,
      },
      {
        label: "ID 2",
        sourceFilter: { name: "Player1", id: 2 },
        targetFilter: null,
      },
      {
        label: "Index 1",
        sourceFilter: { name: "Player1", id: 2, index: 1 },
        targetFilter: null,
      },
      {
        label: "Nechryael",
        sourceFilter: { name: "Player1", id: 2, index: 1 },
        targetFilter: { name: "Nechryael" },
      },
      {
        label: "ID 8",
        sourceFilter: { name: "Player1", id: 2, index: 1 },
        targetFilter: { name: "Nechryael", id: 8 },
      },
    ]);
  });

  it("builds drill search params for breadcrumb navigation", () => {
    const baseParams = new URLSearchParams("tab=Summary&equipment=foo");
    expect(
      buildDamageDoneDrillSearch(
        baseParams,
        { name: "Player1" },
        { name: "Nechryael", id: 8 },
      ),
    ).toBe(
      "tab=Damage+Done&equipment=foo&source=Player1%7C%7C&target=Nechryael%7C8%7C",
    );
  });
});
