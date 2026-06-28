import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const USERNAME = process.env.RL_USER ?? 'xemnas_666';
const PASSWORD = process.env.RL_PASS ?? 'itsasecret';
const outDir = '.screenshots';
mkdirSync(outDir, { recursive: true });

const viewports = [
    { name: '357x667', width: 357, height: 667 },
    { name: '834x1210', width: 834, height: 1210 },
    { name: '1280x720', width: 1280, height: 720 },
    { name: '1920x1080', width: 1920, height: 1080 },
];

async function login(page) {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const loginBtn = page.getByRole('button', { name: /log in/i });
    if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loginBtn.click();
    } else {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    }

    await page.waitForURL(/auth\.runelogs\.com|auth0\.com|\/login/, { timeout: 30000 });

    if (/auth\.runelogs\.com|auth0\.com/.test(page.url())) {
        const usernameField = page.locator(
            'input[name="username"], input[name="email"], input[type="email"], input#username',
        ).first();
        await usernameField.waitFor({ state: 'visible', timeout: 20000 });
        await usernameField.fill(USERNAME);

        const passwordField = page.locator('input[name="password"], input[type="password"]').first();
        await passwordField.fill(PASSWORD);

        const continueBtn = page.getByRole('button', {
            name: /continue|log in|sign in|submit/i,
        }).first();
        await continueBtn.click();

        await page.waitForURL(/localhost:\d+/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');
    }
}

async function openUserMenu(page) {
    const trigger = page.locator('.top-bar__user-trigger').first();
    await trigger.waitFor({ state: 'visible', timeout: 15000 });
    await trigger.click();
    await page.locator('.user-menu-content[data-state="open"], .user-menu-content').first()
        .waitFor({ state: 'visible', timeout: 5000 });
}

function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return rgb;
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return rgb;
    return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

async function readMenuStyles(page) {
    return page.evaluate(() => {
        const menu = document.querySelector('.user-menu-content');
        const item = document.querySelector('.user-menu-content .user-menu-item');
        const icon = document.querySelector('.user-menu-content .top-bar__menu-item-icon');
        const svg = icon?.querySelector('svg');
        if (!menu || !item) return null;
        const ms = getComputedStyle(menu);
        const is = getComputedStyle(item);
        const ics = icon ? getComputedStyle(icon) : null;
        const ss = svg ? getComputedStyle(svg) : null;
        return {
            menu: {
                bg: ms.backgroundColor,
                color: ms.color,
                border: ms.borderColor,
                className: menu.className,
            },
            item: {
                bg: is.backgroundColor,
                color: is.color,
                fontSize: is.fontSize,
                padding: is.padding,
            },
            icon: icon ? { color: ics.color } : null,
            svg: svg ? { color: ss.color, stroke: svg.getAttribute('stroke') } : null,
            itemText: item.textContent?.trim(),
        };
    });
}

const browser = await chromium.launch();
const context = await browser.newContext();
const loginPage = await context.newPage();

try {
    await login(loginPage);
    console.log('Logged in at:', loginPage.url());
    const authed = await loginPage.locator('.top-bar__user-trigger').isVisible({ timeout: 10000 }).catch(() => false);
    console.log('User menu trigger visible:', authed);
    if (!authed) {
        await loginPage.screenshot({ path: `${outDir}/login-failed.png`, fullPage: true });
        throw new Error('Login did not show user menu trigger');
    }
} catch (err) {
    console.error('Login failed:', err.message);
    await browser.close();
    process.exit(1);
}

const expected = {
    menuBg: '#010409',
    menuText: '#ffffff',
    iconColor: '#388bfd',
    hoverBg: '#30363d',
};

for (const vp of viewports) {
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    await openUserMenu(page);
    await page.waitForTimeout(200);

    const styles = await readMenuStyles(page);
    const stylesHex = styles ? {
        menuBg: rgbToHex(styles.menu.bg),
        menuText: rgbToHex(styles.menu.color),
        itemText: rgbToHex(styles.item.color),
        iconColor: styles.icon ? rgbToHex(styles.icon.color) : null,
    } : null;

    await page.screenshot({ path: `${outDir}/user-menu-${vp.name}.png` });

    // Hover first item
    const firstItem = page.locator('.user-menu-content .user-menu-item').first();
    await firstItem.hover();
    await page.waitForTimeout(150);
    const hoverStyles = await page.evaluate(() => {
        const item = document.querySelector('.user-menu-content .user-menu-item[data-highlighted]')
            ?? document.querySelector('.user-menu-content .user-menu-item');
        if (!item) return null;
        const s = getComputedStyle(item);
        return { bg: s.backgroundColor, color: s.color };
    });

    console.log(JSON.stringify({
        viewport: vp.name,
        styles,
        stylesHex,
        hoverHex: hoverStyles ? { bg: rgbToHex(hoverStyles.bg), color: rgbToHex(hoverStyles.color) } : null,
        expected,
        mismatches: stylesHex ? Object.entries({
            menuBg: stylesHex.menuBg !== expected.menuBg ? `got ${stylesHex.menuBg}` : null,
            menuText: stylesHex.menuText !== expected.menuText ? `got ${stylesHex.menuText}` : null,
            iconColor: stylesHex.iconColor !== expected.iconColor ? `got ${stylesHex.iconColor}` : null,
        }).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`) : ['menu not found'],
    }, null, 2));

    await page.close();
}

await browser.close();
