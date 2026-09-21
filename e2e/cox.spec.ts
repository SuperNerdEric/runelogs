import { expect, test } from "@playwright/test";
import { mockApiOrigin } from "../playwright.config";
import { mockHomepageApis } from "./fixtures/api";

const fightGroupId = "cox-run-test";

const coxRunSummary = {
  id: fightGroupId,
  name: "Chambers of Xeric: Challenge Mode - 1",
  leaderboardName: "Chambers of Xeric: Challenge Mode",
  officialDurationTicks: 5305,
  displayDurationTicks: 5305,
  success: true,
  startTime: "2026-07-14T22:35:06.000Z",
  log: {
    id: "cox-log-test",
    uploaderId: "x1BaSSS",
    uploadedAt: "2026-07-15T00:23:01.000Z",
    name: "CoX CM (1)",
  },
  players: ["x1BaSSS", "DudaTheGod"],
  playerCount: 2,
  durationRank: null,
  durationPercentile: null,
  overallDps: [],
  playerRanks: [],
  fights: [
    {
      id: "olm-1",
      name: "Great Olm",
      startTime: "2026-07-15T00:14:21.000Z",
      fightDurationTicks: 1011,
      success: true,
      order: 0,
      dpsLeaderboardKey: "Great Olm",
    },
  ],
  extraInfo: {
    cox: {
      partySize: 2,
      teamPoints: 89074,
      playerPoints: 54911,
      playerName: "x1BaSSS",
      challengeMode: true,
    },
  },
};

test.describe("Chambers of Xeric leaderboards and run summary", () => {
  test("about page lists CoX and Challenge Mode rooms", async ({ page }) => {
    await page.goto("/about");

    await expect(
      page.getByRole("heading", { name: /leaderboards/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Chambers of Xeric", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Chambers of Xeric: Challenge Mode", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Great Olm", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Ice Demon").first()).toBeVisible();
  });

  test("run page reports raid scale, party points, and named player points", async ({
    page,
  }) => {
    await mockHomepageApis(page);
    await page.route(
      `${mockApiOrigin}/fightGroup/${fightGroupId}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(coxRunSummary),
        });
      },
    );

    await page.goto(`/run/${fightGroupId}`);

    const info = page.locator(".cox-raid-info");
    await expect(info).toBeVisible();
    await expect(info.getByText("Raid scale")).toBeVisible();
    await expect(info.getByText("2", { exact: true })).toBeVisible();
    await expect(info.getByText("Party points")).toBeVisible();
    await expect(info.getByText("89,074")).toBeVisible();
    await expect(info.getByText("x1BaSSS")).toBeVisible();
    await expect(info.getByText("54,911")).toBeVisible();
    await expect(page.getByText("Great Olm")).toBeVisible();
  });
});
