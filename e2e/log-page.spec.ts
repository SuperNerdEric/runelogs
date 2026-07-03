import { expect, test } from "@playwright/test";
import { mockLogApi } from "./fixtures/api";
import { mockLogResponse, testLogId } from "./fixtures/mockLog";

test.describe("Log page", () => {
  test.beforeEach(async ({ page }) => {
    await mockLogApi(page);
  });

  test("renders log metadata in the info box", async ({ page }) => {
    await page.goto(`/log/${testLogId}`);

    const infoBox = page.locator(".log-info-box");
    await expect(infoBox).toBeVisible();
    await expect(infoBox.getByText("Honorable")).toBeVisible();
    await expect(infoBox.getByText(mockLogResponse.name!)).toBeVisible();
    await expect(infoBox.getByText(testLogId)).toBeVisible();
    await expect(infoBox.getByText("Alchemical Hydra")).toBeVisible();
  });

  test("info box does not overflow horizontally on a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 357, height: 667 });
    await page.goto(`/log/${testLogId}`);

    await expect(page.locator(".log-info-box")).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const box = document.querySelector(".log-info-box");
      const boxRect = box?.getBoundingClientRect();
      const childOverflow = box
        ? [...box.children].some(
            (el) =>
              el.getBoundingClientRect().right > (boxRect?.right ?? 0) + 1,
          )
        : false;

      return {
        pageOverflow: doc.scrollWidth > doc.clientWidth,
        childOverflow,
      };
    });

    expect(overflow.pageOverflow).toBe(false);
    expect(overflow.childOverflow).toBe(false);
  });

  test("fight selector does not overflow horizontally on a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 357, height: 667 });
    await page.goto(`/log/${testLogId}`);

    const fightSelector = page.locator(".fight-selector");
    await expect(fightSelector).toBeVisible();
    await expect(
      fightSelector.getByText("The Maiden of Sugadinti"),
    ).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const listOverflow = [...document.querySelectorAll(".fight-list")].some(
        (el) => el.scrollWidth > el.clientWidth + 1,
      );
      const tileOverflow = [...document.querySelectorAll(".fight-tile")].some(
        (tile) => {
          const container = tile.closest(".damage-done-container");
          if (!container) {
            return false;
          }

          const containerRect = container.getBoundingClientRect();
          const tileRect = tile.getBoundingClientRect();
          return tileRect.right > containerRect.right + 1;
        },
      );

      return {
        pageOverflow: doc.scrollWidth > doc.clientWidth,
        listOverflow,
        tileOverflow,
      };
    });

    expect(overflow.pageOverflow).toBe(false);
    expect(overflow.listOverflow).toBe(false);
    expect(overflow.tileOverflow).toBe(false);
  });

  test("shows an error when the log API fails", async ({ page }) => {
    await page.unrouteAll();
    await mockLogApi(page, { status: 404, body: { error: "Not found" } });

    await page.goto(`/log/${testLogId}`);

    await expect(page.getByText(/error loading log/i)).toBeVisible();
    await expect(page.getByText(/status 404/i)).toBeVisible();
  });
});
