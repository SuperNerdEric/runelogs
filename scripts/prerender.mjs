import {execSync, spawn} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const BUILD_DIR = join(ROOT_DIR, 'build', '_prerender');
const PORT = 4173;
const PREVIEW_HOST = '127.0.0.1';

const ROUTES = [
    '/',
    '/about',
    '/help',
    '/privacy',
    '/upload',
    '/leaderboards',
    '/recent-encounters',
    '/live-log',
];

function startPreviewServer() {
    const isWindows = process.platform === 'win32';

    return spawn(
        isWindows ? 'npm' : 'npm',
        ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(PORT), '--strictPort'],
        {
            cwd: ROOT_DIR,
            detached: !isWindows,
            stdio: 'ignore',
            shell: isWindows,
            env: {...process.env, NODE_ENV: 'production'},
        },
    );
}

function stopPreviewServer(server) {
    if (!server?.pid) {
        return;
    }

    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /pid ${server.pid} /T /F`, {stdio: 'ignore'});
            return;
        }

        process.kill(-server.pid, 'SIGTERM');
    } catch {
        try {
            server.kill('SIGKILL');
        } catch {
            // Process already exited.
        }
    }
}

async function waitForPreviewServer() {
    const url = `http://${PREVIEW_HOST}:${PORT}/`;

    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
        } catch {
            // Preview server still starting.
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Vite preview server did not become ready in time.');
}

function outputPathForRoute(route) {
    if (route === '/') {
        return join(BUILD_DIR, 'index.html');
    }

    return join(BUILD_DIR, route.slice(1), 'index.html');
}

/** Bot-only HTML snapshots for crawlers — not deployed to user-facing paths. Run via `npm run build:prerender`. */

async function prerenderRoutes() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        for (const route of ROUTES) {
            await page.goto(`http://${PREVIEW_HOST}:${PORT}${route}`, {
                waitUntil: 'domcontentloaded',
                timeout: 120_000,
            });
            await page.waitForSelector('[data-seo-ready="true"]', {timeout: 60_000});

            const html = await page.content();
            const outputPath = outputPathForRoute(route);
            mkdirSync(dirname(outputPath), {recursive: true});
            writeFileSync(outputPath, html, 'utf8');
            console.log(`Prerendered ${route} -> ${outputPath}`);
        }
    } finally {
        await browser.close();
    }
}

async function main() {
    const server = startPreviewServer();

    try {
        await waitForPreviewServer();
        await prerenderRoutes();
    } finally {
        stopPreviewServer(server);
    }
}

main()
    .then(() => {
        console.log('Prerender complete.');
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
