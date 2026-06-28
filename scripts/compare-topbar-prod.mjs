import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const LOCAL = process.env.LOCAL_URL ?? 'http://localhost:3000';
const PROD = process.env.PROD_URL ?? 'https://runelogs.com';
const USERNAME = process.env.RL_USER ?? 'xemnas_666';
const PASSWORD = process.env.RL_PASS ?? 'itsasecret';
mkdirSync('.screenshots', { recursive: true });

async function login(page, baseUrl) {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    const loginBtn = page.getByRole('button', { name: /log in/i });
    if (await loginBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await loginBtn.click();
    } else if (await page.locator('.top-bar__user-trigger').isVisible().catch(() => false)) {
        return;
    } else {
        await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    }

    if (/auth\.runelogs\.com|auth0\.com/.test(page.url()) || page.url().includes('/login')) {
        await page.waitForURL(/auth\.runelogs\.com|auth0\.com/, { timeout: 30000 }).catch(() => {});
        if (/auth\.runelogs\.com|auth0\.com/.test(page.url())) {
            await page.locator('input[name="username"], input[name="email"], input#username').first()
                .fill(USERNAME, { timeout: 20000 });
            await page.locator('input[name="password"], input[type="password"]').first().fill(PASSWORD);
            await page.getByRole('button', { name: /continue|log in|sign in/i }).first().click();
            await page.waitForURL(new RegExp(baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 60000 });
            await page.waitForLoadState('networkidle');
        }
    }
}

async function sampleDropdown(page, label) {
    await page.locator('.top-bar__user-trigger').click();
    await page.locator('[role="menu"].user-menu-content, .user-menu-content[role="menu"]').first()
        .waitFor({ state: 'visible', timeout: 5000 });

    return page.evaluate((label) => {
        const menu = document.querySelector('.user-menu-content');
        const trigger = document.querySelector('.top-bar__user-trigger');
        const username = trigger?.querySelector('.text-account, .font-semibold');
        const chevron = trigger?.querySelector('svg.lucide-chevron-down, svg');
        const item = document.querySelector('.user-menu-content [role="menuitem"]');
        const icon = document.querySelector('.user-menu-content .top-bar__menu-item-icon');
        const read = (el) => el ? getComputedStyle(el) : null;
        const ms = read(menu);
        const ts = read(trigger);
        const us = username ? read(username) : null;
        const cs = chevron ? read(chevron) : null;
        const is = read(item);
        const ics = read(icon);
        return {
            label,
            menuBg: ms?.backgroundColor,
            menuColor: ms?.color,
            menuClasses: menu?.className,
            triggerColor: ts?.color,
            usernameColor: us?.color,
            chevronColor: cs?.color,
            itemColor: is?.color,
            itemFontSize: is?.fontSize,
            iconColor: ics?.color,
        };
    }, label);
}

async function samplePlayerSearch(page) {
    const input = page.locator('.player-search__input').first();
    if (!(await input.isVisible().catch(() => false))) return null;
    await input.fill('xem');
    await page.waitForTimeout(500);
    const popover = page.locator('.player-search__popover');
    if (!(await popover.isVisible().catch(() => false))) return null;
    return popover.first().evaluate((el) => {
        const s = getComputedStyle(el);
        const opt = el.querySelector('.player-search__option');
        const os = opt ? getComputedStyle(opt) : null;
        return {
            bg: s.backgroundColor,
            color: s.color,
            optionColor: os?.color,
            classes: el.className,
        };
    });
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

for (const [name, url] of [['local', LOCAL], ['prod', PROD]]) {
    const page = await context.newPage();
    try {
        await login(page, url);
        await page.waitForTimeout(1000);
        const menu = await sampleDropdown(page, name);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const search = await samplePlayerSearch(page);
        await page.screenshot({ path: `.screenshots/compare-${name}-1280.png` });
        console.log(JSON.stringify({ site: name, url: page.url(), menu, search }, null, 2));
    } catch (err) {
        console.log(JSON.stringify({ site: name, error: err.message }, null, 2));
        await page.screenshot({ path: `.screenshots/compare-${name}-error.png` });
    }
    await page.close();
}

await browser.close();
