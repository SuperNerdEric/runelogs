import { expect, test } from "@playwright/test";
import { mockHomepageApis } from "./fixtures/api";

test.describe("Client routing", () => {
  test("help page loads without API calls", async ({ page }) => {
    await page.goto("/help");

    await expect(page.getByRole("heading", { name: /^help$/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /frequently asked questions/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What is Runelogs?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^support$/i }),
    ).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /discord/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /github/i })).toBeVisible();
  });

  test("home page shell renders with mocked leaderboard APIs", async ({
    page,
  }) => {
    await mockHomepageApis(page);
    await page.goto("/");

    await expect(
      page.getByRole("banner").getByRole("link", { name: /runelogs/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Combat Logger" }),
    ).toBeVisible();
  });

  test("unknown routes show the not found page", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.getByTestId("not-found-page")).toBeVisible();
    await expect(page.getByText("404", { exact: true })).toBeVisible();
    // The heading is a randomly picked NPC quote, so only check that one shows.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    await expect(
      page.getByRole("link", { name: /back home/i }),
    ).toHaveAttribute("href", "/");
  });

  test("top bar home link returns to the homepage", async ({ page }) => {
    await mockHomepageApis(page);
    await page.goto("/help");
    await page
      .getByRole("banner")
      .getByRole("link", { name: /runelogs/i })
      .click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("main").getByRole("link", { name: "Combat Logger" }),
    ).toBeVisible();
  });
});
