import { test, expect } from '@playwright/test';
import { bypassAuth, createMockListing } from './helpers';

test.describe('Tester Flow E2E', () => {
  const email = 'test-tester@example.com';
  const password = 'password123';

  test.beforeEach(async ({ context }) => {
    // Log in programmatically as tester
    await bypassAuth(context, email, password, 'tester');
  });

  test('should view tester workspace and access demographics modal', async ({ page }) => {
    // Navigate to /dashboard/tester
    await page.goto('/dashboard/tester');

    // Assert page loaded
    await expect(page.locator('h1')).toContainText('Tester Workspace');
    await expect(page.locator('text=Verified GCash Receiver')).toBeVisible();

    // Verify demographic profile configuration modal can be opened
    await page.click('text=Configure Demographics');
    await expect(page.locator('h3:has-text("Configure Profile Demographics")')).toBeVisible();

    // Close the modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Configure Profile Demographics")')).not.toBeVisible();
  });

  test('should complete the 5-second Quick Impression task page', async ({ page }) => {
    // Create a mock listing with is_quick_impression: true
    const uniqueTitle = `E2E Tester Job ${Date.now()}`;
    const listing = await createMockListing(uniqueTitle, true);

    // Navigate to /dashboard/tester/tasks/five-second/[id]
    await page.goto(`/dashboard/tester/tasks/five-second/${listing.id}`);

    // Wait for the agreement modal to be visible
    await expect(page.locator('text=Acknowledge Testing Guidelines')).toBeVisible();

    // Scroll to bottom of the Agreement modal to enable the Accept button
    const ndaScroll = page.locator('.overflow-y-auto.flex-1');
    await ndaScroll.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });

    // Accept the agreement
    await page.click('button:has-text("Accept")');

    // Assert the cover page loaded with correct title
    await expect(page.locator('h1')).toContainText(uniqueTitle);

    // Verify the "Start 5-Second Test" button is visible and click it
    const startButton = page.locator('button:has-text("Start 5-Second Test")');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Verify the impression countdown timer loads and displays
    await expect(page.locator('text=Viewing:')).toBeVisible();

    // Wait for it to expire and transition to the questionnaire step (takes 5 seconds)
    await expect(page.locator('text=What do you remember about the design?')).toBeVisible({ timeout: 10000 });

    // Verify the questionnaire step enables the response form
    const responseTextArea = page.locator('textarea');
    await expect(responseTextArea).toBeEnabled();

    // Fill in the questionnaire response
    await responseTextArea.fill('The design looked extremely clean and well structured, focusing on banking styles.');

    // Select visual clarity rating (e.g. 5)
    await page.click('button:has-text("5")');

    // Click submit button
    await page.click('button:has-text("Submit Test Output")');

    // Verify successful submission
    await expect(page.locator('text=Test Submitted Successfully!')).toBeVisible({ timeout: 10000 });
  });
});
