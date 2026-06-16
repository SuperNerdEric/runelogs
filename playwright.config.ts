import {defineConfig, devices} from '@playwright/test';

const port = 4173;
const host = '127.0.0.1';
const baseURL = `http://${host}:${port}`;
const mockApiOrigin = 'http://127.0.0.1:3999';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
    ],
    webServer: {
        command: `npm run dev -- --host ${host} --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            VITE_API_URL: mockApiOrigin,
        },
    },
});

export {mockApiOrigin};
