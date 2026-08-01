# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: poster-flow.spec.ts >> Poster Flow E2E >> should create a listing and show the mock payment link
- Location: tests\e2e\poster-flow.spec.ts:13:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Poster Workspace"
Received string:    "Welcome back"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    13 × locator resolved to <h1 class="text-3xl font-extrabold tracking-tight mb-2 text-[#1E1E1E]">Welcome back</h1>
       - unexpected value "Welcome back"

```

```yaml
- heading "Welcome back" [level=1]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { bypassAuth } from './helpers';
  3  | 
  4  | test.describe('Poster Flow E2E', () => {
  5  |   const email = 'test-poster@example.com';
  6  |   const password = 'password123';
  7  | 
  8  |   test.beforeEach(async ({ context }) => {
  9  |     // Log in programmatically as poster
  10 |     await bypassAuth(context, email, password, 'poster');
  11 |   });
  12 | 
  13 |   test('should create a listing and show the mock payment link', async ({ page }) => {
  14 |     // Navigate to /dashboard/poster
  15 |     await page.goto('/dashboard/poster');
  16 | 
  17 |     // Assert page header loaded
> 18 |     await expect(page.locator('h1')).toContainText('Poster Workspace');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  19 | 
  20 |     // Click "Create New Listing"
  21 |     await page.click('text=Create New Listing');
  22 | 
  23 |     // Wait for modal form to be visible
  24 |     await expect(page.locator('text=Create New Testing Round')).toBeVisible();
  25 | 
  26 |     const uniqueTitle = `E2E Test Listing ${Date.now()}`;
  27 |     await page.fill('input[placeholder*="Rider App Map Pin"]', uniqueTitle);
  28 |     await page.fill(
  29 |       'textarea[placeholder*="Describe step-by-step"]',
  30 |       'This is a long mock description that contains at least twenty characters to satisfy schema validation rules.'
  31 |     );
  32 | 
  33 |     // Select Rate per Tester (e.g. 200)
  34 |     await page.selectOption('select:has-text("per tester")', '200');
  35 | 
  36 |     // Fill slots
  37 |     await page.fill('label:has-text("Slots Count") + input[type="number"]', '5');
  38 | 
  39 |     // Check "5-Second Quick Impression Test" (first checkbox in form)
  40 |     await page.locator('input[type="checkbox"]').first().check();
  41 | 
  42 |     // Enable A/B Comparative Testing (second checkbox in form) and fill variant URLs
  43 |     await page.locator('input[type="checkbox"]').nth(1).check();
  44 |     await page.locator('input[type="url"]').first().fill('https://variant-a.example.com');
  45 |     await page.locator('input[type="url"]').last().fill('https://variant-b.example.com');
  46 | 
  47 |     // Add accessibility requirements (fourth checkbox in form)
  48 |     await page.locator('input[type="checkbox"]').nth(3).check();
  49 | 
  50 |     // Select Demographic filters: Tech Literacy and Age Group
  51 |     // Age Group: 25-34 years old
  52 |     await page.selectOption('label:has-text("Target Age Group") + select', '25-34');
  53 |     // Tech Literacy: Non-Technical
  54 |     await page.selectOption('label:has-text("Target Tech Literacy") + select', 'non_technical');
  55 | 
  56 |     // Click Confirm and Fund
  57 |     await page.click('button[type="submit"]:has-text("Confirm and Fund")');
  58 | 
  59 |     // Verify sandbox payment mock link is generated and shown
  60 |     const mockCheckoutLink = page.locator('#mock-checkout-link');
  61 |     await expect(mockCheckoutLink).toBeVisible();
  62 |     const hrefValue = await mockCheckoutLink.getAttribute('href');
  63 |     expect(hrefValue).toContain('https://checkout.paymongo.com/mock/');
  64 | 
  65 |     // Click Done to close the success screen
  66 |     await page.click('button:has-text("Done")');
  67 | 
  68 |     // Verify the new listing appears in the main dashboard table with "Open / Funding"
  69 |     await expect(page.locator('table')).toContainText(uniqueTitle);
  70 |     const row = page.locator('tr', { hasText: uniqueTitle });
  71 |     await expect(row.locator('text=Open / Funding')).toBeVisible();
  72 |   });
  73 | });
  74 | 
```