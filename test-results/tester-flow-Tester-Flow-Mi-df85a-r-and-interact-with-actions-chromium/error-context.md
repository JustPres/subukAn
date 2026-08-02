# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tester-flow.spec.ts >> Tester Flow & Milestone 4 Features E2E >> should open notification center drawer and interact with actions
- Location: tests\e2e\tester-flow.spec.ts:13:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Payout Approved')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Payout Approved')

```

```yaml
- complementary:
  - text: subukAn
  - navigation:
    - link "Available Tasks":
      - /url: /dashboard/tester
      - img
      - text: Available Tasks
    - link "My Submissions":
      - /url: /dashboard/tester#submissions
      - img
      - text: My Submissions
    - link "Earnings":
      - /url: /dashboard/tester#earnings
      - img
      - text: Earnings
  - link "Switch Role":
    - /url: /dashboard?select=true
    - img
    - text: Switch Role
  - button "Logout":
    - img
    - text: Logout
- banner:
  - text: subukAn
  - button "Open notifications" [expanded]:
    - img
  - heading "Notifications" [level=3]
  - button:
    - img
  - img
  - paragraph: No notifications yet
  - paragraph: Updates regarding payouts, submissions, and alerts will appear here.
  - text: subukAn Real-Time Event Alerts
- main:
  - navigation "Breadcrumb":
    - link "Dashboard":
      - /url: /dashboard
    - img
    - text: Tester
  - text: 📱
  - heading "Tester Workspace" [level=1]
  - paragraph: Browse funded listings, claim testing slots, track your submissions, and withdraw earnings.
  - button "👤 Profile & Notifications"
  - img
  - text: Verified GCash Receiver 0917-***-5678
  - img
  - text: Available Balance ₱0.00
  - button "Withdraw" [disabled]
  - img
  - text: Submissions Recorded 3 Tasks
  - navigation "Tabs":
    - button "Available Tests (0)":
      - img
      - text: Available Tests (0)
    - button "My Submissions (3)":
      - img
      - text: My Submissions (3)
    - button "Earnings & Payout History":
      - img
      - text: Earnings & Payout History
  - heading "Open Testing Opportunities" [level=2]
  - text: Updated in real-time
  - paragraph: No matching tasks found
  - paragraph: Try configuring your profile demographics to unlock more target-matched jobs.
  - button "Update Demographics Profile"
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { bypassAuth, createMockListing } from './helpers';
  3   | 
  4   | test.describe('Tester Flow & Milestone 4 Features E2E', () => {
  5   |   const email = 'test-tester@example.com';
  6   |   const password = 'password123';
  7   | 
  8   |   test.beforeEach(async ({ context }) => {
  9   |     // Log in programmatically as tester
  10  |     await bypassAuth(context, email, password, 'tester');
  11  |   });
  12  | 
  13  |   test('should open notification center drawer and interact with actions', async ({ page }) => {
  14  |     await page.goto('/dashboard/tester');
  15  | 
  16  |     // Click Notification Bell button in header
  17  |     const bellButton = page.locator('button[aria-label="Open notifications"]');
  18  |     await expect(bellButton).toBeVisible();
  19  |     await bellButton.click();
  20  | 
  21  |     // Verify Notification Drawer opened
  22  |     await expect(page.locator('h3:has-text("Notifications")')).toBeVisible();
> 23  |     await expect(page.locator('text=Payout Approved')).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  24  | 
  25  |     // Click "Mark all read"
  26  |     const markAllReadBtn = page.locator('button:has-text("Mark all read")');
  27  |     if (await markAllReadBtn.isVisible()) {
  28  |       await markAllReadBtn.click();
  29  |     }
  30  | 
  31  |     // Close drawer
  32  |     await page.keyboard.press('Escape');
  33  |   });
  34  | 
  35  |   test('should navigate tester dashboard tabs and open profile & dispute modals', async ({ page }) => {
  36  |     await page.goto('/dashboard/tester');
  37  | 
  38  |     // Assert page loaded
  39  |     await expect(page.locator('h1')).toContainText('Tester Workspace');
  40  | 
  41  |     // 1. Test Tab Switching: "My Submissions"
  42  |     await page.click('button:has-text("My Submissions")');
  43  |     await expect(page.locator('h2:has-text("Your Submission History")')).toBeVisible();
  44  | 
  45  |     // Verify rejected submission presents "Submit Rejection Dispute" button
  46  |     const disputeTrigger = page.locator('button:has-text("Submit Rejection Dispute")').first();
  47  |     if (await disputeTrigger.isVisible()) {
  48  |       await disputeTrigger.click();
  49  | 
  50  |       // Verify Dispute Modal opened
  51  |       await expect(page.locator('h3:has-text("Submit Rejection Dispute")')).toBeVisible();
  52  | 
  53  |       // Fill in dispute explanation
  54  |       const explanationInput = page.locator('textarea[placeholder*="Explain why the rejection was unfair"]');
  55  |       await expect(explanationInput).toBeVisible();
  56  |       await explanationInput.fill('I executed all steps accurately as requested in the testing scenario.');
  57  | 
  58  |       // Click Submit Dispute
  59  |       await page.click('button:has-text("Submit Dispute")');
  60  | 
  61  |       // Verify success message
  62  |       await expect(page.locator('h4:has-text("Dispute Submitted!")')).toBeVisible({ timeout: 5000 });
  63  |     }
  64  | 
  65  |     // 2. Test Tab Switching: "Earnings & Payout History"
  66  |     await page.click('button:has-text("Earnings & Payout History")');
  67  |     await expect(page.locator('h3:has-text("GCash Payout History")')).toBeVisible();
  68  |     await expect(page.locator('text=Total Earnings')).toBeVisible();
  69  | 
  70  |     // 3. Test Profile Modal
  71  |     await page.click('button:has-text("Profile & Notifications")');
  72  |     await expect(page.locator('h3:has-text("Tester Profile Settings")')).toBeVisible();
  73  | 
  74  |     // Switch to Notification Settings tab in modal
  75  |     await page.click('button:has-text("Notification Settings")');
  76  |     await expect(page.locator('text=Payout Approval Alerts')).toBeVisible();
  77  | 
  78  |     // Close modal
  79  |     await page.click('button:has-text("Cancel")');
  80  |     await expect(page.locator('h3:has-text("Tester Profile Settings")')).not.toBeVisible();
  81  |   });
  82  | 
  83  |   test('should complete the 5-second Quick Impression task page', async ({ page }) => {
  84  |     // Create a mock listing with is_quick_impression: true
  85  |     const uniqueTitle = `E2E Tester Job ${Date.now()}`;
  86  |     const listing = await createMockListing(uniqueTitle, true);
  87  | 
  88  |     // Navigate to /dashboard/tester/tasks/five-second/[id]
  89  |     await page.goto(`/dashboard/tester/tasks/five-second/${listing.id}`);
  90  | 
  91  |     // Wait for the agreement modal to be visible
  92  |     await expect(page.locator('text=Acknowledge Testing Guidelines')).toBeVisible();
  93  | 
  94  |     // Scroll to bottom of the Agreement modal to enable the Accept button
  95  |     const ndaScroll = page.locator('[data-testid="agreement-modal-content"]');
  96  |     await ndaScroll.evaluate(async (el) => {
  97  |       el.scrollTop = el.scrollHeight;
  98  |       el.dispatchEvent(new Event('scroll'));
  99  |       await new Promise(resolve => setTimeout(resolve, 50));
  100 |       el.scrollTop = el.scrollHeight;
  101 |       el.dispatchEvent(new Event('scroll'));
  102 |     });
  103 | 
  104 |     // Accept the agreement
  105 |     await page.click('button:has-text("Accept")');
  106 | 
  107 |     // Assert the cover page loaded with correct title
  108 |     await expect(page.locator('h1')).toContainText(uniqueTitle);
  109 | 
  110 |     // Verify the "Start 5-Second Test" button is visible and click it
  111 |     const startButton = page.locator('button:has-text("Start 5-Second Test")');
  112 |     await expect(startButton).toBeVisible();
  113 |     await startButton.click();
  114 | 
  115 |     // Verify the impression countdown timer loads and displays
  116 |     await expect(page.locator('text=Viewing:')).toBeVisible();
  117 | 
  118 |     // Click on the design image to register a click (first-click heatmap coordinates)
  119 |     const designImg = page.locator('img[alt*="Design screenshot"]');
  120 |     await expect(designImg).toBeVisible();
  121 |     await designImg.click();
  122 | 
  123 |     // Wait for it to expire and transition to the questionnaire step (takes 5 seconds)
```