import {expect, test} from '@playwright/test';
import {mockHomepageApis} from './fixtures/api';

test.describe('Client routing', () => {
    test('help page loads without API calls', async ({page}) => {
        await page.goto('/help');

        await expect(page.getByRole('heading', {name: /frequently asked questions/i})).toBeVisible();
        await expect(page.getByRole('button', {name: 'What is Runelogs?'})).toBeVisible();
    });

    test('home page shell renders with mocked leaderboard APIs', async ({page}) => {
        await mockHomepageApis(page);
        await page.goto('/');

        await expect(page.getByRole('link', {name: /runelogs/i})).toBeVisible();
        await expect(page.getByRole('link', {name: 'Combat Logger'})).toBeVisible();
    });

    test('top bar home link returns to the homepage', async ({page}) => {
        await mockHomepageApis(page);
        await page.goto('/help');
        await page.getByRole('link', {name: /runelogs/i}).click();

        await expect(page).toHaveURL('/');
        await expect(page.getByRole('link', {name: 'Combat Logger'})).toBeVisible();
    });
});
