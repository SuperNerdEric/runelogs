import { describe, expect, it } from "vitest";
import {
  resolveContentSpriteKey,
  resolveEncounterRowSpriteKey,
  resolveFightGroupSpriteKey,
  resolveFightSpriteKey,
  resolveLeaderboardSpriteKey,
} from "../lib/hiscoreSprites";
import { RECENT_ENCOUNTERS_ALL_CONTENT } from "../utils/leaderboardContent";

describe("hiscoreSprites", () => {
  it("maps leaderboard content values to sprite keys", () => {
    expect(resolveContentSpriteKey("Theatre of Blood")).toBe(
      "theatre_of_blood",
    );
    expect(resolveContentSpriteKey("Tombs of Amascut: Expert Mode")).toBe(
      "tombs_of_amascut_expert",
    );
    expect(resolveContentSpriteKey("Fight Caves")).toBe("tztok_jad");
    expect(resolveContentSpriteKey("The Inferno")).toBe("tzkal_zuk");
    expect(resolveContentSpriteKey(RECENT_ENCOUNTERS_ALL_CONTENT)).toBe(
      "overall",
    );
  });

  it("resolves fight group display names with party suffixes", () => {
    expect(resolveFightGroupSpriteKey("Theatre of Blood - 4")).toBe(
      "theatre_of_blood",
    );
    expect(resolveFightGroupSpriteKey("Yama - Incomplete")).toBe("yama");
  });

  it("prefers explicit leaderboard names", () => {
    expect(
      resolveFightGroupSpriteKey("Custom label", "Doom of Mokhaiotl"),
    ).toBe("doom_of_mokhaiotl");
  });

  it("resolves DPS fight keys", () => {
    expect(resolveFightSpriteKey("Overall", "Theatre of Blood")).toBe(
      "overall",
    );
    expect(resolveFightSpriteKey("Maiden", "Theatre of Blood")).toBe(
      "theatre_of_blood",
    );
    expect(resolveFightSpriteKey("TzTok-Jad", "Fight Caves")).toBe("tztok_jad");
    expect(resolveFightSpriteKey("TzKal-Zuk", "The Inferno")).toBe("tzkal_zuk");
  });

  it("resolves wave boss names on encounter rows", () => {
    expect(
      resolveEncounterRowSpriteKey("fight", "TzTok-Jad", "Fight Caves"),
    ).toBe("tztok_jad");
    expect(
      resolveEncounterRowSpriteKey("fight", "TzKal-Zuk", "The Inferno"),
    ).toBe("tzkal_zuk");
    expect(resolveEncounterRowSpriteKey("fight", "Maggot King", null)).toBe(
      "maggot_king",
    );
    expect(resolveFightGroupSpriteKey("TzTok-Jad")).toBe("tztok_jad");
  });

  it("resolves recent encounter rows", () => {
    expect(
      resolveEncounterRowSpriteKey("fightGroup", null, "Tombs of Amascut"),
    ).toBe("tombs_of_amascut");
    expect(resolveEncounterRowSpriteKey("fight", "Yama", null)).toBe("yama");
  });

  it("resolves standalone leaderboard content names", () => {
    expect(resolveLeaderboardSpriteKey("Yama")).toBe("yama");
  });
});
