import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,  // Run sequentially — tests depend on created resources
    retries: 0,
    workers: 1,
    reporter: [['list'], ['html', { open: 'never' }]],
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:3002',
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
        },
    },
    projects: [
        {
            name: 'api',
            testMatch: /api\/.*\.spec\.js/,
        },
        {
            name: 'ui',
            testMatch: /ui\/.*\.spec\.js/,
            use: {
                baseURL: 'http://localhost:5175',
                headless: true,
                viewport: { width: 1280, height: 720 },
            },
        },
    ],
})
