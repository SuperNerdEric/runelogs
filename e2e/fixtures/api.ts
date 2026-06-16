import type {Page} from '@playwright/test';
import {mockApiOrigin} from '../../playwright.config';
import {mockLogResponse, testLogId} from './mockLog';

export async function mockLogApi(page: Page, options?: {status?: number; body?: unknown}) {
    const status = options?.status ?? 200;
    const body = options?.body ?? mockLogResponse;

    await page.route(`${mockApiOrigin}/log/${testLogId}`, async (route) => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(body),
        });
    });
}

export async function mockHomepageApis(page: Page) {
    await page.route(`${mockApiOrigin}/dps-leaderboard/config`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({groups: []}),
        });
    });

    await page.route(`${mockApiOrigin}/leaderboard**`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({entries: [], totalPages: 0}),
        });
    });

    await page.route(`${mockApiOrigin}/dps-leaderboard**`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({entries: [], totalPages: 0}),
        });
    });

    await page.route(`${mockApiOrigin}/recent-encounters**`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({entries: [], totalPages: 0}),
        });
    });
}
