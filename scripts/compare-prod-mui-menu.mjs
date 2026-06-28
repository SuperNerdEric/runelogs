import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const PROD = 'https://runelogs.com';
const USERNAME = process.env.RL_USER ?? 'xemnas_666';
const PASSWORD = process.env.RL_PASS ?? 'itsasecret';
mkdirSync('.screenshots', { recursive: true });

async function login(page) {
    await page.goto(`${PROD}/`, { waitUntil: 'networkidle' });
    const loginBtn = page.getByRole('button', { name: /log in/i });
    await loginBtn.click({ timeout: 15000 });
    await page.waitForURL(/auth\.runelogs\.com|auth0\.com/, { timeout: 30000 });
    await page.locator('input[name="username"], input#username').first().fill(USERNAME);
    await page.locator('input[name="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /continue|log in|sign in/i }).first().click();
    await page.waitForURL(/runelogs\.com/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await login(page);

// MUI production: click avatar/username button
const trigger = page.locator('header button, .MuiToolbar-root button').filter({ hasText: /xemnas|user/i }).last();
if (!(await trigger.isVisible().catch(() => false))) {
    // fallback: last button in toolbar right side
    await page.locator('.MuiToolbar-root > div button').last().click();
} else {
    await trigger.click();
}

await page.waitForTimeout(500);
await page.screenshot({ path: '.screenshots/prod-user-menu.png' });

const prodStyles = await page.evaluate(() => {
    const paper = document.querySelector('.MuiPaper-root.MuiMenu-paper, .MuiMenu-paper, [role="menu"]');
    const item = document.querySelector('.MuiMenuItem-root, [role="menuitem"]');
    const icon = document.querySelector('.MuiListItemIcon-root');
    const read = (el) => el ? getComputedStyle(el) : null;
    const ps = read(paper);
    const is = read(item);
    const ics = read(icon);
    return {
        paperBg: ps?.backgroundColor,
        paperColor: ps?.color,
        itemColor: is?.color,
        itemFontSize: is?.fontSize,
        iconColor: ics?.color,
        paperClass: paper?.className?.slice(0, 120),
    };
});

console.log(JSON.stringify(prodStyles, null, 2));
await browser.close();
