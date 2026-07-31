import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// Load environment variables exactly like Next.js does
loadEnvConfig(process.cwd());

// Point to the local in-memory Mock Supabase API route for E2E testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000/api/mock-supabase';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  /* Do not run tests in parallel to protect Supabase DB concurrency */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Limit to 1 worker for sequential execution to avoid database race conditions */
  workers: 1,
  /* Reporter to use */
  reporter: 'list',
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying a failed test. */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
  },
});
