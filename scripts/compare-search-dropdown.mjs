import { chromium } from 'playwright';

const USERNAME = process.env.RL_USER ?? 'xemnas_666';
const PASSWORD = process.env.RL_PASS ?? 'itsasecret';

async function login(page, baseUrl) {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    if (await page.locator('.top-bar__user-trigger, .MuiToolbar-root button').filter({ hasText: /xemnas/i }).first().isVisible().catch(() => false)) return;
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/auth\.runelogs\.com/, { timeout: 30000 });
    await page.locator('input#username, input[name="username"]').first().fill(USERNAME);
    await page.locator('input[name="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /continue|log in/i }).first().click();
    await page.waitForURL(/localhost|runelogs\.com/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
}

async function sampleSearch(page, site) {
    const input = site === 'prod'
        ? page.locator('input[placeholder*="Search"], input[placeholder*="player"]').first()
        : page.locator('.player-search__input').first();
    await input.click();
    await input.fill('xem');
    await page.waitForTimeout(600);

    if (site === 'prod') {
        return page.evaluate(() => {
            const listbox = document.querySelector('[role="listbox"], .MuiAutocomplete-listbox, .MuiPaper-root');
            const option = document.querySelector('[role="option"], .MuiAutocomplete-option, .MuiMenuItem-root');
            const read = (el) => el ? getComputedStyle(el) : null;
            const ls = read(listbox);
            const os = read(option);
            return {
                listBg: ls?.backgroundColor,
                listColor: ls?.color,
                optionColor: os?.color,
                optionBg: os?.backgroundColor,
                listClass: listbox?.className?.slice(0, 100),
            };
        });
    }

    const popover = page.locator('.player-search__popover');
    if (!(await popover.isVisible().catch(() => false))) return { error: 'popover not visible' };
    return popover.first().evaluate((el) => {
        const opt = el.querySelector('.player-search__option');
        const read = (el) => el ? getComputedStyle(el) : null;
        const ps = read(el);
        const os = read(opt);
        return {
            listBg: ps?.backgroundColor,
            listColor: ps?.color,
            optionColor: os?.color,
            optionBg: os?.backgroundColor,
            listClass: el.className,
            padding: ps?.padding,
        };
    });
}

const browser = await chromium.launch();
for (const [site, url] of [['local', 'http://localhost:3000'], ['prod', 'https://runelogs.com']]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await login(page, url);
    const search = await sampleSearch(page, site);
    await page.screenshot({ path: `.screenshots/search-dropdown-${site}.png` });
    console.log(JSON.stringify({ site, search }, null, 2));
    await page.close();
}
await browser.close();
