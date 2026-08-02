import { test, expect } from '@playwright/test';
import { bypassAuth } from './helpers';

test.describe('Poster Flow E2E', () => {
  const email = 'test-poster@example.com';
  const password = 'password123';

  test.beforeEach(async ({ context }) => {
    // Log in programmatically as poster
    await bypassAuth(context, email, password, 'poster');
  });

  test('should create a listing and show the mock payment link', async ({ page }) => {
    // Navigate to /dashboard/poster
    await page.goto('/dashboard/poster');

    // Assert page header loaded
    await expect(page.locator('h1')).toContainText('Poster Workspace');

    // Click "Create New Listing"
    await page.click('text=Create New Listing');

    // Wait for modal form to be visible
    await expect(page.locator('text=Create New Testing Round')).toBeVisible();

    const uniqueTitle = `E2E Test Listing ${Date.now()}`;
    await page.fill('input[placeholder*="Rider App Map Pin"]', uniqueTitle);
    await page.fill(
      'textarea[placeholder*="Describe step-by-step"]',
      'This is a long mock description that contains at least twenty characters to satisfy schema validation rules.'
    );

    // Select Rate per Tester (e.g. 200)
    await page.selectOption('select:has-text("per tester")', '200');

    // Fill slots
    await page.fill('label:has-text("Slots Count") + input[type="number"]', '5');

    // Check "5-Second Quick Impression Test" (first checkbox in form)
    await page.locator('input[type="checkbox"]').first().check();

    // Enable A/B Comparative Testing (second checkbox in form) and fill variant URLs
    await page.locator('input[type="checkbox"]').nth(1).check();
    // Skip the Site URL field (first url input) — variant URLs are the 2nd and 3rd
    await page.locator('input[type="url"]').nth(1).fill('https://variant-a.example.com');
    await page.locator('input[type="url"]').nth(2).fill('https://variant-b.example.com');

    // Add accessibility requirements (fourth checkbox in form)
    await page.locator('input[type="checkbox"]').nth(3).check();

    // Select Demographic filters: Tech Literacy and Age Group
    // Age Group: 25-34 years old
    await page.selectOption('label:has-text("Target Age Group") + select', '25-34');
    // Tech Literacy: Non-Technical
    await page.selectOption('label:has-text("Target Tech Literacy") + select', 'non_technical');

    // Click Confirm and Fund
    await page.click('button[type="submit"]:has-text("Confirm and Fund")');

    // Verify sandbox payment mock link is generated and shown
    const mockCheckoutLink = page.locator('#mock-checkout-link');
    await expect(mockCheckoutLink).toBeVisible();
    const hrefValue = await mockCheckoutLink.getAttribute('href');
    expect(hrefValue).toContain('https://checkout.paymongo.com/mock/');

    // Click Done to close the success screen
    await page.click('button:has-text("Done")');

    // Verify the new listing appears in the main dashboard table with "Open / Funding"
    await expect(page.locator('table')).toContainText(uniqueTitle);
    const row = page.locator('tr', { hasText: uniqueTitle });
    await expect(row.locator('text=Open / Funding')).toBeVisible();
  });
});
