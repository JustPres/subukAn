# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tester-flow.spec.ts >> Tester Flow E2E >> should complete the 5-second Quick Impression task page
- Location: tests\e2e\tester-flow.spec.ts:33:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Acknowledge Testing Guidelines')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Acknowledge Testing Guidelines')

```

```yaml
- main:
  - text: subukAn PILOT
  - heading "Welcome back" [level=1]
  - paragraph: Sign in to manage listings, submit app tests, and track secure escrow payouts.
  - text: Email Address
  - textbox "e.g. test-poster@example.com"
  - text: Password
  - textbox "••••••••"
  - button "Sign In with Email"
  - text: OR
  - button "Continue with Google":
    - img
    - text: Continue with Google
  - button "Continue with GitHub":
    - img
    - text: Continue with GitHub
  - paragraph:
    - strong: "Role Routing:"
    - text: After authenticating, you will choose whether to enter the
    - strong: Poster Dashboard
    - text: (to post test listings and set up escrow) or the
    - strong: Tester Dashboard
    - text: (to complete task checklists and receive payments).
  - paragraph:
    - strong: "Secure Escrow:"
    - text: Testing allocations are secured safely via our integrated payment gateway (PayMongo/Xendit) before tasks are released.
  - link "Go back to homepage":
    - /url: /
    - text: Go back to homepage
    - img
  - text: © 2026 subukAn. All rights reserved. Security Policy Terms of Service Privacy Policy
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { bypassAuth, createMockListing } from './helpers';
  3   | 
  4   | test.describe('Tester Flow E2E', () => {
  5   |   const email = 'test-tester@example.com';
  6   |   const password = 'password123';
  7   | 
  8   |   test.beforeEach(async ({ context }) => {
  9   |     // Log in programmatically as tester
  10  |     await bypassAuth(context, email, password, 'tester');
  11  |   });
  12  | 
  13  |   test('should view tester workspace and access demographics modal', async ({ page }) => {
  14  |     // Navigate to /dashboard/tester
  15  |     await page.goto('/dashboard/tester');
  16  | 
  17  |     // Assert page loaded
  18  |     await expect(page.locator('h1')).toContainText('Tester Workspace');
  19  |     await expect(page.locator('text=Verified GCash Receiver')).toBeVisible();
  20  | 
  21  |     // Verify demographic profile configuration modal can be opened
  22  |     await page.click('text=Configure Demographics');
  23  |     await expect(page.locator('h3:has-text("Configure Profile Demographics")')).toBeVisible();
  24  | 
  25  |     // Check one accessibility option
  26  |     await page.locator('label:has-text("I navigate using Keyboard-Only") input').check();
  27  | 
  28  |     // Close the modal
  29  |     await page.click('button:has-text("Cancel")');
  30  |     await expect(page.locator('h3:has-text("Configure Profile Demographics")')).not.toBeVisible();
  31  |   });
  32  | 
  33  |   test('should complete the 5-second Quick Impression task page', async ({ page }) => {
  34  |     // Create a mock listing with is_quick_impression: true
  35  |     const uniqueTitle = `E2E Tester Job ${Date.now()}`;
  36  |     const listing = await createMockListing(uniqueTitle, true);
  37  | 
  38  |     // Navigate to /dashboard/tester/tasks/five-second/[id]
  39  |     await page.goto(`/dashboard/tester/tasks/five-second/${listing.id}`);
  40  | 
  41  |     // Wait for the agreement modal to be visible
> 42  |     await expect(page.locator('text=Acknowledge Testing Guidelines')).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  43  | 
  44  |     // Scroll to bottom of the Agreement modal to enable the Accept button
  45  |     const ndaScroll = page.locator('.overflow-y-auto.flex-1');
  46  |     await ndaScroll.evaluate(async (el) => {
  47  |       el.scrollTop = el.scrollHeight;
  48  |       el.dispatchEvent(new Event('scroll'));
  49  |       await new Promise(resolve => setTimeout(resolve, 50));
  50  |       el.scrollTop = el.scrollHeight;
  51  |       el.dispatchEvent(new Event('scroll'));
  52  |     });
  53  | 
  54  |     // Accept the agreement
  55  |     await page.click('button:has-text("Accept")');
  56  | 
  57  |     // Assert the cover page loaded with correct title
  58  |     await expect(page.locator('h1')).toContainText(uniqueTitle);
  59  | 
  60  |     // Verify the "Start 5-Second Test" button is visible and click it
  61  |     const startButton = page.locator('button:has-text("Start 5-Second Test")');
  62  |     await expect(startButton).toBeVisible();
  63  |     await startButton.click();
  64  | 
  65  |     // Verify the impression countdown timer loads and displays
  66  |     await expect(page.locator('text=Viewing:')).toBeVisible();
  67  | 
  68  |     // Click on the design image to register a click (first-click heatmap coordinates)
  69  |     const designImg = page.locator('img[alt*="Design screenshot"]');
  70  |     await expect(designImg).toBeVisible();
  71  |     await designImg.click();
  72  | 
  73  |     // Wait for it to expire and transition to the questionnaire step (takes 5 seconds)
  74  |     await expect(page.locator('text=What do you remember about the design?')).toBeVisible({ timeout: 10000 });
  75  | 
  76  |     // Verify the questionnaire step enables the response form
  77  |     const responseTextArea = page.locator('textarea');
  78  |     await expect(responseTextArea).toBeEnabled();
  79  | 
  80  |     // Fill in the questionnaire response
  81  |     await responseTextArea.fill('The design looked extremely clean and well structured, focusing on banking styles.');
  82  | 
  83  |     // Select visual clarity rating (e.g. 5)
  84  |     await page.click('button:has-text("5")');
  85  | 
  86  |     // Click submit button
  87  |     await page.click('button:has-text("Submit Test Output")');
  88  | 
  89  |     // Verify successful submission UI loading
  90  |     await expect(page.locator('text=Submitted!')).toBeVisible({ timeout: 10000 });
  91  |     await expect(page.locator('text=Post-Test Debrief Thread')).toBeVisible();
  92  | 
  93  |     // Type a comment and hit Send
  94  |     const commentInput = page.locator('input[placeholder*="Type your comment"]');
  95  |     await expect(commentInput).toBeVisible();
  96  |     await commentInput.fill('This is an E2E test comment.');
  97  |     await page.click('button:has-text("Send")');
  98  | 
  99  |     // Assert that the comment appears on the screen
  100 |     await expect(page.locator('text=This is an E2E test comment.')).toBeVisible();
  101 |   });
  102 | });
  103 | 
```